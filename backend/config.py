import os

class Config:
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'Divyar24')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'university_db')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    DEBUG = True
