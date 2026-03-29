from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

dept_bp = Blueprint('dept', __name__)

@dept_bp.route('/', methods=['GET'])
def get_depts():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            # Reusing the existing view through python to avoid SQL mismatch, or call SP.
            cursor.execute("SELECT * FROM vw_DeptSummary WHERE CollegeName = %s", (college,))
        else:
            cursor.execute("SELECT * FROM vw_DeptSummary")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@dept_bp.route('/<dcode>', methods=['GET'])
def get_dept(dcode):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Dept WHERE DCode = %s", (dcode,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result: return jsonify(result), 200
        return jsonify({"error": "Department not found"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@dept_bp.route('/', methods=['POST'])
def add_dept():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_AddDept', [data.get('dcode'), data.get('dname'), data.get('doffice'), data.get('dphone'), data.get('chair_id'), data.get('cstartdate'), data.get('cname')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@dept_bp.route('/<dcode>', methods=['PUT'])
def update_dept(dcode):
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_UpdateDept', [dcode, data.get('dname'), data.get('doffice'), data.get('dphone'), data.get('chair_id'), data.get('cstartdate'), data.get('cname')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@dept_bp.route('/<dcode>', methods=['DELETE'])
def delete_dept(dcode):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_DeleteDept', [dcode])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@dept_bp.route('/<dcode>/report', methods=['GET'])
def get_dept_report(dcode):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_GetDeptReport', [dcode])
        result = cursor.stored_results()
        report = [r.fetchall() for r in result][0]
        cursor.close()
        conn.close()
        if report: return jsonify(report[0]), 200
        return jsonify({"error": "Report empty or dept not found"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
