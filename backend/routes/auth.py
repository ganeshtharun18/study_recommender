from flask import Blueprint, request, jsonify, current_app
import mysql.connector
import jwt
import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
from functools import wraps

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Token expiration times (in seconds)
ACCESS_TOKEN_EXPIRATION = 3600  # 1 hour
REFRESH_TOKEN_EXPIRATION = 2592000  # 30 days

def get_connection():
    return mysql.connector.connect(
        host=current_app.config['DB_HOST'],
        user=current_app.config['DB_USER'],
        password=current_app.config['DB_PASSWORD'],
        database=current_app.config['DB_NAME'],
        pool_size=5,
        pool_name="auth_pool",
        pool_reset_session=True
    )

def create_tokens(user_id, email, role, name):
    """Helper function to create both access and refresh tokens"""
    access_payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'name': name,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=ACCESS_TOKEN_EXPIRATION),
        'iat': datetime.datetime.utcnow(),
        'type': 'access',
        'jti': str(uuid.uuid4())  # Unique identifier for access token
    }
    
    refresh_payload = {
        'user_id': user_id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=REFRESH_TOKEN_EXPIRATION),
        'iat': datetime.datetime.utcnow(),
        'type': 'refresh',
        'jti': str(uuid.uuid4())  # Unique identifier for refresh token
    }
    
    access_token = jwt.encode(
        access_payload, 
        current_app.config['SECRET_KEY'], 
        algorithm="HS256"
    )
    
    refresh_token = jwt.encode(
        refresh_payload, 
        current_app.config['SECRET_KEY'], 
        algorithm="HS256"
    )
    
    return access_token, refresh_token, access_payload['jti'], refresh_payload['jti']

def validate_input(data, required_fields):
    """Helper function to validate input data"""
    if not data:
        return False, "No data provided"
    
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return False, f"Missing fields: {', '.join(missing_fields)}"
    
    return True, ""

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    valid, message = validate_input(data, ['name', 'email', 'password'])
    if not valid:
        return jsonify({"error": message}), 400
        
    name = data['name']
    email = data['email'].lower().strip()
    password = data['password']
    role = data.get('role', 'student')

    if '@' not in email:
        return jsonify({"error": "Invalid email format"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered"}), 409

        cursor.execute("""
            INSERT INTO users (name, email, hashed_password, role)
            VALUES (%s, %s, %s, %s)
        """, (name, email, hashed_password, role))
        user_id = cursor.lastrowid
        
        # Create tokens for immediate login after registration
        access_token, refresh_token, _, refresh_jti = create_tokens(user_id, email, role, name)
        
        # Store refresh token in database
        cursor.execute("""
            INSERT INTO refresh_tokens (user_id, token_jti, expires_at)
            VALUES (%s, %s, %s)
        """, (
            user_id,
            refresh_jti,
            datetime.datetime.utcnow() + datetime.timedelta(seconds=REFRESH_TOKEN_EXPIRATION)
        ))
        
        conn.commit()

        return jsonify({
            "message": "User registered successfully",
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "id": user_id,
                "name": name,
                "email": email,
                "role": role
            }
        }), 201

    except mysql.connector.Error as db_err:
        current_app.logger.error(f"Database error during registration: {str(db_err)}")
        return jsonify({"error": "Registration failed"}), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected registration error: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        valid, message = validate_input(data, ['email', 'password'])
        if not valid:
            return jsonify({"error": message}), 400

        email = data['email'].lower().strip()
        password = data['password']

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        if not user or not check_password_hash(user['hashed_password'], password):
            # Don't reveal which one was wrong
            return jsonify({"error": "Invalid credentials"}), 401

        # Create tokens
        access_token, refresh_token, _, refresh_jti = create_tokens(
            user['id'], 
            user['email'], 
            user['role'], 
            user['name']
        )
        
        # Store refresh token in database
        cursor.execute("""
            INSERT INTO refresh_tokens (user_id, token_jti, expires_at)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                token_jti = VALUES(token_jti),
                expires_at = VALUES(expires_at)
        """, (
            user['id'],
            refresh_jti,
            datetime.datetime.utcnow() + datetime.timedelta(seconds=REFRESH_TOKEN_EXPIRATION)
        ))
        
        conn.commit()

        return jsonify({
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
        })

    except Exception as e:
        current_app.logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@bp.route('/refresh', methods=['POST'])
def refresh():
    try:
        data = request.get_json()
        if not data or 'refreshToken' not in data:
            return jsonify({"error": "Refresh token required"}), 400

        refresh_token = data['refreshToken']
        
        try:
            # Verify the token properly
            payload = jwt.decode(
                refresh_token,
                current_app.config['SECRET_KEY'],
                algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Refresh token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid refresh token"}), 401
        
        if payload.get('type') != 'refresh':
            return jsonify({"error": "Invalid token type"}), 401

        # Check if token exists in database
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT * FROM refresh_tokens 
            WHERE token_jti = %s AND user_id = %s AND expires_at > UTC_TIMESTAMP()
            FOR UPDATE  # Lock the row for update
        """, (payload['jti'], payload['user_id']))
        
        token_record = cursor.fetchone()
        
        if not token_record:
            return jsonify({"error": "Invalid or expired refresh token"}), 401
        
        # Get user data
        cursor.execute("SELECT * FROM users WHERE id = %s", (payload['user_id'],))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Create new access token
        new_access_token, _, access_jti, _ = create_tokens(
            user['id'],
            user['email'],
            user['role'],
            user['name']
        )
        
        return jsonify({
            "accessToken": new_access_token,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
        })

    except Exception as e:
        current_app.logger.error(f"Refresh error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@bp.route('/logout', methods=['POST'])
def logout():
    try:
        data = request.get_json()
        if not data or 'refreshToken' not in data:
            return jsonify({"error": "Refresh token required"}), 400

        refresh_token = data['refreshToken']
        
        try:
            # Verify the token to get the payload
            payload = jwt.decode(
                refresh_token,
                current_app.config['SECRET_KEY'],
                algorithms=["HS256"],
                options={"verify_exp": False}  # Allow expired tokens for logout
            )
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        
        if payload.get('type') != 'refresh':
            return jsonify({"error": "Invalid token type"}), 400

        # Delete the refresh token from database
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM refresh_tokens 
            WHERE token_jti = %s AND user_id = %s
        """, (payload['jti'], payload['user_id']))
        
        # Also invalidate all access tokens for this user in a real implementation
        # This would require maintaining a token blacklist or using short-lived tokens
        
        conn.commit()
        
        return jsonify({"message": "Logged out successfully"})

    except Exception as e:
        current_app.logger.error(f"Logout error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()