import os
from googleapiclient.discovery import build
from config import Config

YOUTUBE_API_KEY = "AIzaSyBGjB7pdO0e6qpJxWZKwnniIQzsmrvsIiE"

def search_youtube_videos(query, max_results=5):
    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    request = youtube.search().list(
        part="snippet",
        q=query,
        maxResults=max_results,
        type="video"
    )
    response = request.execute()

    videos = []
    for item in response.get("items", []):
        video = {
            "title": item["snippet"]["title"],
            "url": f"https://www.youtube.com/watch?v={item['id']['videoId']}",
            "thumbnail": item["snippet"]["thumbnails"]["default"]["url"]
        }
        videos.append(video)

    return videos

