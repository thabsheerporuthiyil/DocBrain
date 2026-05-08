import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PayloadSchemaType

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

COLLECTION_NAME = "docbrain_documents"
VECTOR_SIZE = 1024  # Jina embedding size


def main():
    client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
        check_compatibility=False
    )

    # Create collection if not exists
    if not client.collection_exists(COLLECTION_NAME):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        print(f"✅ Collection '{COLLECTION_NAME}' created with vector size: {VECTOR_SIZE}")
    else:
        print(f"ℹ️ Collection '{COLLECTION_NAME}' already exists")

    # Create indexes for filtering
    try:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="user_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("Index created for user_id")
    except Exception:
        print("Index already exists for user_id")

    try:
        client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="document_id",
            field_schema=PayloadSchemaType.KEYWORD
        )
        print("Index created for document_id")
    except Exception:
        print("Index already exists for document_id")


if __name__ == "__main__":
    main()