import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="ganesh",  # Your password here
        database="study_recommender"
    )
    print("Successfully connected to MySQL!")
    conn.close()
except mysql.connector.Error as err:
    print(f"Error: {err}")