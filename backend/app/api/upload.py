import os
import uuid
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import Document
from app.services.indexing_service import index_document
from app.utils.hash import generate_file_hash
from app.services.storage_service import storage_service

router = APIRouter()


@router.post("/")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    filename = file.filename

    if not filename:
        raise HTTPException(status_code=400, detail="Filename is missing")

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Read file content
    content = await file.read()
    
    # Save to a temporary file to generate hash
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(content)
        temp_path = tmp.name

    try:
        file_hash = generate_file_hash(temp_path)

        existing_doc = db.query(Document).filter(
            Document.user_id == current_user.id,
            Document.file_hash == file_hash
        ).first()

        if existing_doc:
            os.remove(temp_path)
            return {
                "message": "File already uploaded",
                "document_id": existing_doc.id,
                "filename": existing_doc.filename,
                "status": existing_doc.status
            }

        # Create document entry first to get ID
        new_document = Document(
            filename=filename,
            file_path="pending", # Will update after Supabase upload
            user_id=current_user.id,
            file_hash=file_hash,
            status="processing"
        )
        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        # Upload to Supabase: storage/user_id/doc_id_filename.pdf
        storage_path = f"uploads/user_{current_user.id}/{new_document.id}_{filename}"
        
        upload_success = storage_service.upload_file(content, storage_path)
        
        if not upload_success:
            db.delete(new_document)
            db.commit()
            raise HTTPException(status_code=500, detail="Failed to upload file to cloud storage")

        new_document.file_path = storage_path
        db.commit()

        background_tasks.add_task(
            index_document,
            new_document.id,
            storage_path,
            filename,
            current_user.id
        )

        return {
            "message": "PDF uploaded successfully. Indexing started.",
            "document_id": new_document.id,
            "filename": filename,
            "status": new_document.status
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)