from app.core.security import hash_password, verify_password, create_access_token


def test_hash_password():
    password = "Test@1234"

    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True


def test_create_access_token():
    token = create_access_token({"sub": "1", "username": "testuser"})

    assert isinstance(token, str)
    assert len(token) > 20