import uuid
import hmac
import hashlib
import os

def generate_secure_token():
    base = str(uuid.uuid4())
    secret = os.environ.get('JWT_SECRET', 'weguide_secret').encode('utf-8')
    h = hmac.new(secret, base.encode('utf-8'), hashlib.sha256)
    suffix = h.hexdigest()[:8]
    return f"{base}-{suffix}"

def build_qr_payload(secure_token, public_profile_url):
    # Return just the URL so that native phone cameras automatically open it in the browser
    return public_profile_url
