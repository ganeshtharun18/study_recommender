from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime, timedelta, date
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

@bp.route('/analytics/<int:user_id>', methods=['GET'])
@token_required
def get_analytics(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get user email first
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found", "status": "error"}), 404
        user_email = user['email']

        # Daily progress
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        
        cursor.execute("""
            SELECT 
                DATE(session_date) as day,
                COUNT(*) as sessions,
                SUM(duration_minutes) as minutes
            FROM study_sessions
            WHERE user_id = %s AND session_date BETWEEN %s AND %s
            GROUP BY DATE(session_date)
            ORDER BY day
        """, (user_id, start_date, end_date))
        
        daily_data = cursor.fetchall()
        
        daily_progress = []
        date_range = [start_date + timedelta(days=x) for x in range(31)]
        
        for day in date_range:
            day_str = day.isoformat()
            day_data = next((d for d in daily_data if d['day'] == day), None)
            daily_progress.append({
                'date': day_str,
                'completed': day_data['minutes'] if day_data else 0,
                'sessions': day_data['sessions'] if day_data else 0
            })

        # Subject distribution - using subject_materials table
        cursor.execute("""
            SELECT 
                s.name as subject_name,
                COUNT(ss.id) as session_count,
                SUM(ss.duration_minutes) as total_minutes
            FROM study_sessions ss
            JOIN subject_materials sm ON ss.material_covered LIKE CONCAT('%', sm.material_name, '%')
            JOIN subjects s ON sm.subject_id = s.id
            WHERE ss.user_id = %s
            GROUP BY s.name
            ORDER BY session_count DESC
            LIMIT 5
        """, (user_id,))
        
        subject_distribution = [
            {
                'subject': row['subject_name'],
                'count': row['session_count'],
                'minutes': row['total_minutes']
            }
            for row in cursor.fetchall()
        ]

        # Activity trends
        cursor.execute("""
            SELECT 
                HOUR(session_date) as hour,
                COUNT(*) as activity_count
            FROM study_sessions
            WHERE user_id = %s
            GROUP BY HOUR(session_date)
            ORDER BY hour
        """, (user_id,))
        
        activity_trends = [
            {
                'hour': row['hour'],
                'activityCount': row['activity_count']
            }
            for row in cursor.fetchall()
        ]

        # Fill missing hours
        full_activity_trends = []
        for hour in range(24):
            hour_data = next((a for a in activity_trends if a['hour'] == hour), None)
            full_activity_trends.append({
                'hour': hour,
                'activityCount': hour_data['activityCount'] if hour_data else 0
            })

        return jsonify({
            "dailyProgress": daily_progress,
            "subjectDistribution": subject_distribution,
            "activityTrends": full_activity_trends,
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch analytics data",
            "details": str(e),
            "status": "error"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@bp.route('/stats/<int:user_id>', methods=['GET'])
@token_required
def get_stats(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get user email first
        cursor.execute("SELECT email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found", "status": "error"}), 404
        user_email = user['email']

        # Total materials count
        cursor.execute("SELECT COUNT(*) as total FROM subject_materials")
        total_result = cursor.fetchone()
        total = total_result['total'] if total_result else 0

        # Completed materials
        cursor.execute("""
            SELECT COUNT(DISTINCT sm.id) as completed
            FROM user_progress up
            JOIN subject_materials sm ON up.material_id = sm.id
            WHERE up.user_email = %s AND up.status = 'Completed'
        """, (user_email,))
        completed_result = cursor.fetchone()
        completed = completed_result['completed'] if completed_result else 0

        # In progress materials
        cursor.execute("""
            SELECT COUNT(DISTINCT sm.id) as in_progress
            FROM user_progress up
            JOIN subject_materials sm ON up.material_id = sm.id
            WHERE up.user_email = %s AND up.status = 'In Progress'
        """, (user_email,))
        in_progress_result = cursor.fetchone()
        in_progress = in_progress_result['in_progress'] if in_progress_result else 0

        # To learn materials
        cursor.execute("""
            SELECT COUNT(DISTINCT sm.id) as to_learn
            FROM user_progress up
            JOIN subject_materials sm ON up.material_id = sm.id
            WHERE up.user_email = %s AND up.status = 'To Learn'
        """, (user_email,))
        to_learn_result = cursor.fetchone()
        to_learn = to_learn_result['to_learn'] if to_learn_result else 0

        # Calculate completion percentage safely
        not_started = max(total - completed - in_progress - to_learn, 0)
        completion_percentage = round((completed / total) * 100, 2) if total > 0 else 0

        return jsonify({
            "total_materials": total,
            "completed": completed,
            "in_progress": in_progress,
            "to_learn": to_learn,
            "completion_percentage": completion_percentage,
            "not_started": not_started,
            "status": "success"
        })

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch stats data",
            "details": str(e),
            "status": "error"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()