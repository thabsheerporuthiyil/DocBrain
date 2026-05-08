from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from app.db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="processing")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)