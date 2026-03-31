USE university_db;

DELIMITER //

-- Query 1: List all students with GPA, ranked within their department
CREATE PROCEDURE sp_Q1_DeptRankings()
BEGIN
    SELECT 
        s.SId,
        s.Fname,
        s.Lname,
        d.DName,
        vw.GPA,
        RANK() OVER(PARTITION BY s.DCode ORDER BY vw.GPA DESC) AS DeptRank
    FROM Student s
    JOIN vw_StudentGPA vw ON s.SId = vw.SId
    LEFT JOIN Dept d ON s.DCode = d.DCode;
END //

-- Query 2: Find departments where average GPA is below 2.5
CREATE PROCEDURE sp_Q2_LowGPADepts()
BEGIN
    SELECT 
        vw.DeptName,
        AVG(vw.GPA) AS AvgDeptGPA
    FROM vw_StudentGPA vw
    GROUP BY vw.DeptName
    HAVING AVG(vw.GPA) < 2.5;
END //

-- Query 3: Find instructors teaching more than 3 sections in a given semester/year
CREATE PROCEDURE sp_Q3_BusyInstructors(IN p_sem VARCHAR(20), IN p_year INT)
BEGIN
    SELECT 
        i.Id,
        i.IName,
        COUNT(s.Sec_Id) AS SectionCount
    FROM Instructor i
    JOIN Section s ON i.Id = s.Inst_Id
    WHERE s.Sem = p_sem AND s.Year = p_year
    GROUP BY i.Id, i.IName
    HAVING COUNT(s.Sec_Id) > 3;
END //

-- Query 4: List courses that have NEVER been offered
CREATE PROCEDURE sp_Q4_UnofferedCourses()
BEGIN
    SELECT CCode, CoName, Credits
    FROM Course
    WHERE CCode NOT IN (SELECT CCode FROM Section);
END //

-- Query 5: Find students who have taken ALL courses offered by their department
CREATE PROCEDURE sp_Q5_AllDeptCoursesStudents()
BEGIN
    SELECT s.SId, s.Fname, s.Lname, s.DCode
    FROM Student s
    WHERE NOT EXISTS (
        SELECT c.CCode 
        FROM Course c 
        WHERE c.DCode = s.DCode 
        AND NOT EXISTS (
            SELECT t.Sec_Id 
            FROM Takes t 
            JOIN Section sec ON t.Sec_Id = sec.Sec_Id 
            WHERE t.SId = s.SId AND sec.CCode = c.CCode 
            AND t.Grade NOT IN ('W','I','F') AND t.Grade IS NOT NULL
        )
    );
END //

-- Query 6: Top 5 students by GPA in each department
CREATE PROCEDURE sp_Q6_TopStudentsByDept()
BEGIN
    WITH RankedStudents AS (
        SELECT 
            s.SId, s.Fname, s.Lname, d.DName, vw.GPA,
            ROW_NUMBER() OVER(PARTITION BY s.DCode ORDER BY vw.GPA DESC) AS rnk
        FROM Student s
        JOIN vw_StudentGPA vw ON s.SId = vw.SId
        JOIN Dept d ON s.DCode = d.DCode
    )
    SELECT SId, Fname, Lname, DName, GPA, rnk AS `Rank`
    FROM RankedStudents
    WHERE rnk <= 5;
END //

-- Query 7: Find instructors who are also department chairs
CREATE PROCEDURE sp_Q7_DeptChairsInst()
BEGIN
    SELECT 
        i.Id, i.IName, i.Rank, d.DName AS ChairOfDept
    FROM Instructor i
    JOIN Dept d ON i.Id = d.Chair_Id;
END //

-- Query 8: List sections sorted by enrollment count descending
CREATE PROCEDURE sp_Q8_SectionsByEnrollment()
BEGIN
    SELECT *
    FROM vw_SectionDetails
    ORDER BY EnrollmentCount DESC;
END //

-- Query 9: Find students who have failed (grade='F') in more than 2 courses
CREATE PROCEDURE sp_Q9_FailedStudents()
BEGIN
    SELECT 
        s.SId, s.Fname, s.Lname, COUNT(t.Sec_Id) AS FailedCoursesCount
    FROM Student s
    JOIN Takes t ON s.SId = t.SId
    WHERE t.Grade = 'F'
    GROUP BY s.SId, s.Fname, s.Lname
    HAVING COUNT(t.Sec_Id) > 2;
END //

-- Query 10: Semester-wise enrollment trend report
CREATE PROCEDURE sp_Q10_EnrollmentTrends()
BEGIN
    SELECT 
        s.Sem, s.Year,
        COUNT(t.SId) AS TotalEnrollments,
        COUNT(DISTINCT t.SId) AS UniqueStudents,
        COUNT(DISTINCT s.CCode) AS UniqueCourses
    FROM Section s
    LEFT JOIN Takes t ON s.Sec_Id = t.Sec_Id
    GROUP BY s.Year, s.Sem
    ORDER BY s.Year DESC, FIELD(s.Sem, 'Spring', 'Summer', 'Fall', 'Winter') DESC;
END //

-- Query 11: Find courses with highest average GPA (top 10)
CREATE PROCEDURE sp_Q11_PopularCourses()
BEGIN
    SELECT 
        c.CCode, c.CoName, vw.AvgGPA
    FROM Course c
    JOIN vw_CourseOfferings vw ON c.CCode = vw.CCode
    ORDER BY vw.AvgGPA DESC
    LIMIT 10;
END //

-- Query 12: List students who have NOT enrolled in any section
CREATE PROCEDURE sp_Q12_UnenrolledStudents()
BEGIN
    SELECT SId, Fname, Lname, Major
    FROM Student
    WHERE SId NOT IN (SELECT DISTINCT SId FROM Takes);
END //

-- Query 13: Find pairs of students who have taken the exact same set of courses
-- Complex matching, handled by comparing course string aggregations for simplicity here
CREATE PROCEDURE sp_Q13_SameCoursePairs()
BEGIN
    WITH StudentCourses AS (
        SELECT t.SId, GROUP_CONCAT(DISTINCT s.CCode ORDER BY s.CCode ASC SEPARATOR ',') AS CourseList
        FROM Takes t JOIN Section s ON t.Sec_Id = s.Sec_Id
        WHERE t.Grade NOT IN ('W', 'I') AND t.Grade IS NOT NULL
        GROUP BY t.SId
    )
    SELECT sc1.SId AS Student1, sc2.SId AS Student2, sc1.CourseList
    FROM StudentCourses sc1
    JOIN StudentCourses sc2 ON sc1.CourseList = sc2.CourseList AND sc1.SId < sc2.SId;
END //

-- Query 14: Department-wise grade distribution report
CREATE PROCEDURE sp_Q14_DeptGradeDistribution()
BEGIN
    SELECT 
        d.DName,
        SUM(CASE WHEN t.Grade IN ('A+', 'A', 'A-') THEN 1 ELSE 0 END) AS GradeA_Count, 
        SUM(CASE WHEN t.Grade IN ('B+', 'B', 'B-') THEN 1 ELSE 0 END) AS GradeB_Count, 
        SUM(CASE WHEN t.Grade IN ('C+', 'C', 'C-') THEN 1 ELSE 0 END) AS GradeC_Count, 
        SUM(CASE WHEN t.Grade IN ('D+', 'D', 'D-') THEN 1 ELSE 0 END) AS GradeD_Count, 
        SUM(CASE WHEN t.Grade IN ('F') THEN 1 ELSE 0 END) AS GradeF_Count
    FROM Takes t
    JOIN Section s ON t.Sec_Id = s.Sec_Id
    JOIN Course c ON s.CCode = c.CCode
    JOIN Dept d ON c.DCode = d.DCode
    WHERE t.Grade IS NOT NULL AND t.Grade NOT IN ('W', 'I')
    GROUP BY d.DName;
END //

-- Query 15: Find the most popular course each semester (highest enrollment)
CREATE PROCEDURE sp_Q15_MostPopularCoursePerSem()
BEGIN
    WITH SemesterEnrollment AS (
        SELECT 
            s.Sem, s.Year, s.CCode, c.CoName, COUNT(t.SId) AS EnrollCount,
            RANK() OVER(PARTITION BY s.Sem, s.Year ORDER BY COUNT(t.SId) DESC) AS rnk
        FROM Section s
        JOIN Course c ON s.CCode = c.CCode
        JOIN Takes t ON s.Sec_Id = t.Sec_Id
        GROUP BY s.Sem, s.Year, s.CCode, c.CoName
    )
    SELECT Sem, Year, CCode, CoName, EnrollCount
    FROM SemesterEnrollment
    WHERE rnk = 1;
END //

-- Query 16: List instructors who have never taught any section
CREATE PROCEDURE sp_Q16_NeverTaughtInstructors()
BEGIN
    SELECT Id, IName, `Rank`
    FROM Instructor
    WHERE Id NOT IN (SELECT DISTINCT Inst_Id FROM Section WHERE Inst_Id IS NOT NULL);
END //

-- Query 17: Calculate each student's standing
CREATE PROCEDURE sp_Q17_StudentStanding()
BEGIN
    SELECT 
        SId, 
        StudentFullName,
        TotalCoursesCompleted,
        GPA,
        CASE 
            WHEN TotalCoursesCompleted < 30 THEN 'Freshman'
            WHEN TotalCoursesCompleted BETWEEN 30 AND 59 THEN 'Sophomore'
            WHEN TotalCoursesCompleted BETWEEN 60 AND 89 THEN 'Junior'
            ELSE 'Senior'
        END AS Standing
    FROM vw_StudentEnrollment;
END //

-- Query 18: Find rooms (Bldg + RoomNo) that are used the most
CREATE PROCEDURE sp_Q18_MostUsedRooms()
BEGIN
    SELECT 
        Bldg, RoomNo, COUNT(Sec_Id) AS UsageCount
    FROM Section
    WHERE Bldg IS NOT NULL AND RoomNo IS NOT NULL
    GROUP BY Bldg, RoomNo
    ORDER BY UsageCount DESC;
END //

DELIMITER ;
