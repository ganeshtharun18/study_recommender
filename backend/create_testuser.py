import mysql.connector
from werkzeug.security import generate_password_hash
from config import Config

def create_test_user():
    # Database connection
    conn = mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME
    )
    cursor = conn.cursor()

    # Define test user
    name = "Test Student"
    email = "teststudent@example.com"
    password = "test123"  # Plaintext password for login
    hashed_password = generate_password_hash(password)
    role = "student"

    # Check if already exists
    cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    if cursor.fetchone():
        print("Test user already exists.")
    else:
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
            (name, email, hashed_password, role)
        )
        conn.commit()
        print(f"Test user created:\n  Email: {email}\n  Password: {password}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    create_test_user()
