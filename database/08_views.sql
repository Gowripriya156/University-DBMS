USE university_db;

-- View 1: vw_StudentTranscript
CREATE OR REPLACE VIEW vw_StudentTranscript AS
SELECT 
    t.SId, 
    fn_GetStudentFullName(t.SId) AS StudentFullName, 
    c.CCode, 
    c.CoName AS CourseName, 
    c.Credits, 
    s.SecNo, 
    s.Sem, 
    s.Year, 
    t.Grade, 
    i.IName AS InstructorName
FROM Takes t
JOIN Section s ON t.Sec_Id = s.Sec_Id
JOIN Course c ON s.CCode = c.CCode
LEFT JOIN Instructor i ON s.Inst_Id = i.Id;

-- View 2: vw_StudentGPA
CREATE OR REPLACE VIEW vw_StudentGPA AS
SELECT 
    s.SId, 
    s.Fname, 
    s.Lname, 
    d.DName AS DeptName, 
    fn_GetStudentGPA(s.SId) AS GPA, 
    fn_GetStudentTotalCredits(s.SId) AS TotalCredits
FROM Student s
LEFT JOIN Dept d ON s.DCode = d.DCode;

-- View 3: vw_DeptSummary
CREATE OR REPLACE VIEW vw_DeptSummary AS
SELECT 
    d.DCode, 
    d.DName AS DeptName, 
    d.CName AS CollegeName, 
    i.IName AS ChairName, 
    fn_GetDeptInstructorCount(d.DCode) AS NumInstructors, 
    fn_GetDeptStudentCount(d.DCode) AS NumStudents, 
    (SELECT COUNT(*) FROM Course c WHERE c.DCode = d.DCode) AS NumCourses, 
    (SELECT COUNT(*) FROM Section s JOIN Course c ON s.CCode = c.CCode WHERE c.DCode = d.DCode) AS NumSections
FROM Dept d
LEFT JOIN Instructor i ON d.Chair_Id = i.Id;

-- View 4: vw_InstructorLoad
CREATE OR REPLACE VIEW vw_InstructorLoad AS
SELECT 
    i.Id AS InstructorId, 
    i.IName AS InstructorName, 
    d.DName AS DeptName, 
    i.Rank, 
    (SELECT COUNT(*) FROM Section s WHERE s.Inst_Id = i.Id AND s.Sem = 'Fall' AND s.Year = YEAR(CURDATE())) AS NumSectionsCurrentSem, 
    (SELECT COUNT(*) FROM Section s WHERE s.Inst_Id = i.Id) AS NumSectionsTotal, 
    fn_GetInstructorCourseCount(i.Id) AS NumDistinctCourses
FROM Instructor i
LEFT JOIN Dept d ON i.DCode = d.DCode;

-- View 5: vw_CourseOfferings
CREATE OR REPLACE VIEW vw_CourseOfferings AS
SELECT 
    c.CCode, 
    c.CoName AS CourseName, 
    c.Credits, 
    c.DCode,
    d.DName AS DeptName, 
    (SELECT COUNT(*) FROM Section s WHERE s.CCode = c.CCode) AS NumSections, 
    fn_GetCourseEnrollmentCount(c.CCode) AS TotalEnrolled, 
    fn_GetCourseAverageGPA(c.CCode) AS AvgGPA
FROM Course c
LEFT JOIN Dept d ON c.DCode = d.DCode;

-- View 6: vw_CollegeOverview
CREATE OR REPLACE VIEW vw_CollegeOverview AS
SELECT 
    c.CName, 
    c.COffice, 
    c.CPhone, 
    i.IName AS DeanName, 
    (SELECT COUNT(*) FROM Dept d WHERE d.CName = c.CName) AS NumDepts, 
    (SELECT COUNT(*) FROM Instructor i2 JOIN Dept d ON i2.DCode = d.DCode WHERE d.CName = c.CName) AS TotalInstructors, 
    (SELECT COUNT(*) FROM Student s JOIN Dept d ON s.DCode = d.DCode WHERE d.CName = c.CName) AS TotalStudents, 
    (SELECT COUNT(*) FROM Course cr JOIN Dept d ON cr.DCode = d.DCode WHERE d.CName = c.CName) AS TotalCourses
FROM College c
LEFT JOIN Instructor i ON c.Dean_Id = i.Id;

-- View 7: vw_SectionDetails
CREATE OR REPLACE VIEW vw_SectionDetails AS
SELECT 
    s.Sec_Id, 
    s.SecNo, 
    c.CoName AS CourseName, 
    c.CCode, 
    c.Credits, 
    c.DCode,
    s.Sem, 
    s.Year, 
    s.Bldg, 
    s.RoomNo, 
    i.IName AS InstructorName, 
    fn_GetSectionEnrollmentCount(s.Sec_Id) AS EnrollmentCount
FROM Section s
JOIN Course c ON s.CCode = c.CCode
LEFT JOIN Instructor i ON s.Inst_Id = i.Id;

-- View 8: vw_StudentEnrollment
CREATE OR REPLACE VIEW vw_StudentEnrollment AS
SELECT 
    s.SId, 
    fn_GetStudentFullName(s.SId) AS StudentFullName, 
    s.Major, 
    s.DCode,
    d.DName AS DeptName, 
    (SELECT COUNT(*) FROM Takes t JOIN Section sec ON t.Sec_Id = sec.Sec_Id WHERE t.SId = s.SId AND t.Grade IS NULL) AS CurrentEnrollments, 
    (SELECT COUNT(*) FROM Takes t JOIN Section sec ON t.Sec_Id = sec.Sec_Id WHERE t.SId = s.SId AND t.Grade NOT IN ('W', 'I', 'F') AND t.Grade IS NOT NULL) AS TotalCoursesCompleted, 
    fn_GetStudentGPA(s.SId) AS GPA
FROM Student s
LEFT JOIN Dept d ON s.DCode = d.DCode;

-- View 9: vw_RecentAuditLog
CREATE OR REPLACE VIEW vw_RecentAuditLog AS
SELECT 
    Log_Id, Table_Name, Operation, Record_Id, Old_Values, New_Values, Changed_By, DATE_FORMAT(Changed_At, '%Y-%m-%d %H:%i:%s') AS Formatted_Time
FROM Audit_Log
ORDER BY Changed_At DESC
LIMIT 100;

-- View 10: vw_GradeDistribution
CREATE OR REPLACE VIEW vw_GradeDistribution AS
SELECT 
    c.CCode, 
    c.CoName AS CourseName, 
    SUM(CASE WHEN t.Grade IN ('A+', 'A', 'A-') THEN 1 ELSE 0 END) AS GradeA_Count, 
    SUM(CASE WHEN t.Grade IN ('B+', 'B', 'B-') THEN 1 ELSE 0 END) AS GradeB_Count, 
    SUM(CASE WHEN t.Grade IN ('C+', 'C', 'C-') THEN 1 ELSE 0 END) AS GradeC_Count, 
    SUM(CASE WHEN t.Grade IN ('D+', 'D', 'D-') THEN 1 ELSE 0 END) AS GradeD_Count, 
    SUM(CASE WHEN t.Grade IN ('F') THEN 1 ELSE 0 END) AS GradeF_Count, 
    fn_GetCourseAverageGPA(c.CCode) AS AvgGPA
FROM Course c
JOIN Section s ON c.CCode = s.CCode
JOIN Takes t ON s.Sec_Id = t.Sec_Id
WHERE t.Grade IS NOT NULL AND t.Grade NOT IN ('W', 'I')
GROUP BY c.CCode, c.CoName;
