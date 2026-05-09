import asyncio
import os
import tempfile
from app.db.database import SessionLocal
from app.models.document import Document
from app.utils.pdf_loader import extract_text
from app.utils.chunking import chunk_text
from app.services.vector_service import store_chunks
from app.services.storage_service import storage_service


async def index_document(document_id: int, file_path: str, filename: str, user_id: int):
    db = SessionLocal()
    temp_local_path = None

    try:
        document = db.query(Document).filter(Document.id == document_id).first()

        if document is None:
            return

        document.status = "processing"
        document.error_message = None
        db.commit()

        # Check if file_path is a GCS path or local path
        if file_path.startswith("uploads/"):
            # Download from GCS to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                content = storage_service.download_file(file_path)
                if not content:
                    raise Exception("Failed to download file from Supabase Storage")
                tmp.write(content)
                temp_local_path = tmp.name
            processing_path = temp_local_path
        else:
            processing_path = file_path

        text = await asyncio.to_thread(extract_text, processing_path)

        if not text.strip():
            document.status = "failed"
            document.error_message = "No text found in PDF"
            db.commit()
            return

        chunks = await asyncio.to_thread(chunk_text, text)

        if not chunks:
            document.status = "failed"
            document.error_message = "No chunks created from PDF"
            db.commit()
            return

        await asyncio.to_thread(
            store_chunks,
            chunks,
            filename,
            str(user_id),
            str(document_id)
        )

        document.status = "indexed"
        document.error_message = None
        db.commit()

    except Exception as e:
        document = db.query(Document).filter(Document.id == document_id).first()

        if document is not None:
            document.status = "failed"
            document.error_message = str(e)
            db.commit()

    finally:
        if temp_local_path and os.path.exists(temp_local_path):
            os.remove(temp_local_path)
        db.close()