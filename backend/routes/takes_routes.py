from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

takes_bp = Blueprint('takes', __name__)

@takes_bp.route('/', methods=['GET'])
def get_enrollments():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeEnrollments', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            query = """
            SELECT t.SId, s.Fname, s.Lname, t.Sec_Id, sec.SecNo, c.CoName, t.Grade, c.CCode 
            FROM Takes t
            JOIN Student s ON t.SId = s.SId
            JOIN Section sec ON t.Sec_Id = sec.Sec_Id
            JOIN Course c ON sec.CCode = c.CCode
            """
            cursor.execute(query)
            results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@takes_bp.route('/', methods=['POST'])
def enroll_student():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_EnrollStudent', [data.get('sid'), data.get('sec_id')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@takes_bp.route('/', methods=['PUT'])
def assign_grade():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_AssignGrade', [data.get('sid'), data.get('sec_id'), data.get('grade')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@takes_bp.route('/', methods=['DELETE'])
def drop_student():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_DropStudent', [data.get('sid'), data.get('sec_id')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400
