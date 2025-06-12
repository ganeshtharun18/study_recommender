import mysql.connector
from werkzeug.security import generate_password_hash

# Connect to your MySQL database
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="ganesh",  # <- Replace with your DB password
    database="study_recommender"
)
cursor = conn.cursor(dictionary=True)

# Fetch all users and their current (plaintext) passwords
cursor.execute("SELECT id, hashed_password FROM users")
users = cursor.fetchall()

# Hash and update passwords
for user in users:
    hashed_password = generate_password_hash(user['hashed_password'])
    cursor.execute("UPDATE users SET hashed_password = %s WHERE id = %s", (hashed_password, user['id']))

conn.commit()
cursor.close()
conn.close()

print("✅ All passwords hashed successfully.")
