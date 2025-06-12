from flask import Blueprint, request, jsonify
import mysql.connector
from datetime import datetime, timedelta

bp = Blueprint('streak', __name__, url_prefix='/api/streak')

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="ganesh",
        database="study_recommender"
    )


@bp.route('/<int:user_id>', methods=['GET'])
def get_streak(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get the user's last study session
        cursor.execute("""
            SELECT MAX(session_date) as last_session 
            FROM study_sessions 
            WHERE user_id = %s
        """, (user_id,))
        last_session = cursor.fetchone()

        if not last_session or not last_session['last_session']:
            return jsonify({
                "current_streak": 0,
                "longest_streak": 0,
                "last_active": None
            })

        last_session_date = last_session['last_session']
        today = datetime.now().date()
        last_active = last_session_date.date()

        # Calculate current streak
        current_streak = 0
        check_date = today
        while True:
            cursor.execute("""
                SELECT 1 FROM study_sessions 
                WHERE user_id = %s AND DATE(session_date) = %s
                LIMIT 1
            """, (user_id, check_date))
            if cursor.fetchone():
                current_streak += 1
                check_date -= timedelta(days=1)
            else:
                break

        # Calculate longest streak
        cursor.execute("""
            SELECT session_date 
            FROM study_sessions 
            WHERE user_id = %s 
            ORDER BY session_date
        """, (user_id,))
        dates = [row['session_date'].date() for row in cursor.fetchall()]
        
        longest_streak = 0
        current_run = 1
        for i in range(1, len(dates)):
            if (dates[i] - dates[i-1]).days == 1:
                current_run += 1
                longest_streak = max(longest_streak, current_run)
            else:
                current_run = 1

        return jsonify({
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_active": last_active.isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@bp.route('/update', methods=['POST'])
def update_streak():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Record study session
        cursor.execute("""
            INSERT INTO study_sessions (user_id, session_date, duration_minutes)
            VALUES (%s, NOW(), %s)
        """, (user_id, data.get('duration', 0)))
        conn.commit()

        return jsonify({"message": "Study session recorded"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()