from flask import Blueprint, jsonify
from db import get_db
import mysql.connector

report_bp = Blueprint('report', __name__)

@report_bp.route('/gpa-rankings', methods=['GET'])
def gpa_rankings():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_StudentGPA ORDER BY GPA DESC")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/dept-summary', methods=['GET'])
def dept_summary():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_DeptSummary")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/college-overview', methods=['GET'])
def college_overview():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_CollegeOverview")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/instructor-load', methods=['GET'])
def instructor_load():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_InstructorLoad")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/grade-distribution', methods=['GET'])
def grade_distribution():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_GradeDistribution")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/semester/<sem>/<int:year>', methods=['GET'])
def semester_report(sem, year):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_GetSemesterReport', [sem, year])
        result = cursor.stored_results()
        results = [r.fetchall() for r in result][0]
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/audit-log', methods=['GET'])
def audit_log():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM vw_RecentAuditLog")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/grade-history/<int:sid>', methods=['GET'])
def grade_history(sid):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Grade_History WHERE SId = %s ORDER BY Changed_At DESC", (sid,))
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
