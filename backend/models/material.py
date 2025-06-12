from database.db import get_connection

class Material:
    @staticmethod
    def add_material(title, topic, url, uploaded_by):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO study_materials (title, topic, url, uploaded_by) 
            VALUES (%s, %s, %s, %s)
        """, (title, topic, url, uploaded_by))
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def get_materials_by_topic(topic):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM study_materials WHERE topic = %s", (topic,))
        materials = cursor.fetchall()
        cursor.close()
        conn.close()
        return materials
