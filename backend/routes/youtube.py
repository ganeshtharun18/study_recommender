# routes/youtube.py
from flask import Blueprint, request, jsonify
import requests
#from youtube_api import search_youtube_videos
bp = Blueprint('youtube', __name__, url_prefix='/api/youtube')

YOUTUBE_API_KEY = "AIzaSyBGjB7pdO0e6qpJxWZKwnniIQzsmrvsIiE"  # Replace with your key

@bp.route('/search', methods=['GET'])
def search_youtube():
    topic = request.args.get('topic')
    if not topic:
        return jsonify({"error": "Topic is required"}), 400

    url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={topic}+lecture&type=video&key={YOUTUBE_API_KEY}&maxResults=5"

    response = requests.get(url)
    data = response.json()

    videos = [{
        "title": item["snippet"]["title"],
        "videoId": item["id"]["videoId"],
        "thumbnail": item["snippet"]["thumbnails"]["default"]["url"],
        "channelTitle": item["snippet"]["channelTitle"]
    } for item in data.get("items", [])]

    return jsonify(videos)
