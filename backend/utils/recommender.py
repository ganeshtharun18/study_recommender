from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import mysql.connector
from database.db import get_db_connection

def fetch_materials():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM study_materials")
    materials = cursor.fetchall()
    conn.close()
    return materials

def recommend_materials(query):
    materials = fetch_materials()
    titles = [m['title'] for m in materials]
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform(titles + [query])
    sim_scores = cosine_similarity(vectors[-1], vectors[:-1])
    top_indices = sim_scores[0].argsort()[-5:][::-1]
    return [materials[i] for i in top_indices]
