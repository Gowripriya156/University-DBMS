from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

college_bp = Blueprint('college', __name__)

@college_bp.route('/', methods=['GET'])
def get_colleges():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.execute("SELECT c.*, i.IName as DeanName FROM College c LEFT JOIN Instructor i ON c.Dean_Id = i.Id WHERE c.CName = %s", (college,))
        else:
            cursor.execute("SELECT * FROM College")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@college_bp.route('/<cname>', methods=['GET'])
def get_college(cname):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM College WHERE CName = %s", (cname,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result: return jsonify(result), 200
        return jsonify({"error": "College not found"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@college_bp.route('/', methods=['POST'])
def add_college():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_AddCollege', [data.get('cname'), data.get('coffice'), data.get('cphone'), data.get('dean_id')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@college_bp.route('/<cname>', methods=['PUT'])
def update_college(cname):
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_UpdateCollege', [cname, data.get('coffice'), data.get('cphone'), data.get('dean_id')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@college_bp.route('/<cname>', methods=['DELETE'])
def delete_college(cname):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_DeleteCollege', [cname])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400
