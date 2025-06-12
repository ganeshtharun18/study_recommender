from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from contextlib import closing
import mysql.connector

bp = Blueprint('material', __name__, url_prefix='/api/material')

@bp.route('/upload', methods=['POST'])
def upload_material():
    required_fields = ['title', 'topic', 'type', 'url', 'uploaded_by']
    data = request.json
    
    # Validate required fields
    if not all(field in data for field in required_fields):
        return jsonify({
            "status": "error",
            "message": "Missing required fields",
            "required_fields": required_fields
        }), 400

    try:
        with closing(get_db_connection()) as conn:
            with closing(conn.cursor()) as cursor:
                sql = """
                    INSERT INTO study_materials 
                    (title, topic, type, difficulty, url, uploaded_by)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """
                params = (
                    data['title'],
                    data['topic'],
                    data['type'],
                    data.get('difficulty', 'Medium'),
                    data['url'],
                    data['uploaded_by']
                )
                
                cursor.execute(sql, params)
                conn.commit()
                
                return jsonify({
                    "status": "success",
                    "message": "Material uploaded successfully",
                    "material_id": cursor.lastrowid
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