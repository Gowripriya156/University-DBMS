import os

# Map of blueprint to stored procedure for college
rbac_map = {
    'dept_routes.py': {
        'old': 'cursor.execute("SELECT * FROM vw_DepartmentSummary")',
        'new': '''role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeDepts', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT * FROM vw_DepartmentSummary")
            results = cursor.fetchall()'''
    },
    'instructor_routes.py': {
        'old': 'cursor.execute("SELECT i.*, d.DName as DName FROM Instructor i LEFT JOIN Dept d ON i.DCode = d.DCode")',
        'new': '''role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeInstructors', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT i.*, d.DName as DName FROM Instructor i LEFT JOIN Dept d ON i.DCode = d.DCode")
            results = cursor.fetchall()'''
    },
    'course_routes.py': {
        'old': 'cursor.execute("SELECT * FROM vw_CourseOfferings")',
        'new': '''role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeCourses', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT * FROM vw_CourseOfferings")
            results = cursor.fetchall()'''
    },
    'student_routes.py': {
        'old': 'cursor.execute("SELECT * FROM vw_StudentEnrollment")\n        results = cursor.fetchall()',
        'new': '''role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeStudents', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT * FROM vw_StudentEnrollment")
            results = cursor.fetchall()'''
    },
    'section_routes.py': {
        'old': 'cursor.execute("SELECT * FROM vw_SectionDetails")',
        'new': '''role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeSections', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT * FROM vw_SectionDetails")
            results = cursor.fetchall()'''
    },
    'takes_routes.py': {
        'old': 'cursor.execute("SELECT t.SId, s.Fname, s.Lname, t.Sec_Id, sec.SecNo, c.CCode, c.CoName, t.Grade FROM Takes t JOIN Student s ON t.SId = s.SId JOIN Section sec ON t.Sec_Id = sec.Sec_Id JOIN Course c ON sec.CCode = c.CCode ORDER BY t.Sec_Id DESC, s.Lname ASC")',
        'new': '''role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.callproc('sp_GetCollegeEnrollments', [college])
            result = cursor.stored_results()
            results = [r.fetchall() for r in result][0] if result else []
        else:
            cursor.execute("SELECT t.SId, s.Fname, s.Lname, t.Sec_Id, sec.SecNo, c.CCode, c.CoName, t.Grade FROM Takes t JOIN Student s ON t.SId = s.SId JOIN Section sec ON t.Sec_Id = sec.Sec_Id JOIN Course c ON sec.CCode = c.CCode ORDER BY t.Sec_Id DESC, s.Lname ASC")
            results = cursor.fetchall()'''
    },
    'college_routes.py': {
        'old': 'cursor.execute("SELECT c.*, i.IName as DeanName FROM College c LEFT JOIN Instructor i ON c.Dean_Id = i.Id")',
        'new': '''role = request.headers.get('X-Role', 'University')
        college = request.headers.get('X-College')
        if role == 'College' and college:
            cursor.execute("SELECT c.*, i.IName as DeanName FROM College c LEFT JOIN Instructor i ON c.Dean_Id = i.Id WHERE c.CName = %s", (college,))
        else:
            cursor.execute("SELECT c.*, i.IName as DeanName FROM College c LEFT JOIN Instructor i ON c.Dean_Id = i.Id")
        results = cursor.fetchall()'''
    }
}

routes_dir = 'c:/Users/JADU/Desktop/DBMS/university-dbms/backend/routes/'
for filename, mods in rbac_map.items():
    filepath = os.path.join(routes_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    # Apply the old -> new
    old_str = mods['old']
    new_str = mods['new']
    
    if old_str in content:
        content = content.replace(old_str, new_str)
        # Also ensure request is imported
        if 'request' not in content:
            content = content.replace('from flask import Blueprint, jsonify', 'from flask import Blueprint, jsonify, request')
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filename}")
    elif 'request.headers.get' not in content:
        # Need manual replace, let's just ignore or warn
        print(f"Failed to find target in {filename}. Check source.")

print("Done.")
