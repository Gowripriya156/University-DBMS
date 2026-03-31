from pymongo import MongoClient

class NoSQLDatabase:
    def __init__(self):
        try:
            # Assuming a standard local MongoDB setup
            self.client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
            self.db = self.client['university_nosql_db']
            self.materials = self.db['course_materials']
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            self.client = None

nosql_db = NoSQLDatabase()
