import os
import mysql.connector
from config import Config

def run_sql_file(filename):
    print(f"Running {filename}...")
    try:
        conn = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            port=Config.MYSQL_PORT,
            database=Config.MYSQL_DB if '00' not in filename else None
        )
        with open(filename, 'r', encoding='utf-8') as f:
            full_sql = f.read()
        
        # Clean current DELIMITER references
        lines = []
        for line in full_sql.split('\n'):
            if line.strip().upper().startswith('DELIMITER'):
                continue
            lines.append(line)
        sql = '\n'.join(lines)
        
        # Primitive delimiter treatment
        sql = sql.replace('//', ';').replace('$$', ';')

        cursor = conn.cursor()
        
        # DISABLE FOREIGN KEY CHECKS for the session
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        # Execute multi
        for result in cursor.execute(sql, multi=True):
            if result.with_rows:
                result.fetchall()
        
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        conn.commit()
        print(f"Successfully ran {filename}")
        
    except Exception as e:
        print(f"Error in {filename}: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

# List
db_scripts_path = '../database/'
scripts = [
    '00_create_database.sql',
    '01_create_tables.sql',
    '02_alter_foreign_keys.sql',
    '03_create_audit_tables.sql',
    '04_indexes.sql',
    '05_functions.sql',
    '06_stored_procedures.sql',
    '07_triggers.sql',
    '08_views.sql',
    '09_complex_queries.sql',
    '10_sample_data.sql',
    '11_auth_roles.sql'
]

for script in scripts:
    path = os.path.join(os.path.dirname(__file__), db_scripts_path, script)
    if os.path.exists(path):
        run_sql_file(path)

print("Database initialization finished.")
