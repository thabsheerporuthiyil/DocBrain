import os
import uuid
import httpx
import logging
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Filter, FieldCondition, MatchValue

load_dotenv()

logger = logging.getLogger("uvicorn.error")

COLLECTION_NAME = "docbrain_documents"

JINA_API_KEY = os.getenv("JINA_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

if not JINA_API_KEY:
    raise ValueError("JINA_API_KEY is missing in .env file")

if not QDRANT_URL:
    raise ValueError("QDRANT_URL is missing in .env file")

if not QDRANT_API_KEY:
    raise ValueError("QDRANT_API_KEY is missing in .env file")

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    check_compatibility=False
)


def get_embedding(text: str, task: str = "retrieval.query") -> list[float]:
    response = httpx.post(
        "https://api.jina.ai/v1/embeddings",
        headers={
            "Authorization": f"Bearer {JINA_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "jina-embeddings-v3",
            "task": task,
            "input": [text],
        },
        timeout=30,
    )

    response.raise_for_status()
    return response.json()["data"][0]["embedding"]


def get_embeddings_batch(texts: list[str], task: str = "retrieval.passage"):
    response = httpx.post(
        "https://api.jina.ai/v1/embeddings",
        headers={
            "Authorization": f"Bearer {JINA_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "jina-embeddings-v3",
            "task": task,
            "input": texts,
        },
        timeout=30,
    )

    response.raise_for_status()

    return [item["embedding"] for item in response.json()["data"]]


def store_chunks(chunks, filename, user_id, document_id):
    points = []

    embeddings = get_embeddings_batch(
        chunks,
        task="retrieval.passage"
    )

    for index, chunk in enumerate(chunks):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embeddings[index],
                payload={
                    "text": chunk,
                    "source": filename,
                    "user_id": user_id,
                    "document_id": document_id,
                    "chunk_index": index,
                },
            )
        )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

    return {
        "message": "Chunks stored successfully",
        "total_chunks": len(chunks)
    }


def search_chunks(query: str, k: int = 3, user_id: str | None = None, document_id: str | None = None):
    query_vector = get_embedding(query, task="retrieval.query")

    q_filter = Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
            FieldCondition(key="document_id", match=MatchValue(value=document_id)),
        ]
    )

    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=q_filter,
        limit=k
    )

    return [
        {
            "page_content": point.payload.get("text", ""),
            "metadata": {
                "source": point.payload.get("source"),
                "user_id": point.payload.get("user_id"),
                "document_id": point.payload.get("document_id"),
                "chunk_index": point.payload.get("chunk_index"),
                "score": point.score,
            }
        }
        for point in results.points
    ]


def get_document_chunks(
    user_id: str,
    document_id: str,
    limit: int = 6,
    fetch_limit: int = 128,
):
    q_filter = Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
            FieldCondition(key="document_id", match=MatchValue(value=document_id)),
        ]
    )

    points, _ = client.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=q_filter,
        with_payload=True,
        with_vectors=False,
        limit=fetch_limit,
    )

    sorted_points = sorted(
        points,
        key=lambda point: point.payload.get("chunk_index", 0),
    )

    return [
        {
            "page_content": point.payload.get("text", ""),
            "metadata": {
                "source": point.payload.get("source"),
                "user_id": point.payload.get("user_id"),
                "document_id": point.payload.get("document_id"),
                "chunk_index": point.payload.get("chunk_index"),
                "score": None,
            },
        }
        for point in sorted_points[:limit]
    ]


def delete_document_vectors(user_id: str, document_id: str):
    q_filter = Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
            FieldCondition(key="document_id", match=MatchValue(value=document_id)),
        ]
    )

    try:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=q_filter
        )
        logger.info(
            "Vectors deleted successfully for document %s (user %s)",
            document_id,
            user_id,
        )
        return True
    except Exception as exc:
        logger.warning(
            "Failed to delete vectors for document %s (user %s): %s",
            document_id,
            user_id,
            exc,
        )
        return False
