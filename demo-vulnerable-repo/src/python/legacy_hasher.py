import hashlib
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
import jwt

def compute_document_fingerprint(data: bytes) -> str:
    """Uses deprecated SHA-1 hash."""
    hasher = hashlib.sha1()
    hasher.update(data)
    return hasher.hexdigest()

def generate_legacy_rsa_key():
    """Generates 2048-bit RSA key using cryptography hazmat."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    return private_key

def sign_payload_rsa(private_key, payload: bytes) -> bytes:
    signature = private_key.sign(
        payload,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return signature

def create_auth_token(claims: dict, pem_key: str) -> str:
    return jwt.encode(claims, pem_key, algorithm="RS256")
