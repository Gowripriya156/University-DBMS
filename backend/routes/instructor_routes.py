from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

instructor_bp = Blueprint('instructor', __name__)

@instructor_bp.route('/', methods=['GET'])
def get_instructors():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeInstructors', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT i.*, d.DName FROM Instructor i LEFT JOIN Dept d ON i.DCode = d.DCode")
            results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@instructor_bp.route('/<int:id>', methods=['GET'])
def get_instructor(id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT i.*, d.DName FROM Instructor i LEFT JOIN Dept d ON i.DCode = d.DCode WHERE i.Id = %s", (id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result: return jsonify(result), 200
        return jsonify({"error": "Instructor not found"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@instructor_bp.route('/', methods=['POST'])
def add_instructor():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_AddInstructor', [data.get('iname'), data.get('ioffice'), data.get('iphone'), data.get('rank'), data.get('dcode')])
        conn.commit()
        result = cursor.stored_results()
        new_id = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(new_id), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@instructor_bp.route('/<int:id>', methods=['PUT'])
def update_instructor(id):
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_UpdateInstructor', [id, data.get('iname'), data.get('ioffice'), data.get('iphone'), data.get('rank'), data.get('dcode')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@instructor_bp.route('/<int:id>', methods=['DELETE'])
def delete_instructor(id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_DeleteInstructor', [id])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400
