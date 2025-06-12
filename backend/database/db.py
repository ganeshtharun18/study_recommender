# database/db.py
# database/db.py
import mysql.connector
from flask import current_app

def get_db_connection():
    conn = mysql.connector.connect(
        host=current_app.config['DB_HOST'],
        user=current_app.config['DB_USER'],
        password=current_app.config['DB_PASSWORD'],
        database=current_app.config['DB_NAME']
    )
    return conn




#Study Material Table (Run in MySQL)

#CREATE TABLE study_materials (
    #id INT AUTO_INCREMENT PRIMARY KEY,
    #title VARCHAR(255) NOT NULL,
    #topic VARCHAR(100) NOT NULL,
   # type ENUM('PDF', 'Video', 'Article') NOT NULL,
   # difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Medium',
   # url TEXT NOT NULL,
   # uploaded_by VARCHAR(100),
    #uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#);
