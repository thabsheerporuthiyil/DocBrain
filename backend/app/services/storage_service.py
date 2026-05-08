import os
import logging
from google.cloud import storage
from google.api_core import exceptions
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

# GCS Configuration
BUCKET_NAME = os.getenv("GCP_BUCKET_NAME")
# For local dev, we might not have GCS credentials, so we can fallback or mock
# In Cloud Run, credentials are automatically picked up from the service account

class CloudStorageService:
    def __init__(self):
        try:
            self.client = storage.Client()
            self.bucket = self.client.bucket(BUCKET_NAME) if BUCKET_NAME else None
        except Exception as e:
            logger.warning(f"GCS Client initialization failed: {e}. Falling back to local storage if needed.")
            self.client = None
            self.bucket = None

    def upload_file(self, file_content: bytes, destination_blob_name: str):
        """Uploads a file to the bucket."""
        if not self.bucket:
            logger.error("GCS Bucket not configured. Upload failed.")
            return False

        try:
            blob = self.bucket.blob(destination_blob_name)
            blob.upload_from_string(file_content, content_type='application/pdf')
            logger.info(f"File {destination_blob_name} uploaded to {BUCKET_NAME}.")
            return True
        except exceptions.GoogleCloudError as e:
            logger.error(f"Failed to upload {destination_blob_name} to GCS: {e}")
            return False

    def download_file(self, blob_name: str) -> bytes:
        """Downloads a file from the bucket as bytes."""
        if not self.bucket:
            logger.error("GCS Bucket not configured. Download failed.")
            return None

        try:
            blob = self.bucket.blob(blob_name)
            content = blob.download_as_bytes()
            return content
        except exceptions.GoogleCloudError as e:
            logger.error(f"Failed to download {blob_name} from GCS: {e}")
            return None

    def delete_file(self, blob_name: str):
        """Deletes a file from the bucket."""
        if not self.bucket:
            logger.error("GCS Bucket not configured. Delete failed.")
            return False

        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            logger.info(f"File {blob_name} deleted from {BUCKET_NAME}.")
            return True
        except exceptions.NotFound:
            logger.warning(f"File {blob_name} not found in {BUCKET_NAME}.")
            return True
        except exceptions.GoogleCloudError as e:
            logger.error(f"Failed to delete {blob_name} from GCS: {e}")
            return False

# Singleton instance
storage_service = CloudStorageService()
