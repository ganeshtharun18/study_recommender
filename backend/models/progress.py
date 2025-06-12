from database.db import get_connection

class Progress:
    @staticmethod
    def add_quiz_result(user_email, topic, score):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO quiz_results (user_email, topic, score) 
            VALUES (%s, %s, %s)
        """, (user_email, topic, score))
        conn.commit()
        cursor.close()
        conn.close()

    @staticmethod
    def get_progress_summary(user_email):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT topic, COUNT(*) AS attempts, AVG(score) AS avg_score, MAX(score) AS max_score
            FROM quiz_results WHERE user_email = %s GROUP BY topic
        """
        cursor.execute(query, (user_email,))
        summary = cursor.fetchall()
        cursor.close()
        conn.close()
        return summary

    @staticmethod
    def get_progress_details(user_email, topic):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT score, attempt_date FROM quiz_results 
            WHERE user_email = %s AND topic = %s ORDER BY attempt_date ASC
        """
        cursor.execute(query, (user_email, topic))
        details = cursor.fetchall()
        cursor.close()
        conn.close()
        return details
