import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'ganesh')  # Replace with your actual MySQL password
    DB_NAME = os.getenv('DB_NAME', 'study_recommender')
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', 'AIzaSyBGjB7pdO0e6qpJxWZKwnniIQzsmrvsIiE')
