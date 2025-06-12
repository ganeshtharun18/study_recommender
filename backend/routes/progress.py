from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from utils.tokens_utils import role_required
from datetime import datetime

bp = Blueprint('progress', __name__, url_prefix='/api/progress')

# Update or mark progress (only for students)
@bp.route('/update', methods=['POST'])
@role_required(['student'])
def update_progress():
    data = request.json
    user_email = data.get('user_email')
    material_id = data.get('material_id')
    status = data.get('status')  # 'To Learn', 'In Progress', or 'Completed'

    if not all([user_email, material_id, status]):
        return jsonify({'error': 'Missing required fields'}), 400

    if status not in ['To Learn', 'In Progress', 'Completed']:
        return jsonify({'error': 'Invalid status value'}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if progress already exists
        cursor.execute("""
            SELECT id FROM user_progress 
            WHERE user_email = %s AND material_id = %s
            """, (user_email, material_id))
        existing = cursor.fetchone()

        if existing:
            # Update status (updated_at will auto-update)
            cursor.execute("""
                UPDATE user_progress 
                SET status = %s 
                WHERE user_email = %s AND material_id = %s
                """, (status, user_email, material_id))
        else:
            # Insert new progress
            cursor.execute("""
                INSERT INTO user_progress 
                (user_email, material_id, status) 
                VALUES (%s, %s, %s)
                """, (user_email, material_id, status))

        conn.commit()
        return jsonify({'message': 'Progress updated successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Get user's progress for all materials
@bp.route('/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_user_progress(user_email):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                up.material_id, 
                up.status, 
                up.updated_at AS last_updated, 
                sm.title AS material_name, 
                sm.subject_id, 
                s.name AS subject_name
            FROM user_progress up
            JOIN study_materials sm ON up.material_id = sm.id
            JOIN subjects s ON sm.subject_id = s.id
            WHERE up.user_email = %s
            ORDER BY up.updated_at DESC
            """, (user_email,))

        progress_data = cursor.fetchall()
        
        # Convert datetime objects to strings
        for item in progress_data:
            if 'last_updated' in item and item['last_updated']:
                item['last_updated'] = item['last_updated'].isoformat()

        return jsonify(progress_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Get progress summary by subject
@bp.route('/summary/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_progress_summary(user_email):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                s.id AS subject_id,
                s.name AS subject_name,
                COUNT(sm.id) AS total_materials,
                SUM(CASE WHEN up.status = 'Completed' THEN 1 ELSE 0 END) AS completed_materials,
                ROUND(
                    SUM(CASE WHEN up.status = 'Completed' THEN 1 ELSE 0 END) / 
                    GREATEST(COUNT(sm.id), 1) * 100
                ) AS completion_percentage
            FROM subjects s
            LEFT JOIN study_materials sm ON s.id = sm.subject_id
            LEFT JOIN user_progress up ON sm.id = up.material_id AND up.user_email = %s
            GROUP BY s.id, s.name
            ORDER BY completion_percentage DESC
            """, (user_email,))

        summary = cursor.fetchall()
        
        # Ensure completion_percentage is an integer
        for item in summary:
            item['completion_percentage'] = int(item['completion_percentage']) if item['completion_percentage'] else 0

        return jsonify(summary)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Get recently accessed materials
@bp.route('/recent/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_recent_materials(user_email):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                up.material_id, 
                up.status, 
                up.updated_at AS last_updated, 
                sm.title AS material_name, 
                sm.subject_id, 
                s.name AS subject_name
            FROM user_progress up
            JOIN study_materials sm ON up.material_id = sm.id
            JOIN subjects s ON sm.subject_id = s.id
            WHERE up.user_email = %s
            ORDER BY up.updated_at DESC
            LIMIT 5
            """, (user_email,))

        recent_materials = cursor.fetchall()
        
        # Convert datetime objects to strings
        for item in recent_materials:
            if 'last_updated' in item and item['last_updated']:
                item['last_updated'] = item['last_updated'].isoformat()

        return jsonify(recent_materials)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Get progress statistics
@bp.route('/stats/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_progress_stats(user_email):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Total materials count
        cursor.execute("SELECT COUNT(*) AS total FROM study_materials")
        total_materials = cursor.fetchone()['total']

        # User's progress stats
        cursor.execute("""
            SELECT 
                COUNT(*) AS total_accessed,
                SUM(CASE WHEN status = 'To Learn' THEN 1 ELSE 0 END) AS to_learn,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
            FROM user_progress
            WHERE user_email = %s
            """, (user_email,))
        stats = cursor.fetchone()

        # Calculate percentages
        stats['total_materials'] = total_materials
        stats['not_started'] = total_materials - stats['total_accessed']
        stats['completion_percentage'] = round(
            (stats['completed'] / total_materials * 100) if total_materials > 0 else 0, 
            2
        )

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()