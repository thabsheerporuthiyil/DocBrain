import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.rag_service import ask_question
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.chat_message import ChatMessage
from fastapi.responses import StreamingResponse
from app.services.rag_service import stream_answer_events

router = APIRouter()
logger = logging.getLogger("uvicorn.error")


def serialize_sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


class ChatRequest(BaseModel):
    query: str
    document_id: int


def serialize_chat_message(message: ChatMessage):
    return {
        "id": message.id,
        "role": message.role,
        "content": message.content,
        "document_id": message.document_id,
        "sources": json.loads(message.sources) if message.sources else [],
        "created_at": message.created_at,
    }


@router.get("/history/{document_id}")
def get_chat_history(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id,
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc(), ChatMessage.id.asc()).all()

    return {
        "document_id": document_id,
        "messages": [serialize_chat_message(message) for message in messages],
    }


@router.get("/activity")
def get_recent_activity(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent chat messages across all user documents."""
    messages = (
        db.query(ChatMessage)
        .join(Document, ChatMessage.document_id == Document.id)
        .filter(Document.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(limit)
        .all()
    )
    return [serialize_chat_message(msg) for msg in messages]


@router.get("/stats")
def get_usage_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage statistics for the user."""
    total_docs = db.query(Document).filter(Document.user_id == current_user.id).count()
    total_messages = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).count()
    
    # Get count of processing docs
    processing_docs = db.query(Document).filter(
        Document.user_id == current_user.id,
        Document.status == "processing"
    ).count()

    # Get daily message stats for the last 7 days
    from datetime import datetime, timedelta
    from sqlalchemy import func, cast, Date

    seven_days_ago = datetime.utcnow().date() - timedelta(days=6)
    
    daily_messages = (
        db.query(
            cast(ChatMessage.created_at, Date).label("date"),
            func.count(ChatMessage.id).label("count")
        )
        .filter(
            ChatMessage.user_id == current_user.id,
            cast(ChatMessage.created_at, Date) >= seven_days_ago
        )
        .group_by(cast(ChatMessage.created_at, Date))
        .order_by(cast(ChatMessage.created_at, Date).asc())
        .all()
    )

    # Fill in gaps for days with zero messages
    stats_map = {row.date.strftime("%Y-%m-%d"): row.count for row in daily_messages}
    chart_data = []
    for i in range(7):
        day = seven_days_ago + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        chart_data.append({
            "date": day.strftime("%b %d"),
            "messages": stats_map.get(day_str, 0)
        })

    return {
        "total_documents": total_docs,
        "total_messages": total_messages,
        "processing_documents": processing_docs,
        "chart_data": chart_data
    }


@router.post("/")
def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document: Document | None = db.query(Document).filter(
        Document.id == request.document_id,
        Document.user_id == current_user.id
    ).first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    document_status = str(document.status)

    if document_status == "processing":
        raise HTTPException(status_code=400, detail="Document is still processing")

    if document_status == "failed":
        raise HTTPException(
            status_code=400,
            detail=f"Document indexing failed: {document.error_message}"
        )

    history_messages = db.query(ChatMessage).filter(
        ChatMessage.document_id == request.document_id,
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc()).limit(10).all()
    history_messages.reverse()
    chat_history = [{"role": msg.role, "content": msg.content} for msg in history_messages]

    user_message = ChatMessage(
        user_id=current_user.id,
        document_id=request.document_id,
        role="user",
        content=request.query,
        sources=None,
    )

    assistant_content = ""
    assistant_sources: list[dict] = []
    fallback_response = False

    try:
        response = ask_question(
            query=request.query,
            user_id=str(current_user.id),
            document_id=str(request.document_id),
            chat_history=chat_history
        )
        assistant_content = response["answer"]
        assistant_sources = response.get("sources", [])
    except Exception as exc:
        logger.warning(
            "Chat answer generation failed for document %s (user %s): %s",
            request.document_id,
            current_user.id,
            exc,
        )
        assistant_content = (
            "I couldn't generate an answer right now. Please try again in a moment."
        )
        assistant_sources = []
        fallback_response = True

    assistant_message = ChatMessage(
        user_id=current_user.id,
        document_id=request.document_id,
        role="assistant",
        content=assistant_content,
        sources=json.dumps(assistant_sources),
    )

    db.add(user_message)
    db.add(assistant_message)
    db.commit()

    return {
        "answer": assistant_content,
        "sources": assistant_sources,
        "fallback": fallback_response,
    }


@router.delete("/history/{document_id}", status_code=204)
def clear_chat_history(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    db.query(ChatMessage).filter(
        ChatMessage.document_id == document_id,
        ChatMessage.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()


@router.post("/stream")
def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(
        Document.id == request.document_id,
        Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if document.status == "processing":
        raise HTTPException(status_code=400, detail="Document is still processing")

    if document.status == "failed":
        raise HTTPException(
            status_code=400,
            detail=f"Document indexing failed: {document.error_message}"
        )

    history_messages = db.query(ChatMessage).filter(
        ChatMessage.document_id == request.document_id,
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc()).limit(10).all()
    history_messages.reverse()
    chat_history = [{"role": msg.role, "content": msg.content} for msg in history_messages]

    user_message = ChatMessage(
        user_id=current_user.id,
        document_id=request.document_id,
        role="user",
        content=request.query,
        sources=None,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    def event_stream():
        assistant_parts: list[str] = []
        assistant_sources: list[dict] = []
        fallback_response = False

        try:
            yield serialize_sse_event({
                "type": "start",
                "messageId": user_message.id,
            })

            for event in stream_answer_events(
                query=request.query,
                user_id=str(current_user.id),
                document_id=str(request.document_id),
                chat_history=chat_history
            ):
                if event["type"] == "sources":
                    assistant_sources = event.get("sources", [])
                    yield serialize_sse_event(event)
                    continue

                if event["type"] == "delta":
                    token = event.get("content", "")
                    assistant_parts.append(token)
                    yield serialize_sse_event(event)
        except Exception as exc:
            logger.warning(
                "Chat stream generation failed for document %s (user %s): %s",
                request.document_id,
                current_user.id,
                exc,
            )
            fallback_response = True
            fallback_text = (
                "I couldn't generate an answer right now. Please try again in a moment."
            )
            assistant_parts = [fallback_text]
            assistant_sources = []
            yield serialize_sse_event({
                "type": "delta",
                "content": fallback_text,
            })
        finally:
            assistant_content = "".join(assistant_parts).strip()

            if not assistant_content:
                assistant_content = (
                    "I couldn't generate an answer right now. Please try again in a moment."
                )
                fallback_response = True

            assistant_message = ChatMessage(
                user_id=current_user.id,
                document_id=request.document_id,
                role="assistant",
                content=assistant_content,
                sources=json.dumps(assistant_sources),
            )
            db.add(assistant_message)
            db.commit()
            db.refresh(assistant_message)

            yield serialize_sse_event({
                "type": "done",
                "messageId": assistant_message.id,
                "sources": assistant_sources,
                "fallback": fallback_response,
            })

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
