from app.utils.hash import generate_file_hash


def test_generate_file_hash(tmp_path):
    file_path = tmp_path / "sample.txt"
    file_path.write_text("hello world")

    file_hash = generate_file_hash(str(file_path))

    assert isinstance(file_hash, str)
    assert len(file_hash) == 64