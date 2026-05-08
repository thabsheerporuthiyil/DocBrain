import httpx
import os
from dotenv import load_dotenv

load_dotenv()

response = httpx.post(
    "https://api.jina.ai/v1/embeddings",
    headers={
        "Authorization": f"Bearer {os.getenv('JINA_API_KEY')}",
        "Content-Type": "application/json",
    },
    json={
        "model": "jina-embeddings-v3",
        "input": ["Hello world"],
    },
)

print(response.json())