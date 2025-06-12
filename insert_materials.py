import requests

materials = [
    {
        "title": "Python for Beginners PDF",
        "topic": "Python",
        "type": "PDF",
        "difficulty": "Easy",
        "url": "https://www.cs.cmu.edu/~112/notes/notes-basics.html",
        "uploaded_by": "admin"
    },
    {
        "title": "Java OOP Video",
        "topic": "Java",
        "type": "Video",
        "difficulty": "Medium",
        "url": "https://www.youtube.com/watch?v=8cm1x4bC610",
        "uploaded_by": "admin"
    },
    {
        "title": "DSA Guide Article",
        "topic": "DSA",
        "type": "Article",
        "difficulty": "Hard",
        "url": "https://www.geeksforgeeks.org/data-structures/",
        "uploaded_by": "admin"
    },
    {
        "title": "Flask Crash Course",
        "topic": "Flask",
        "type": "Video",
        "difficulty": "Medium",
        "url": "https://www.youtube.com/watch?v=Z1RJmh_OqeA",
        "uploaded_by": "admin"
    },
    {
        "title": "HTML & CSS Handbook",
        "topic": "Web Development",
        "type": "PDF",
        "difficulty": "Easy",
        "url": "https://web.stanford.edu/class/cs142/handouts/webdev-cheatsheet.pdf",
        "uploaded_by": "admin"
    }
]

for material in materials:
    response = requests.post("http://127.0.0.1:5000/api/material/upload", json=material)
    print(f"Status: {response.status_code}, Message: {response.json()}")
