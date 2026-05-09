from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Float
from app.db.database import Base

class LLMLog(Base):
    __tablename__ = "llm_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    model = Column(String, nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    response_time = Column(Float, nullable=True) # In seconds
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
