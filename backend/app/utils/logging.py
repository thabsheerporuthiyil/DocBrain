import time
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.llm_log import LLMLog

def log_llm_usage(user_id: int, model: str, prompt_tokens: int, completion_tokens: int, response_time: float):
    db = SessionLocal()
    try:
        new_log = LLMLog(
            user_id=user_id,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            response_time=response_time
        )
        db.add(new_log)
        db.commit()
    except Exception as e:
        print(f"Failed to log LLM usage: {e}")
    finally:
        db.close()
