from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from utils.tokens_utils import role_required
from datetime import datetime, timedelta
import re

bp = Blueprint('progress', __name__, url_prefix='/api/progress')

def validate_email(email):
    """Basic email validation"""
    if not email or not isinstance(email, str):
        return False
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))

@bp.route('/update', methods=['POST'])
@role_required(['student'])
def update_progress():
    data = request.get_json(silent=True) or {}
    user_email = data.get('user_email')
    material_id = data.get('material_id')
    status = data.get('status')  # 'To Learn', 'In Progress', or 'Completed'

    # Input validation (unchanged)
    if not all([user_email, material_id, status]):
        return jsonify({'error': 'Missing required fields'}), 400

    if status not in ['To Learn', 'In Progress', 'Completed']:
        return jsonify({'error': 'Invalid status value'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check material exists
        cursor.execute("SELECT id FROM study_materials WHERE id = %s", (material_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Material not found'}), 404

        # Check existing progress
        cursor.execute("""
            SELECT id FROM user_progress 
            WHERE user_email = %s AND material_id = %s
            """, (user_email, material_id))
        existing = cursor.fetchone()

        if existing:
            # Update existing record (MySQL compatible)
            cursor.execute("""
                UPDATE user_progress 
                SET status = %s, updated_at = NOW()
                WHERE user_email = %s AND material_id = %s
                """, (status, user_email, material_id))
            progress_id = existing['id']
        else:
            # Insert new record (MySQL compatible)
            cursor.execute("""
                INSERT INTO user_progress 
                (user_email, material_id, status) 
                VALUES (%s, %s, %s)
                """, (user_email, material_id, status))
            progress_id = cursor.lastrowid

        conn.commit()
        return jsonify({
            'message': 'Progress updated successfully',
            'progress_id': progress_id
        })

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@bp.route('/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_user_progress(user_email):
    if not validate_email(user_email):
        return jsonify({'error': 'Invalid email format'}), 400

    conn = None
    cursor = None
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
        
        # Convert datetime objects to ISO format strings
        for item in progress_data:
            if item.get('last_updated') and isinstance(item['last_updated'], datetime):
                item['last_updated'] = item['last_updated'].isoformat()

        return jsonify(progress_data)

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@bp.route('/summary/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_progress_summary(user_email):
    if not validate_email(user_email):
        return jsonify({'error': 'Invalid email format'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                s.id AS subject_id,
                s.name AS subject_name,
                COUNT(sm.id) AS total_materials,
                COALESCE(SUM(CASE WHEN up.status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed_materials,
                ROUND(
                    COALESCE(SUM(CASE WHEN up.status = 'Completed' THEN 1 ELSE 0 END), 0) / 
                    GREATEST(COUNT(sm.id), 1) * 100
                ) AS completion_percentage
            FROM subjects s
            LEFT JOIN study_materials sm ON s.id = sm.subject_id
            LEFT JOIN user_progress up ON sm.id = up.material_id AND up.user_email = %s
            GROUP BY s.id, s.name
            ORDER BY completion_percentage DESC
            """, (user_email,))

        summary = cursor.fetchall()
        
        # Ensure numeric values are integers
        for item in summary:
            item['total_materials'] = int(item['total_materials']) if item.get('total_materials') else 0
            item['completed_materials'] = int(item['completed_materials']) if item.get('completed_materials') else 0
            item['completion_percentage'] = int(item['completion_percentage']) if item.get('completion_percentage') else 0

        return jsonify(summary)

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@bp.route('/recent/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_recent_materials(user_email):
    if not validate_email(user_email):
        return jsonify({'error': 'Invalid email format'}), 400

    conn = None
    cursor = None
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
            if item.get('last_updated') and isinstance(item['last_updated'], datetime):
                item['last_updated'] = item['last_updated'].isoformat()

        return jsonify(recent_materials)

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@bp.route('/stats/<string:user_email>', methods=['GET'])
@role_required(['student'])
def get_progress_stats(user_email):
    if not validate_email(user_email):
        return jsonify({'error': 'Invalid email format'}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get total materials count
        cursor.execute("SELECT COUNT(*) AS total FROM study_materials")
        total_materials = cursor.fetchone()
        if not total_materials:
            return jsonify({'error': 'Could not retrieve total materials count'}), 500
            
        total_materials = total_materials['total'] or 0

        # Get user's progress stats
        cursor.execute("""
            SELECT 
                COUNT(*) AS total_accessed,
                COALESCE(SUM(CASE WHEN status = 'To Learn' THEN 1 ELSE 0 END), 0) AS to_learn,
                COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0) AS in_progress,
                COALESCE(SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END), 0) AS completed
            FROM user_progress
            WHERE user_email = %s
            """, (user_email,))
        stats = cursor.fetchone() or {}

        # Calculate derived stats
        stats['total_materials'] = int(total_materials)
        stats['total_accessed'] = int(stats.get('total_accessed', 0))
        stats['to_learn'] = int(stats.get('to_learn', 0))
        stats['in_progress'] = int(stats.get('in_progress', 0))
        stats['completed'] = int(stats.get('completed', 0))
        stats['not_started'] = max(0, total_materials - stats['total_accessed'])
        
        # Calculate completion percentage safely
        try:
            stats['completion_percentage'] = round(
                (stats['completed'] / total_materials * 100) if total_materials > 0 else 0, 
                2
            )
        except:
            stats['completion_percentage'] = 0

        return jsonify(stats)

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# New endpoint for subject progress (teacher view)
@bp.route('/subject-progress', methods=['GET'])
@role_required(['teacher'])
def get_subject_progress():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                s.id AS subject_id,
                s.name AS subject_name,
                COUNT(DISTINCT sm.id) AS total_materials,
                COUNT(DISTINCT up.material_id) AS accessed_materials,
                COUNT(DISTINCT CASE WHEN up.status = 'Completed' THEN up.material_id END) AS completed_materials,
                COUNT(DISTINCT up.user_email) AS active_students,
                ROUND(
                    COUNT(DISTINCT CASE WHEN up.status = 'Completed' THEN up.material_id END) / 
                    GREATEST(COUNT(DISTINCT sm.id), 1) * 100
                ) AS completion_percentage
            FROM subjects s
            LEFT JOIN study_materials sm ON s.id = sm.subject_id
            LEFT JOIN user_progress up ON sm.id = up.material_id
            GROUP BY s.id, s.name
            ORDER BY completion_percentage DESC
            """)

        subject_progress = cursor.fetchall()
        
        # Convert numeric values to appropriate types
        for subject in subject_progress:
            subject['total_materials'] = int(subject.get('total_materials', 0))
            subject['accessed_materials'] = int(subject.get('accessed_materials', 0))
            subject['completed_materials'] = int(subject.get('completed_materials', 0))
            subject['active_students'] = int(subject.get('active_students', 0))
            subject['completion_percentage'] = float(subject.get('completion_percentage', 0))

        return jsonify(subject_progress)

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# New endpoint for recent activities (teacher view)
@bp.route('/recent-activities', methods=['GET'])
@role_required(['teacher'])
def get_recent_activities():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Get recent progress updates (last 7 days)
        cursor.execute("""
            SELECT 
                up.user_email,
                up.material_id,
                up.status,
                up.updated_at,
                sm.title AS material_title,
                s.name AS subject_name,
                users.name AS student_name
            FROM user_progress up
            JOIN study_materials sm ON up.material_id = sm.id
            JOIN subjects s ON sm.subject_id = s.id
            JOIN users u ON up.user_email = u.email
            WHERE up.updated_at >= %s
            ORDER BY up.updated_at DESC
            LIMIT 10
            """, (datetime.now() - timedelta(days=7),))

        progress_updates = cursor.fetchall()

        # Get new student registrations (last 7 days)
        cursor.execute("""
            SELECT 
                email AS user_email,
                users.name AS student_name,
                created_at AS updated_at
            FROM users
            WHERE role = 'student' AND created_at >= %s
            ORDER BY created_at DESC
            LIMIT 5
            """, (datetime.now() - timedelta(days=7),))

        new_students = cursor.fetchall()

        # Combine and format the activities
        activities = []
        
        for update in progress_updates:
            activities.append({
                'id': f"progress_{update['material_id']}_{update['user_email']}",
                'type': 'progress_update',
                'content': f"{update['student_name']} marked '{update['material_title']}' as {update['status']}",
                'time': update['updated_at'].isoformat() if isinstance(update['updated_at'], datetime) else update['updated_at'],
                'student_name': update['student_name'],
                'material_title': update['material_title'],
                'subject_name': update['subject_name']
            })
        
        for student in new_students:
            activities.append({
                'id': f"student_{student['user_email']}",
                'type': 'new_student',
                'content': f"New student registered: {student['student_name']}",
                'time': student['updated_at'].isoformat() if isinstance(student['updated_at'], datetime) else student['updated_at'],
                'student_name': student['student_name']
            })

        # Sort all activities by time (newest first)
        activities.sort(key=lambda x: x['time'], reverse=True)
        
        # Return only the most recent 10 activities
        return jsonify(activities[:10])

    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()