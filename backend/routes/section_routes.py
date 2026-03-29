from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

section_bp = Blueprint('section', __name__)

@section_bp.route('/', methods=['GET'])
def get_sections():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeSections', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT * FROM vw_SectionDetails")
            results = cursor.fetchall()
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@section_bp.route('/<int:sec_id>', methods=['GET'])
def get_section(sec_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Section WHERE Sec_Id = %s", (sec_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result: return jsonify(result), 200
        return jsonify({"error": "Section not found"}), 404
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@section_bp.route('/', methods=['POST'])
def add_section():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_AddSection', [data.get('secno'), data.get('sem'), data.get('year'), data.get('bldg'), data.get('roomno'), data.get('ccode'), data.get('inst_id')])
        conn.commit()
        result = cursor.stored_results()
        new_id = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(new_id), 201
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@section_bp.route('/<int:sec_id>', methods=['PUT'])
def update_section(sec_id):
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_UpdateSection', [sec_id, data.get('secno'), data.get('sem'), data.get('year'), data.get('bldg'), data.get('roomno'), data.get('ccode'), data.get('inst_id')])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400

@section_bp.route('/<int:sec_id>', methods=['DELETE'])
def delete_section(sec_id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_DeleteSection', [sec_id])
        conn.commit()
        result = cursor.stored_results()
        msg = [r.fetchall() for r in result][0][0]
        cursor.close()
        conn.close()
        return jsonify(msg), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 400
