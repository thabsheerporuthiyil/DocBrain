from app.utils.pdf_loader import extract_text


def test_extract_text_from_pdf():
    text = extract_text("uploads/Local Creator Marketplace – Project Proposal.pdf")

    assert isinstance(text, str)
    assert len(text) > 0