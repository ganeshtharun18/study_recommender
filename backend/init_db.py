import mysql.connector

def init_db():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",       # Replace with your MySQL username
        password="ganesh",   # Replace with your MySQL password
        database="study_recommender"  # Replace with your database name
    )

    cursor = conn.cursor()

    # Create study_materials table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS study_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(100) NOT NULL,
        type ENUM('PDF', 'Video', 'Article') NOT NULL,
        difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
        url TEXT NOT NULL,
        uploaded_by VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create user_progress table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(100),
        material_id INT,
        status ENUM('To Learn', 'In Progress', 'Completed') DEFAULT 'To Learn',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES study_materials(id)
    )
    """)

        # Create quiz_questions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic VARCHAR(100),
        question TEXT NOT NULL,
        option_a TEXT,
        option_b TEXT,
        option_c TEXT,
        option_d TEXT,
        correct_option ENUM('A', 'B', 'C', 'D') NOT NULL
    )
    """)

    # Create quiz_results table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quiz_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_email VARCHAR(100),
        topic VARCHAR(100),
        score INT,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    print("[✓] Tables are initialized.")
    conn.commit()
    conn.close()
