from app.models.document import Document


def test_document_model_creation():
    document = Document(
        filename="sample.pdf",
        file_path="uploads/user_1/1_sample.pdf",
        user_id=1,
        file_hash="a" * 64,
        status="processing"
    )

    assert document.filename == "sample.pdf"
    assert document.user_id == 1
    assert document.status == "processing"
    assert len(document.file_hash) == 64