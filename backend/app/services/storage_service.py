import os
import logging
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = os.getenv("SUPABASE_BUCKET_NAME", "documents")

class SupabaseStorageService:
    def __init__(self):
        self.client: Optional[Client] = None
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info("Supabase Storage client initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
        else:
            logger.warning("Supabase credentials missing. Storage service will not function.")

    def upload_file(self, file_content: bytes, destination_blob_name: str) -> bool:
        """Uploads a file to the Supabase bucket."""
        if not self.client:
            logger.error("Supabase client not initialized.")
            return False

        try:
            # Supabase upload method: storage.from_('bucket').upload('path', 'bytes')
            response = self.client.storage.from_(BUCKET_NAME).upload(
                path=destination_blob_name,
                file=file_content,
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )
            logger.info(f"File {destination_blob_name} uploaded to Supabase bucket '{BUCKET_NAME}'.")
            return True
        except Exception as e:
            logger.error(f"Failed to upload {destination_blob_name} to Supabase: {e}")
            return False

    def download_file(self, blob_name: str) -> Optional[bytes]:
        """Downloads a file from the bucket as bytes."""
        if not self.client:
            logger.error("Supabase client not initialized.")
            return None

        try:
            content = self.client.storage.from_(BUCKET_NAME).download(blob_name)
            return content
        except Exception as e:
            logger.error(f"Failed to download {blob_name} from Supabase: {e}")
            return None

    def delete_file(self, blob_name: str) -> bool:
        """Deletes a file from the bucket."""
        if not self.client:
            logger.error("Supabase client not initialized.")
            return False

        try:
            self.client.storage.from_(BUCKET_NAME).remove([blob_name])
            logger.info(f"File {blob_name} deleted from Supabase bucket '{BUCKET_NAME}'.")
            return True
        except Exception as e:
            logger.error(f"Failed to delete {blob_name} from Supabase: {e}")
            return False

# Singleton instance
storage_service = SupabaseStorageService()
