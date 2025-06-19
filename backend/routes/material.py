from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from contextlib import closing
import mysql.connector
import os
from werkzeug.utils import secure_filename

bp = Blueprint('material', __name__, url_prefix='/api/material')

# Configuration
ALLOWED_EXTENSIONS = {'pdf'}
UPLOAD_FOLDER = 'uploads'

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('/upload', methods=['POST'])
def upload_material():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({
            "status": "error",
            "message": "No file part"
        }), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({
            "status": "error",
            "message": "No selected file"
        }), 400

    # Validate required fields
    required_fields = ['title', 'topic', 'type', 'uploaded_by', 'subject_id']
    data = request.form
    
    if not all(field in data for field in required_fields):
        return jsonify({
            "status": "error",
            "message": "Missing required fields",
            "required_fields": required_fields
        }), 400

    try:
        # Process file upload
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            if not os.path.exists(UPLOAD_FOLDER):
                os.makedirs(UPLOAD_FOLDER)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            url = f"/{UPLOAD_FOLDER}/{filename}"
        else:
            return jsonify({
                "status": "error",
                "message": "Invalid file type"
            }), 400

        with closing(get_db_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                sql = """
                    INSERT INTO study_materials 
                    (title, topic, type, difficulty, url, uploaded_by, subject_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                
                params = (
                    data['title'],
                    data['topic'],
                    data['type'],
                    data.get('difficulty', 'Medium'),
                    url,
                    data['uploaded_by'],
                    data['subject_id']
                )
                
                cursor.execute(sql, params)
                conn.commit()
                
                return jsonify({
                    "status": "success",
                    "message": "Material uploaded successfully",
                    "material_id": cursor.lastrowid,
                    "file_url": url
                }), 201

    except mysql.connector.Error as e:
        return jsonify({
            "status": "error",
            "message": "Database error",
            "error": str(e)
        }), 500
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Server error",
            "error": str(e)
        }), 500


@bp.route('/materials', methods=['GET'])
def get_all_materials():
    try:
        with closing(get_db_connection()) as conn:
            with closing(conn.cursor(dictionary=True)) as cursor:
                # Optional filtering parameters
                topic = request.args.get('topic')
                material_type = request.args.get('type')
                difficulty = request.args.get('difficulty')
                
                base_query = "SELECT * FROM study_materials"
                conditions = []
                params = []
                
                if topic:
                    conditions.append("topic = %s")
                    params.append(topic)
                if material_type:
                    conditions.append("type = %s")
                    params.append(material_type)
                if difficulty:
                    conditions.append("difficulty = %s")
                    params.append(difficulty)
                
                if conditions:
                    base_query += " WHERE " + " AND ".join(conditions)
                
                cursor.execute(base_query, params)
                materials = cursor.fetchall()
                
                return jsonify({
                    "status": "success",
                    "data": materials,
                    "count": len(materials)
                })
                
    except mysql.connector.Error as e:
        return jsonify({
            "status": "error",
            "message": "Database error",
            "error": str(e)
        }), 500
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": "Server error",
            "error": str(e)
        }), 500