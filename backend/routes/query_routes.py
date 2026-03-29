from flask import Blueprint, jsonify, request
from db import get_db
import mysql.connector

query_bp = Blueprint('query', __name__)

def execute_query_proc(proc_name, params=None):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        if params is None:
            params = []
        cursor.callproc(proc_name, params)
        result = cursor.stored_results()
        results = [r.fetchall() for r in result]
        cursor.close()
        conn.close()
        return jsonify(results[0] if results else []), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@query_bp.route('/dept-rankings', methods=['GET'])
def dept_rankings():
    return execute_query_proc('sp_Q1_DeptRankings')

@query_bp.route('/low-gpa-depts', methods=['GET'])
def low_gpa_depts():
    return execute_query_proc('sp_Q2_LowGPADepts')

@query_bp.route('/busy-instructors', methods=['GET'])
def busy_instructors():
    sem = request.args.get('sem', 'Fall')
    year = int(request.args.get('year', 2023))
    return execute_query_proc('sp_Q3_BusyInstructors', [sem, year])

@query_bp.route('/unoffered-courses', methods=['GET'])
def unoffered_courses():
    return execute_query_proc('sp_Q4_UnofferedCourses')

@query_bp.route('/all-dept-courses-students', methods=['GET'])
def all_dept_courses_students():
    return execute_query_proc('sp_Q5_AllDeptCoursesStudents')

@query_bp.route('/top-students-by-dept', methods=['GET'])
def top_students_by_dept():
    return execute_query_proc('sp_Q6_TopStudentsByDept')

@query_bp.route('/dept-chairs', methods=['GET'])
def dept_chairs():
    return execute_query_proc('sp_Q7_DeptChairsInst')

@query_bp.route('/sections-by-enrollment', methods=['GET'])
def sections_by_enrollment():
    return execute_query_proc('sp_Q8_SectionsByEnrollment')

@query_bp.route('/failed-students', methods=['GET'])
def failed_students():
    return execute_query_proc('sp_Q9_FailedStudents')

@query_bp.route('/enrollment-trends', methods=['GET'])
def enrollment_trends():
    return execute_query_proc('sp_Q10_EnrollmentTrends')

@query_bp.route('/popular-courses', methods=['GET'])
def popular_courses():
    return execute_query_proc('sp_Q11_PopularCourses')

@query_bp.route('/unenrolled-students', methods=['GET'])
def unenrolled_students():
    return execute_query_proc('sp_Q12_UnenrolledStudents')

@query_bp.route('/same-course-pairs', methods=['GET'])
def same_course_pairs():
    return execute_query_proc('sp_Q13_SameCoursePairs')

@query_bp.route('/dept-grade-distribution', methods=['GET'])
def dept_grade_distribution():
    return execute_query_proc('sp_Q14_DeptGradeDistribution')

@query_bp.route('/most-popular-course-per-sem', methods=['GET'])
def most_popular_course_per_sem():
    return execute_query_proc('sp_Q15_MostPopularCoursePerSem')

@query_bp.route('/never-taught-instructors', methods=['GET'])
def never_taught_instructors():
    return execute_query_proc('sp_Q16_NeverTaughtInstructors')

@query_bp.route('/student-standing', methods=['GET'])
def student_standing():
    return execute_query_proc('sp_Q17_StudentStanding')

@query_bp.route('/most-used-rooms', methods=['GET'])
def most_used_rooms():
    return execute_query_proc('sp_Q18_MostUsedRooms')
