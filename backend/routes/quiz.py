from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from models.quiz import Quiz
from datetime import datetime
import os
from dotenv import load_dotenv
import json
import logging
from openai import OpenAI  # OpenRouter uses OpenAI-compatible API

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

bp = Blueprint('quiz', __name__, url_prefix='/api/quiz')

# Initialize OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

# ======================
# Quiz Routes
# ======================

@bp.route('/questions/<topic>', methods=['GET'])
def get_questions_by_topic(topic):
    """Get all questions for a specific topic"""
    try:
        questions = Quiz.get_questions_by_topic(topic)
        return jsonify({
            "status": "success",
            "count": len(questions),
            "data": questions
        })
    except Exception as e:
        logger.error(f"Error getting questions by topic: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/questions', methods=['GET'])
def get_all_questions():
    """Get all quiz questions"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM quiz_questions")
        questions = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({
            "status": "success",
            "count": len(questions),
            "data": questions
        })
    except Exception as e:
        logger.error(f"Error getting all questions: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/add', methods=['POST'])
def add_question():
    """Add a new quiz question manually"""
    data = request.json
    try:
        Quiz.add_question(
            id=data['id'],
            topic=data['topic'],
            question=data['question'],
            option_a=data['option_a'],
            option_b=data['option_b'],
            option_c=data['option_c'],
            option_d=data['option_d'],
            correct_option=data['correct_option']
        )
        return jsonify({"message": "Question added successfully"}), 201
    except KeyError as e:
        logger.error(f"Missing field in add question: {str(e)}")
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error adding question: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/upcoming', methods=['GET'])
def get_upcoming_quizzes():
    """Get quizzes scheduled in the future"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DISTINCT topic, MIN(scheduled_at) as next_scheduled 
            FROM quiz_questions 
            WHERE scheduled_at > NOW()
            GROUP BY topic
            ORDER BY next_scheduled ASC
        """)
        upcoming = cursor.fetchall()
        
        # Format datetime
        for quiz in upcoming:
            if quiz['next_scheduled']:
                quiz['next_scheduled'] = quiz['next_scheduled'].isoformat()
        
        cursor.close()
        conn.close()
        return jsonify({
            "status": "success",
            "count": len(upcoming),
            "data": upcoming
        })
    except Exception as e:
        logger.error(f"Error getting upcoming quizzes: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/submit', methods=['POST'])
def submit_quiz():
    """Submit quiz answers and calculate score"""
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Calculate score
        score = 0
        for answer in data['answers']:
            cursor.execute("""
                SELECT correct_option FROM quiz_questions WHERE id = %s
            """, (answer['question_id'],))
            correct = cursor.fetchone()
            if correct and correct['correct_option'] == answer['selected']:
                score += 1
        
        # Store result
        total = len(data['answers'])
        percentage = int((score / total) * 100) if total > 0 else 0
        
        cursor.execute("""
            INSERT INTO quiz_results 
            (user_email, topic, score, total_questions) 
            VALUES (%s, %s, %s, %s)
        """, (data['user_email'], data['topic'], percentage, total))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "score": percentage,
            "correct": score,
            "total": total
        })
    except KeyError as e:
        logger.error(f"Missing field in quiz submission: {str(e)}")
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Error submitting quiz: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/results/<user_email>', methods=['GET'])
def get_user_results(user_email):
    """Get all quiz results for a specific user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM quiz_results 
            WHERE user_email = %s 
            ORDER BY attempted_at DESC
        """, (user_email,))
        results = cursor.fetchall()
        
        # Format datetime
        for result in results:
            result['attempted_at'] = result['attempted_at'].isoformat()
        
        cursor.close()
        conn.close()
        return jsonify({
            "status": "success",
            "count": len(results),
            "data": results
        })
    except Exception as e:
        logger.error(f"Error getting user results: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ======================
# AI Question Generation (OpenRouter)
# ======================

@bp.route('/generate', methods=['POST'])
def generate_question():
    """Generate quiz questions using OpenRouter.ai"""
    # Request validation
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415
    
    data = request.get_json()
    if not data or 'topic' not in data:
        return jsonify({"error": "Missing required 'topic' field"}), 400
    
    try:
        # Debug: Log incoming request
        logger.info(f"Incoming request data: {data}")
        
        # Generate prompt
        prompt = f"""Generate a {data['topic']} multiple-choice quiz question in strict JSON format:
        {{
            "question": "Question text?",
            "options": {{
                "A": "Option A",
                "B": "Option B",
                "C": "Option C",
                "D": "Option D"
            }},
            "answer": "A"
        }}"""
        
        # Safely handle parameters
        try:
            temperature = float(data.get("temperature", 0.7))
            temperature = max(0.1, min(temperature, 1.0))  # Clamp value
        except (TypeError, ValueError) as e:
            logger.warning(f"Invalid temperature, using default. Error: {str(e)}")
            temperature = 0.7

        # Debug: Log API call parameters
        logger.info(f"Calling OpenRouter with temperature: {temperature}")
        
        # Make API request
        response = client.chat.completions.create(
            model="deepseek/deepseek-r1-0528:free",
            messages=[
                {
                    "role": "system",
                    "content": "Return ONLY valid JSON matching the exact requested format."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
            max_tokens=300
        )

        # Debug: Log raw response
        logger.info(f"Raw API response: {response}")
        
        # Parse response
        content = response.choices[0].message.content
        try:
            question_data = json.loads(content)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse JSON: {content}")
            return jsonify({
                "error": "AI returned invalid JSON",
                "raw_response": content
            }), 500

        # Validate structure
        required = {
            'question': str,
            'options': dict,
            'answer': str
        }
        
        for field, field_type in required.items():
            if field not in question_data:
                raise ValueError(f"Missing required field: {field}")
            if not isinstance(question_data[field], field_type):
                raise ValueError(f"Field {field} has wrong type")
        
        if question_data['answer'] not in ['A', 'B', 'C', 'D']:
            raise ValueError("Answer must be A, B, C, or D")

        # Database operations
        conn = None
        cursor = None
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO quiz_questions 
                (topic, question, option_a, option_b, option_c, option_d, correct_option) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (
                    data['topic'],
                    question_data['question'],
                    question_data['options'].get('A', ''),
                    question_data['options'].get('B', ''),
                    question_data['options'].get('C', ''),
                    question_data['options'].get('D', ''),
                    question_data['answer']
                ))
            conn.commit()
            
            return jsonify({
                "status": "success",
                "data": question_data,
                "model": "deepseek-r1-0528:free"
            }), 201
            
        except Exception as db_error:
            if conn:
                conn.rollback()
            logger.error(f"Database error: {str(db_error)}")
            raise db_error
            
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Question generation failed",
            "details": str(e)
        }), 500
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()