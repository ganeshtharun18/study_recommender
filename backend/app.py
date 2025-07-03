# app.py - Main application file
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from openai import OpenAI
import logging
import json
import os
from dotenv import load_dotenv
from init_db import init_db

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configuration
class Config:
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    RATE_LIMIT = "5/minute"
    DEFAULT_MODEL = "deepseek/deepseek-r1-0528:free"
    DB_HOST = os.getenv('DB_HOST')
    DB_USER = os.getenv('DB_USER')
    DB_PASSWORD = os.getenv('DB_PASSWORD')
    DB_NAME = os.getenv('DB_NAME')

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enhanced CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type", 
            "Authorization",
            "Cache-Control",
            "X-Requested-With"
        ],
        "supports_credentials": True,
        "expose_headers": ["Content-Length"],
        "max_age": 86400
    }
})

# Initialize OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=app.config['OPENROUTER_API_KEY'],
)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://",
    default_limits=[app.config['RATE_LIMIT']]
)

# Initialize Database
init_db()

def verify_openrouter_key():
    """Verify OpenRouter API key is valid."""
    try:
        response = client.chat.completions.create(
            model=app.config['DEFAULT_MODEL'],
            messages=[{"role": "user", "content": "Ping"}],
            max_tokens=1,
            extra_headers={
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "API Health Check"
            }
        )
        return True
    except Exception as e:
        logger.error(f"OpenRouter key verification failed: {e}")
        return False

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "services": {
            "openrouter": "connected" if verify_openrouter_key() else "invalid_key"
        }
    })

# AI generation endpoint
@app.route('/api/generate', methods=['POST'])
@limiter.limit(app.config['RATE_LIMIT'])
def generate_content():
    """
    Generate content using OpenRouter.ai
    Expected JSON payload:
    {
        "prompt": "Your question here",
        "model": "openai/gpt-4o" (optional),
        "temperature": 0.7 (optional),
        "json_mode": true (optional)
    }
    """
    try:
        data = request.get_json()
        if not data or 'prompt' not in data:
            return jsonify({"error": "Missing 'prompt' in request"}), 400

        # Configure response format
        response_format = {"type": "json_object"} if data.get("json_mode", False) else None

        # Generate with OpenRouter
        response = client.chat.completions.create(
            model=data.get("model", app.config['DEFAULT_MODEL']),
            messages=[{"role": "user", "content": data['prompt']}],
            temperature=min(max(float(data.get("temperature", 0.7)), 1.0),
            max_tokens=data.get("max_tokens", 1024),
            response_format=response_format,
            extra_headers={
                "HTTP-Referer": "http://yourdomain.com",
                "X-Title": "Quiz API"
            }
        ))

        return jsonify({
            "result": response.choices[0].message.content,
            "model": data.get("model", app.config['DEFAULT_MODEL']),
            "provider": "OpenRouter"
        })

    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

# Import and register all blueprints
from routes.auth import bp as auth_bp,limiter
from routes.material import bp as material_bp
from routes.recommend import bp as recommend_bp
from routes.progress import bp as progress_bp
from routes.quiz import bp as quiz_bp
from routes.youtube import bp as youtube_bp
from routes.streak import bp as streak_bp

app.register_blueprint(auth_bp)
limiter.init_app(app)
app.register_blueprint(material_bp)
app.register_blueprint(recommend_bp)
app.register_blueprint(progress_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(youtube_bp)
app.register_blueprint(streak_bp)

if __name__ == '__main__':
    # Verify API key on startup
    if not verify_openrouter_key():
        logger.error("❌ Invalid OpenRouter API key. Update .env file.")
    else:
        logger.info("✅ OpenRouter API key verified")
    
    app.run(host='0.0.0.0', port=5000, debug=True)