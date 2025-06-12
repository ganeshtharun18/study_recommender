from database.db import get_connection  # Your database connection helper

class User:
    @staticmethod
    def get_user_by_email(email):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user

    @staticmethod
    def create_user(email, hashed_password, name, role='student'):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (email, hashed_password, name, role) VALUES (%s, %s, %s, %s)",
            (email, hashed_password, name, role)
        )
        conn.commit()
        cursor.close()
        conn.close()
