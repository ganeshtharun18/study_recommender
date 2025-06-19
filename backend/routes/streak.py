from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime, timedelta
from functools import wraps

bp = Blueprint('streak', __name__, url_prefix='/api/streak')

# Database connection pool
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "ganesh",
    "database": "study_recommender",
    "pool_name": "streak_pool",
    "pool_size": 5
}

# Initialize connection pool
try:
    connection_pool = mysql.connector.pooling.MySQLConnectionPool(**db_config)
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    connection_pool = None

def get_db_connection():
    if not connection_pool:
        raise RuntimeError("Database connection pool not initialized")
    return connection_pool.get_connection()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        # In a real app, verify JWT token here
        # Example: jwt.decode(token, app.config['SECRET_KEY'])
        return f(*args, **kwargs)
    return decorated

def calculate_streaks(dates):
    if not dates:
        return 0, 0
    
    dates = sorted(dates)
    current_streak = 1
    longest_streak = 1
    previous_date = dates[0]
    
    for date in dates[1:]:
        if (date - previous_date).days == 1:
            current_streak += 1
            longest_streak = max(longest_streak, current_streak)
        elif (date - previous_date).days > 1:
            current_streak = 1
        previous_date = date
    
    # Check if last session was today or yesterday
    today = datetime.now().date()
    last_session = dates[-1]
    
    if last_session == today:
        return current_streak, longest_streak
    elif (today - last_session).days == 1:
        return current_streak, longest_streak
    else:
        return 0, longest_streak

@bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_streak(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get all study sessions for the user
        cursor.execute("""
            SELECT DATE(session_date) as session_date 
            FROM study_sessions 
            WHERE user_id = %s
            ORDER BY session_date
        """, (user_id,))
        
        dates = [row['session_date'] for row in cursor.fetchall()]
        current_streak, longest_streak = calculate_streaks(dates)
        
        last_active = dates[-1] if dates else None
        
        return jsonify({
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_active": last_active.isoformat() if last_active else None,
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch streak data",
            "details": str(e),
            "status": "error"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@bp.route('/update', methods=['POST'])
@token_required
def update_streak():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({
                "error": "User ID required",
                "status": "error"
            }), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Record study session with additional data
        cursor.execute("""
            INSERT INTO study_sessions 
            (user_id, session_date, duration_minutes, material_covered)
            VALUES (%s, NOW(), %s, %s)
        """, (
            user_id, 
            data.get('duration', 0),
            data.get('material', '')
        ))
        conn.commit()

        return jsonify({
            "message": "Study session recorded successfully",
            "status": "success"
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({
            "error": "Failed to record study session",
            "details": str(e),
            "status": "error"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()