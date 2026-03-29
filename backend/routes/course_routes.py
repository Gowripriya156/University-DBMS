from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

course_bp = Blueprint('course', __name__)

@course_bp.route('/', methods=['GET'])
def get_courses():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeCourses', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT * FROM vw_CourseOfferings")
            results = cursor.fetchall()
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@course_bp.route('/<ccode>', methods=['GET'])
def get_course(ccode):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT c.*, d.DName FROM Course c LEFT JOIN Dept d ON c.DCode = d.DCode WHERE c.CCode = %s", (ccode,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result: return jsonify(result), 200
        return jsonify({"error": "Course not found"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@course_bp.route('/', methods=['POST'])
def add_course():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_AddCourse', [data.get('ccode'), data.get('coname'), data.get('credits'), data.get('dcode')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@course_bp.route('/<ccode>', methods=['PUT'])
def update_course(ccode):
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_UpdateCourse', [ccode, data.get('coname'), data.get('credits'), data.get('dcode')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@course_bp.route('/<ccode>', methods=['DELETE'])
def delete_course(ccode):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_DeleteCourse', [ccode])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400
