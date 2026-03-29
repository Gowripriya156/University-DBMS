USE university_db;

DELIMITER //

-- Function 1: GetStudentGPA
CREATE FUNCTION fn_GetStudentGPA(p_sid INT) RETURNS DECIMAL(3,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_points DECIMAL(6,2);
    DECLARE total_credits INT;
    DECLARE gpa DECIMAL(3,2);

    SELECT 
        SUM(
            CASE Grade
                WHEN 'A+' THEN 4.0
                WHEN 'A' THEN 4.0
                WHEN 'A-' THEN 3.7
                WHEN 'B+' THEN 3.3
                WHEN 'B' THEN 3.0
                WHEN 'B-' THEN 2.7
                WHEN 'C+' THEN 2.3
                WHEN 'C' THEN 2.0
                WHEN 'C-' THEN 1.7
                WHEN 'D+' THEN 1.3
                WHEN 'D' THEN 1.0
                WHEN 'D-' THEN 0.7
                WHEN 'F' THEN 0.0
                ELSE 0.0
            END * c.Credits
        ),
        SUM(c.Credits)
    INTO total_points, total_credits
    FROM Takes t
    JOIN Section s ON t.Sec_Id = s.Sec_Id
    JOIN Course c ON s.CCode = c.CCode
    WHERE t.SId = p_sid AND t.Grade NOT IN ('W', 'I') AND t.Grade IS NOT NULL;

    IF total_credits Is NULL OR total_credits = 0 THEN
        RETURN 0.00;
    ELSE
        RETURN ROUND(total_points / total_credits, 2);
    END IF;
END //

-- Function 2: GetStudentFullName
CREATE FUNCTION fn_GetStudentFullName(p_sid INT) RETURNS VARCHAR(101)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_fullname VARCHAR(101);
    SELECT CONCAT(Fname, ' ', Lname) INTO v_fullname FROM Student WHERE SId = p_sid;
    RETURN v_fullname;
END //

-- Function 3: GetCourseEnrollmentCount
CREATE FUNCTION fn_GetCourseEnrollmentCount(p_ccode VARCHAR(20)) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(t.SId) INTO v_count
    FROM Takes t
    JOIN Section s ON t.Sec_Id = s.Sec_Id
    WHERE s.CCode = p_ccode AND (t.Grade != 'W' OR t.Grade IS NULL);
    RETURN v_count;
END //

-- Function 4: GetSectionEnrollmentCount
CREATE FUNCTION fn_GetSectionEnrollmentCount(p_sec_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(SId) INTO v_count
    FROM Takes
    WHERE Sec_Id = p_sec_id AND (Grade != 'W' OR Grade IS NULL);
    RETURN v_count;
END //

-- Function 5: GetInstructorCourseCount
CREATE FUNCTION fn_GetInstructorCourseCount(p_inst_id INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(DISTINCT CCode) INTO v_count
    FROM Section
    WHERE Inst_Id = p_inst_id;
    RETURN v_count;
END //

-- Function 6: GetDeptStudentCount
CREATE FUNCTION fn_GetDeptStudentCount(p_dcode VARCHAR(20)) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(SId) INTO v_count
    FROM Student
    WHERE DCode = p_dcode;
    RETURN v_count;
END //

-- Function 7: GetDeptInstructorCount
CREATE FUNCTION fn_GetDeptInstructorCount(p_dcode VARCHAR(20)) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(Id) INTO v_count
    FROM Instructor
    WHERE DCode = p_dcode;
    RETURN v_count;
END //

-- Function 8: GetStudentTotalCredits
CREATE FUNCTION fn_GetStudentTotalCredits(p_sid INT) RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_credits INT;
    SELECT SUM(c.Credits) INTO v_credits
    FROM Takes t
    JOIN Section s ON t.Sec_Id = s.Sec_Id
    JOIN Course c ON s.CCode = c.CCode
    WHERE t.SId = p_sid AND t.Grade NOT IN ('F', 'W', 'I') AND t.Grade IS NOT NULL;
    RETURN IFNULL(v_credits, 0);
END //

-- Function 9: GetCourseAverageGPA
CREATE FUNCTION fn_GetCourseAverageGPA(p_ccode VARCHAR(20)) RETURNS DECIMAL(3,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_points DECIMAL(10,2);
    DECLARE total_students INT;
    
    SELECT 
        SUM(
            CASE Grade
                WHEN 'A+' THEN 4.0
                WHEN 'A' THEN 4.0
                WHEN 'A-' THEN 3.7
                WHEN 'B+' THEN 3.3
                WHEN 'B' THEN 3.0
                WHEN 'B-' THEN 2.7
                WHEN 'C+' THEN 2.3
                WHEN 'C' THEN 2.0
                WHEN 'C-' THEN 1.7
                WHEN 'D+' THEN 1.3
                WHEN 'D' THEN 1.0
                WHEN 'D-' THEN 0.7
                WHEN 'F' THEN 0.0
                ELSE 0.0
            END
        ),
        COUNT(*)
    INTO total_points, total_students
    FROM Takes t
    JOIN Section s ON t.Sec_Id = s.Sec_Id
    WHERE s.CCode = p_ccode AND t.Grade NOT IN ('W', 'I') AND t.Grade IS NOT NULL;

    IF total_students IS NULL OR total_students = 0 THEN
        RETURN 0.00;
    ELSE
        RETURN ROUND(total_points / total_students, 2);
    END IF;
END //

-- Function 10: IsSectionFull
CREATE FUNCTION fn_IsSectionFull(p_sec_id INT) RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_count INT;
    SELECT fn_GetSectionEnrollmentCount(p_sec_id) INTO v_count;
    RETURN v_count >= 40;
END //

DELIMITER ;
