import os
import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.models.chat_message import ChatMessage
from app.services.vector_service import delete_document_vectors
from app.services.storage_service import storage_service

router = APIRouter()


@router.get("/")
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    documents = db.query(Document).filter(
        Document.user_id == current_user.id
    ).order_by(Document.created_at.desc()).all()

    return {
        "documents": [
            {
                "document_id": doc.id,
                "filename": doc.filename,
                "status": doc.status,
                "error_message": doc.error_message,
                "uploaded_at": doc.created_at
            }
            for doc in documents
        ]
    }


@router.get("/{document_id}/file")
def get_document_file(
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

    # Check if it's GCS path
    if document.file_path.startswith("uploads/"):
        content = storage_service.download_file(document.file_path)
        if not content:
            raise HTTPException(status_code=404, detail="File not found in cloud storage")
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={document.filename}"}
        )
    
    # Fallback to local
    if not document.file_path or not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=document.file_path,
        media_type="application/pdf",
        filename=document.filename
    )


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    document_query = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    )
    document = document_query.first()

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete from GCS if applicable
    if document.file_path.startswith("uploads/"):
        storage_service.delete_file(document.file_path)
    elif document.file_path and os.path.exists(document.file_path):
        os.remove(document.file_path)

    # Delete associated chat messages first
    db.query(ChatMessage).filter(ChatMessage.document_id == document_id).delete()
    
    vectors_deleted = delete_document_vectors(
        user_id=str(current_user.id),
        document_id=str(document.id)
    )

    rows_deleted = document_query.delete(synchronize_session=False)
    db.commit()

    response = {
        "message": "Document deleted successfully",
        "document_id": document_id
    }

    if rows_deleted == 0:
        response["warning"] = (
            "Document metadata was already removed before delete confirmation."
        )

    if not vectors_deleted:
        response["warning"] = (
            "Document was removed from the app, but vector cleanup could not be completed."
        )

    return response
