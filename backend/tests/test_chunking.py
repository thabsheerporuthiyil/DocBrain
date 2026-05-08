from app.utils.chunking import chunk_text


def test_chunk_text_returns_chunks():
    text = "This is a sample text. " * 100

    chunks = chunk_text(text)

    assert isinstance(chunks, list)
    assert len(chunks) > 0
    assert isinstance(chunks[0], str)