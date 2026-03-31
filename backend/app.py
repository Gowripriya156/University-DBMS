from flask import Flask, jsonify
from flask_cors import CORS
from routes.college_routes import college_bp
from routes.dept_routes import dept_bp
from routes.instructor_routes import instructor_bp
from routes.course_routes import course_bp
from routes.student_routes import student_bp
from routes.section_routes import section_bp
from routes.takes_routes import takes_bp
from routes.report_routes import report_bp
from routes.query_routes import query_bp
from routes.auth_routes import auth_bp
from routes.material_routes import material_bp

app = Flask(__name__)
app.json.sort_keys = False
app.url_map.strict_slashes = False
CORS(app) # Enable CORS for all routes

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(college_bp, url_prefix='/api/colleges')
app.register_blueprint(dept_bp, url_prefix='/api/depts')
app.register_blueprint(instructor_bp, url_prefix='/api/instructors')
app.register_blueprint(course_bp, url_prefix='/api/courses')
app.register_blueprint(student_bp, url_prefix='/api/students')
app.register_blueprint(section_bp, url_prefix='/api/sections')
app.register_blueprint(takes_bp, url_prefix='/api/enrollments')
app.register_blueprint(report_bp, url_prefix='/api/reports')
app.register_blueprint(query_bp, url_prefix='/api/queries')
app.register_blueprint(material_bp, url_prefix='/api/materials')

@app.route('/')
def home():
    return jsonify({"message": "University DBMS API is running."})

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
