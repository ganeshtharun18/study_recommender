from flask import Flask
from flask_cors import CORS
from routes import auth, material, recommend, progress, quiz, youtube, streak
from init_db import init_db
from config import Config

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
            "Cache-Control",  # Add this line to allow Cache-Control header
            "X-Requested-With"
        ],
        "supports_credentials": True,
        "expose_headers": ["Content-Length"],
        "max_age": 86400
    }
})

# Initialize DB
init_db()

# Register blueprints
app.register_blueprint(auth.bp)
app.register_blueprint(material.bp)
app.register_blueprint(recommend.bp)
app.register_blueprint(progress.bp)
app.register_blueprint(quiz.bp)
app.register_blueprint(youtube.bp)
app.register_blueprint(streak.bp)

if __name__ == '__main__':
    app.run(debug=True)