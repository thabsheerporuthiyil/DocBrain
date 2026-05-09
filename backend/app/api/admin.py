from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chat_message import ChatMessage

router = APIRouter()

def admin_required(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Admin privileges required"
        )
    return current_user

@router.get("/stats", dependencies=[Depends(admin_required)])
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_documents = db.query(Document).count()
    total_messages = db.query(ChatMessage).count()
    
    # Get document status distribution
    status_counts = db.query(
        Document.status, func.count(Document.id)
    ).group_by(Document.status).all()
    
    return {
        "users": total_users,
        "documents": total_documents,
        "messages": total_messages,
        "status_distribution": {status: count for status, count in status_counts}
    }

@router.get("/users", dependencies=[Depends(admin_required)])
def list_users(db: Session = Depends(get_db)):
    # Join with document count
    users_with_counts = db.query(
        User, 
        func.count(Document.id).label("doc_count")
    ).outerjoin(Document).group_by(User.id).all()
    
    return {
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "is_admin": user.is_admin,
                "created_at": user.created_at,
                "document_count": doc_count
            }
            for user, doc_count in users_with_counts
        ]
    }

@router.get("/documents", dependencies=[Depends(admin_required)])
def list_all_documents(db: Session = Depends(get_db)):
    documents = db.query(Document, User.username).join(User).all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "status": doc.status,
                "owner": username,
                "created_at": doc.created_at,
                "error": doc.error_message
            }
            for doc, username in documents
        ]
    }
