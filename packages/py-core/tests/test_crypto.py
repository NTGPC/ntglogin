"""
Tests for crypto module (AES-256-GCM encryption/decryption).
"""
import os
import pytest
from services.crypto import encrypt, decrypt, get_encryption_key


# Set test encryption key (32 bytes = 64 hex chars)
TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"


def test_encryption_decryption():
    """Test that encryption and decryption work correctly."""
    # Set environment variable for test
    os.environ["FILE_ENCRYPTION_KEY"] = TEST_KEY
    
    plaintext = "test_password_123"
    ciphertext = encrypt(plaintext)
    
    assert ciphertext != plaintext
    assert len(ciphertext) > 0
    
    decrypted = decrypt(ciphertext)
    assert decrypted == plaintext


def test_encrypt_empty_string():
    """Test encryption of empty string."""
    os.environ["FILE_ENCRYPTION_KEY"] = TEST_KEY
    
    result = encrypt("")
    assert result == ""


def test_decrypt_empty_string():
    """Test decryption of empty string."""
    os.environ["FILE_ENCRYPTION_KEY"] = TEST_KEY
    
    result = decrypt("")
    assert result == ""


def test_get_encryption_key():
    """Test getting encryption key from env."""
    os.environ["FILE_ENCRYPTION_KEY"] = TEST_KEY
    
    key = get_encryption_key()
    assert len(key) == 32
    assert isinstance(key, bytes)


def test_invalid_key():
    """Test that invalid key raises error."""
    os.environ["FILE_ENCRYPTION_KEY"] = "invalid"
    
    with pytest.raises(ValueError):
        get_encryption_key()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

