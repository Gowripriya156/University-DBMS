USE university_db;

DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    Username VARCHAR(50) PRIMARY KEY,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('University', 'College') NOT NULL,
    CollegeName VARCHAR(100) NULL,
    FOREIGN KEY (CollegeName) REFERENCES College(CName) ON DELETE CASCADE
);

INSERT INTO Users (Username, Password, Role, CollegeName) VALUES
('admin', 'admin123', 'University', NULL),
('eng_admin', 'eng123', 'College', 'Engineering'),
('sci_admin', 'sci123', 'College', 'Arts & Sciences'),
('arts_admin', 'arts123', 'College', 'Business');

DELIMITER //

DROP PROCEDURE IF EXISTS sp_AuthenticateUser //
CREATE PROCEDURE sp_AuthenticateUser (
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(255)
)
BEGIN
    SELECT Username, Role, CollegeName 
    FROM Users 
    WHERE Username = p_username AND Password = p_password;
END //

DROP PROCEDURE IF EXISTS sp_GetCollegeDepts //
CREATE PROCEDURE sp_GetCollegeDepts(IN p_cname VARCHAR(100))
BEGIN
    SELECT * FROM vw_DepartmentSummary WHERE CollegeName = p_cname;
END //

DROP PROCEDURE IF EXISTS sp_GetCollegeInstructors //
CREATE PROCEDURE sp_GetCollegeInstructors(IN p_cname VARCHAR(100))
BEGIN
    SELECT i.Id, i.IName, i.Rank, i.IOffice, i.IPhone, d.DCode, d.DName
    FROM Instructor i
    JOIN Dept d ON i.DCode = d.DCode
    WHERE d.CName = p_cname;
END //

DROP PROCEDURE IF EXISTS sp_GetCollegeCourses //
CREATE PROCEDURE sp_GetCollegeCourses(IN p_cname VARCHAR(100))
BEGIN
    SELECT co.* 
    FROM vw_CourseOfferings co
    JOIN Dept d ON co.DCode = d.DCode
    WHERE d.CName = p_cname;
END //

DROP PROCEDURE IF EXISTS sp_GetCollegeStudents //
CREATE PROCEDURE sp_GetCollegeStudents(IN p_cname VARCHAR(100))
BEGIN
    SELECT se.* 
    FROM vw_StudentEnrollment se
    JOIN Dept d ON se.DeptName = d.DName
    WHERE d.CName = p_cname;
END //

DROP PROCEDURE IF EXISTS sp_GetCollegeSections //
CREATE PROCEDURE sp_GetCollegeSections(IN p_cname VARCHAR(100))
BEGIN
    SELECT sd.* 
    FROM vw_SectionDetails sd
    JOIN Dept d ON sd.DCode = d.DCode
    WHERE d.CName = p_cname;
END //

DROP PROCEDURE IF EXISTS sp_GetCollegeEnrollments //
CREATE PROCEDURE sp_GetCollegeEnrollments(IN p_cname VARCHAR(100))
BEGIN
    SELECT t.SId, s.Fname, s.Lname, t.Sec_Id, sec.SecNo, c.CCode, c.CoName as CourseName, t.Grade, sec.Sem, sec.Year
    FROM Takes t
    JOIN Student s ON t.SId = s.SId
    JOIN Section sec ON t.Sec_Id = sec.Sec_Id
    JOIN Course c ON sec.CCode = c.CCode
    JOIN Dept d_course ON c.DCode = d_course.DCode
    JOIN Dept d_student ON s.DCode = d_student.DCode
    WHERE d_course.CName = p_cname OR d_student.CName = p_cname;
END //

DELIMITER ;
