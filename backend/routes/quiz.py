from flask import Blueprint, request, jsonify
from database.db import get_db_connection
from models.quiz import Quiz
from datetime import datetime
import openai
import os

bp = Blueprint('quiz', __name__, url_prefix='/api/quiz')

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
        return jsonify({"error": str(e)}), 500

@bp.route('/add', methods=['POST'])
def add_question():
    """Add a new quiz question"""
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
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
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
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
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
        return jsonify({"error": str(e)}), 500

@bp.route('/generate', methods=['POST'])
def generate_question():
    """Generate a quiz question using AI"""
    data = request.json
    try:
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        prompt = f"""
        Create a multiple choice question about {data['topic']} with:
        - 1 clear question
        - 4 distinct options (A, B, C, D)
        - 1 correct answer
        Format exactly like this:
        Question: [question text]
        A: [option A]
        B: [option B]
        C: [option C]
        D: [option D]
        Answer: [correct letter]
        """
        
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=200,
            temperature=0.7
        )
        
        # Parse response
        lines = [line.strip() for line in response.choices[0].text.split('\n') if line.strip()]
        
        if len(lines) < 6:
            raise ValueError("AI response format invalid")
        
        question_data = {
            'question': lines[0].replace("Question:", "").strip(),
            'option_a': lines[1].replace("A:", "").strip(),
            'option_b': lines[2].replace("B:", "").strip(),
            'option_c': lines[3].replace("C:", "").strip(),
            'option_d': lines[4].replace("D:", "").strip(),
            'correct_option': lines[5].replace("Answer:", "").strip().upper()
        }
        
        # Add to database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO quiz_questions 
            (topic, question, option_a, option_b, option_c, option_d, correct_option) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            data['topic'],
            question_data['question'],
            question_data['option_a'],
            question_data['option_b'],
            question_data['option_c'],
            question_data['option_d'],
            question_data['correct_option']
        ))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "status": "success",
            "message": "Question generated",
            "data": question_data
        }), 201
        
    except KeyError:
        return jsonify({"error": "Topic is required"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500