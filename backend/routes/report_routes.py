from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

report_bp = Blueprint('report', __name__)

def get_rbac_filter():
    role = request.headers.get('X-Role', 'University')
    college = request.headers.get('X-College')
    return role, college

@report_bp.route('/gpa-rankings', methods=['GET'])
def gpa_rankings():
    role, college = get_rbac_filter()
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        if role == 'College' and college:
            # Join with Dept to filter by college
            query = """
                SELECT v.* FROM vw_StudentGPA v
                JOIN Student s ON v.SId = s.SId
                JOIN Dept d ON s.DCode = d.DCode
                WHERE d.CName = %s
                ORDER BY v.GPA DESC
            """
            cursor.execute(query, (college,))
        else:
            cursor.execute("SELECT * FROM vw_StudentGPA ORDER BY GPA DESC")
            
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/dept-summary', methods=['GET'])
def dept_summary():
    role, college = get_rbac_filter()
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        if role == 'College' and college:
            cursor.execute("SELECT * FROM vw_DeptSummary WHERE CollegeName = %s", (college,))
        else:
            cursor.execute("SELECT * FROM vw_DeptSummary")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/college-overview', methods=['GET'])
def college_overview():
    role, college = get_rbac_filter()
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        if role == 'College' and college:
            cursor.execute("SELECT * FROM vw_CollegeOverview WHERE CName = %s", (college,))
        else:
            cursor.execute("SELECT * FROM vw_CollegeOverview")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/instructor-load', methods=['GET'])
def instructor_load():
    role, college = get_rbac_filter()
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        if role == 'College' and college:
            query = """
                SELECT v.* FROM vw_InstructorLoad v
                JOIN Instructor i ON v.InstructorId = i.Id
                JOIN Dept d ON i.DCode = d.DCode
                WHERE d.CName = %s
            """
            cursor.execute(query, (college,))
        else:
            cursor.execute("SELECT * FROM vw_InstructorLoad")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/grade-distribution', methods=['GET'])
def grade_distribution():
    role, college = get_rbac_filter()
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        if role == 'College' and college:
            query = """
                SELECT v.* FROM vw_GradeDistribution v
                JOIN Course c ON v.CCode = c.CCode
                JOIN Dept d ON c.DCode = d.DCode
                WHERE d.CName = %s
            """
            cursor.execute(query, (college,))
        else:
            cursor.execute("SELECT * FROM vw_GradeDistribution")
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@report_bp.route('/semester/<sem>/<int:year>', methods=['GET'])
def semester_report(sem, year):
    # This SP didn't have college filtering, returning full for now or adapting
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.callproc('sp_GetSemesterReport', [sem, year])
        resultList = list(cursor.stored_results())
        results = resultList[0].fetchall() if resultList else []
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
