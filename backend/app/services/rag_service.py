import os
import json
import httpx
from dotenv import load_dotenv
from app.services.vector_service import get_document_chunks, search_chunks

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing in .env file")


BROAD_QUERY_HINTS = (
    "what is this pdf about",
    "what is this document about",
    "summarize this document",
    "summary of this document",
    "give me an overview",
    "document overview",
    "what does this pdf say",
    "what is in this pdf",
    "is this a resume",
    "is this resume",
    "what kind of document is this",
    "what are the projects",
    "list the projects",
    "what projects are mentioned",
)


def is_broad_overview_query(query: str) -> bool:
    lowered_query = query.strip().lower()
    return any(hint in lowered_query for hint in BROAD_QUERY_HINTS)


def merge_context_docs(primary_docs, additional_docs):
    merged_docs = []
    seen_keys = set()

    for doc in [*primary_docs, *additional_docs]:
        metadata = doc.get("metadata", {})
        key = (
            metadata.get("document_id"),
            metadata.get("chunk_index"),
            doc.get("page_content", ""),
        )

        if key in seen_keys:
            continue

        seen_keys.add(key)
        merged_docs.append(doc)

    return merged_docs


def retrieve_context(query: str, user_id: str, document_id: str):
    semantic_docs = search_chunks(
        query=query,
        k=10,
        user_id=user_id,
        document_id=document_id,
    )

    if is_broad_overview_query(query):
        leading_docs = get_document_chunks(
            user_id=user_id,
            document_id=document_id,
            limit=10,
        )
        return merge_context_docs(leading_docs, semantic_docs)

    return semantic_docs


def build_prompt(query: str, docs):
    context_blocks = []

    for doc in docs:
        metadata = doc.get("metadata", {})
        chunk_number = metadata.get("chunk_index")
        chunk_label = (
            f"Chunk {int(chunk_number) + 1}"
            if isinstance(chunk_number, int)
            else "Chunk"
        )
        context_blocks.append(f"[{chunk_label}]\n{doc['page_content']}")

    context = "\n\n".join(context_blocks)

    system_message = f"""You are DocBrain, a document-grounded assistant.

Rules:
- Answer using ONLY the document excerpts below.
- For broad questions, synthesize the overall document purpose from multiple excerpts.
- If the document appears to be a resume, CV, report, proposal, or similar, say that clearly.
- Do not invent facts, names, titles, dates, or project details.
- If the answer is not supported by the excerpts, say "I don't know based on the provided document excerpts."
- Keep the answer concise, factual, and directly relevant to the question.

Document excerpts:
{context}"""

    return query, system_message


def build_messages(query: str, system_message: str, chat_history: list):
    messages = [
        {
            "role": "system",
            "content": system_message,
        }
    ]
    for msg in chat_history:
        # Groq expects strictly 'user' or 'assistant'
        messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    messages.append({
        "role": "user",
        "content": query,
    })
    return messages


def call_groq(query: str, system_message: str, chat_history: list) -> str:
    try:
        messages = build_messages(query, system_message, chat_history)
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.1,
            },
            timeout=30,
        )

        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]

    except httpx.TimeoutException:
        raise Exception("Groq API timeout. Please try again.")

    except httpx.HTTPStatusError as e:
        raise Exception(f"Groq API error: {e.response.text}")

    except httpx.HTTPError as e:
        raise Exception(f"Groq request failed: {str(e)}")


def stream_groq(query: str, system_message: str, chat_history: list):
    try:
        messages = build_messages(query, system_message, chat_history)
        with httpx.stream(
            "POST",
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "temperature": 0.1,
                "stream": True,
            },
            timeout=60,
        ) as response:

            response.raise_for_status()

            for line in response.iter_lines():
                if not line:
                    continue

                if line.startswith("data: "):
                    data = line.replace("data: ", "")

                    if data == "[DONE]":
                        break

                    chunk = json.loads(data)
                    delta = chunk["choices"][0]["delta"].get("content")

                    if delta:
                        yield delta

    except httpx.TimeoutException:
        raise Exception("Groq API timeout. Please try again.")

    except httpx.HTTPStatusError as e:
        raise Exception(f"Groq API error: {e.response.text}")

    except httpx.HTTPError as e:
        raise Exception(f"Groq request failed: {str(e)}")


def ask_question(query: str, user_id: str, document_id: str, chat_history: list = None):
    if chat_history is None:
        chat_history = []

    docs = retrieve_context(
        query=query,
        user_id=user_id,
        document_id=document_id,
    )

    if not docs:
        return {
            "answer": "No relevant information found in this document.",
            "sources": [],
        }

    q, system_message = build_prompt(query, docs)
    answer = call_groq(q, system_message, chat_history)

    return {
        "answer": answer,
        "sources": [doc["metadata"] for doc in docs],
    }


def stream_answer_events(query: str, user_id: str, document_id: str, chat_history: list = None):
    if chat_history is None:
        chat_history = []

    docs = retrieve_context(
        query=query,
        user_id=user_id,
        document_id=document_id,
    )

    yield {
        "type": "sources",
        "sources": [doc["metadata"] for doc in docs],
    }

    if not docs:
        yield {
            "type": "delta",
            "content": "No relevant information found in this document.",
        }
        return

    q, system_message = build_prompt(query, docs)

    for token in stream_groq(q, system_message, chat_history):
        yield {
            "type": "delta",
            "content": token,
        }
