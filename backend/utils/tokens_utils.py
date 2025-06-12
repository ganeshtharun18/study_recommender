from functools import wraps
from flask import request, jsonify, current_app as app
import jwt
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # 1. Token Extraction
            token = request.headers.get('Authorization')
            if not token:
                logger.warning("Attempted access without token")
                return jsonify({
                    "error": "Authentication required",
                    "message": "No authorization token provided"
                }), 401

            # 2. Token Validation
            try:
                # Check Bearer format
                if not token.startswith("Bearer "):
                    logger.warning(f"Invalid token format: {token[:20]}...")
                    return jsonify({
                        "error": "Invalid token format",
                        "message": "Token should start with 'Bearer '"
                    }), 401

                token = token[7:]  # Remove 'Bearer ' prefix
                
                # Basic token structure check
                if len(token.split('.')) != 3:
                    logger.warning("Malformed token structure")
                    return jsonify({
                        "error": "Invalid token",
                        "message": "Token structure is invalid"
                    }), 401

                # 3. Token Decoding
                try:
                    data = jwt.decode(
                        token,
                        app.config['SECRET_KEY'],
                        algorithms=["HS256"],
                        options={
                            'require': ['exp', 'iat', 'user_id', 'email', 'role'],
                            'verify_exp': True
                        }
                    )
                except jwt.InvalidTokenError as e:
                    logger.warning(f"Token decode failed: {str(e)}")
                    return jsonify({
                        "error": "Invalid token",
                        "message": str(e)
                    }), 401

                # 4. Role Verification
                if data['role'] not in allowed_roles:
                    logger.warning(
                        f"User {data.get('email')} with role {data.get('role')} "
                        f"attempted to access {allowed_roles}-restricted endpoint"
                    )
                    return jsonify({
                        "error": "Forbidden",
                        "message": f"Requires {allowed_roles} role(s)"
                    }), 403

                # 5. Additional Security Checks
                # Validate token was issued by us (if using issuer claim)
                if 'iss' in data and data['iss'] != app.config.get('JWT_ISSUER'):
                    logger.warning(f"Invalid token issuer: {data.get('iss')}")
                    return jsonify({
                        "error": "Invalid token issuer",
                        "message": "Token not issued by this service"
                    }), 401

                # Add user info to request context for downstream use
                request.current_user = {
                    'id': data['user_id'],
                    'email': data['email'],
                    'role': data['role']
                }

                logger.info(f"Authorized access by {data['email']} ({data['role']})")
                return f(*args, **kwargs)

            except Exception as e:
                logger.error(f"Unexpected authentication error: {str(e)}")
                return jsonify({
                    "error": "Authentication failed",
                    "message": "An unexpected error occurred"
                }), 500

        return wrapper
    return decorator