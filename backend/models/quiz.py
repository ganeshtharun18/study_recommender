from database.db import get_db_connection

class Quiz:
    @staticmethod
    def get_questions_by_topic(topic):
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM quiz_questions WHERE topic = %s", (topic,))
        questions = cursor.fetchall()
        cursor.close()
        conn.close()
        return questions

    @staticmethod
    def add_question(id,topic, question, option_a, option_b, option_c, option_d, correct_option):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO quiz_questions (id,topic, question, option_a, option_b, option_c, option_d, correct_option) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (id,topic, question, option_a, option_b, option_c, option_d, correct_option))
        conn.commit()
        cursor.close()
        conn.close()
