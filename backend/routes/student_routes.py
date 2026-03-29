from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

student_bp = Blueprint('student', __name__)

@student_bp.route('/', methods=['GET'])
def get_students():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeStudents', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT * FROM vw_StudentEnrollment")
            results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@student_bp.route('/<int:sid>', methods=['GET'])
def get_student(sid):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT s.*, d.DName FROM Student s LEFT JOIN Dept d ON s.DCode = d.DCode WHERE s.SId = %s", (sid,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result: return jsonify(result), 200
        return jsonify({"error": "Student not found"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@student_bp.route('/', methods=['POST'])
def add_student():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_AddStudent', [data.get('fname'), data.get('lname'), data.get('addr'), data.get('phone'), data.get('major'), data.get('dob'), data.get('dcode')])
        conn.commit()
        result = cursor.stored_results()
        new_id = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(new_id), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@student_bp.route('/<int:sid>', methods=['PUT'])
def update_student(sid):
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_UpdateStudent', [sid, data.get('fname'), data.get('lname'), data.get('addr'), data.get('phone'), data.get('major'), data.get('dob'), data.get('dcode')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@student_bp.route('/<int:sid>', methods=['DELETE'])
def delete_student(sid):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_DeleteStudent', [sid])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@student_bp.route('/<int:sid>/transcript', methods=['GET'])
def get_transcript(sid):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_GetStudentTranscript', [sid])
        result = cursor.stored_results()
        results = [r.fetchall() for r in result][0]
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@student_bp.route('/<int:sid>/gpa', methods=['GET'])
def get_gpa(sid):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT fn_GetStudentGPA(%s) AS gpa", (sid,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify(result), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@student_bp.route('/search', methods=['GET'])
def search_students():
    query = request.args.get('q', '')
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_SearchStudents', [query])
        result = cursor.stored_results()
        results = [r.fetchall() for r in result][0]
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
