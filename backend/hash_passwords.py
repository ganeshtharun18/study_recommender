import mysql.connector
from werkzeug.security import generate_password_hash

# ✅ Utility to detect already hashed passwords
def is_already_hashed(pwd: str) -> bool:
    return pwd.startswith("scrypt:") or pwd.startswith("pbkdf2:")

# ✅ MySQL connection setup
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="ganesh",  # 🔐 Change this to your DB password
    database="study_recommender"
)
cursor = conn.cursor(dictionary=True)

# ✅ Fetch all users and their passwords
cursor.execute("SELECT id, email, hashed_password FROM users")
users = cursor.fetchall()

# ✅ Loop through users and hash only plaintext passwords
for user in users:
    current_pwd = user['hashed_password']
    email = user['email']
    user_id = user['id']

    if is_already_hashed(current_pwd):
        print(f"⚠️ Skipping already hashed password for {email}")
        continue

    new_hashed = generate_password_hash(current_pwd)
    cursor.execute(
        "UPDATE users SET hashed_password = %s WHERE id = %s",
        (new_hashed, user_id)
    )
    print(f"✅ Hashed password updated for {email}")

# ✅ Commit and close DB connection
conn.commit()
cursor.close()
conn.close()

print("\n🎉 All passwords hashed successfully (without duplicates).")
