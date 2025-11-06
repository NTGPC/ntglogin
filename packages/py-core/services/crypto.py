"""
AES-256-GCM encryption/decryption for sensitive data (proxy passwords, etc.)
"""
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import os
import base64
from dotenv import load_dotenv

load_dotenv()

# Get encryption key from env (32 bytes = 256 bits for AES-256)
ENCRYPTION_KEY_HEX = os.getenv("FILE_ENCRYPTION_KEY", "")


def get_encryption_key() -> bytes:
    """Get or generate encryption key (32 bytes = 64 hex chars)."""
    if not ENCRYPTION_KEY_HEX:
        raise ValueError("FILE_ENCRYPTION_KEY environment variable not set")
    
    try:
        key = bytes.fromhex(ENCRYPTION_KEY_HEX)
        if len(key) != 32:
            raise ValueError("FILE_ENCRYPTION_KEY must be 64 hex characters (32 bytes)")
        return key
    except ValueError as e:
        raise ValueError(f"Invalid FILE_ENCRYPTION_KEY format: {e}")


def encrypt(plaintext: str) -> str:
    """
    Encrypt plaintext using AES-256-GCM.
    Returns base64-encoded string: nonce + ciphertext + tag
    """
    if not plaintext:
        return ""
    
    key = get_encryption_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)  # 96 bits for GCM
    plaintext_bytes = plaintext.encode('utf-8')
    ciphertext = aesgcm.encrypt(nonce, plaintext_bytes, None)
    
    # Combine nonce + ciphertext (tag is appended by GCM)
    combined = nonce + ciphertext
    return base64.b64encode(combined).decode('utf-8')


def decrypt(ciphertext_b64: str) -> str:
    """
    Decrypt base64-encoded ciphertext (nonce + ciphertext + tag).
    Returns plaintext string.
    """
    if not ciphertext_b64:
        return ""
    
    try:
        key = get_encryption_key()
        aesgcm = AESGCM(key)
        combined = base64.b64decode(ciphertext_b64)
        
        # Extract nonce (12 bytes) and ciphertext (rest includes tag)
        nonce = combined[:12]
        ciphertext = combined[12:]
        
        plaintext_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext_bytes.decode('utf-8')
    except Exception as e:
        raise ValueError(f"Decryption failed: {e}")

