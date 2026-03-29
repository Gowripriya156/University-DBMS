USE university_db;

DELIMITER //

-- Procedure 1: sp_AddCollege
CREATE PROCEDURE sp_AddCollege(IN p_cname VARCHAR(100), IN p_coffice VARCHAR(100), IN p_cphone VARCHAR(20), IN p_dean_id INT)
BEGIN
    DECLARE v_dean_exists INT;
    
    IF p_cname IS NULL OR p_cname = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'College name cannot be empty.';
    END IF;
    
    IF p_dean_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_dean_exists FROM Instructor WHERE Id = p_dean_id;
        IF v_dean_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dean ID does not exist in Instructor table.';
        END IF;
    END IF;

    INSERT INTO College (CName, COffice, CPhone, Dean_Id) VALUES (p_cname, p_coffice, p_cphone, p_dean_id);
    SELECT 'College added successfully' AS Message;
END //

-- Procedure 2: sp_AddDept
CREATE PROCEDURE sp_AddDept(IN p_dcode VARCHAR(20), IN p_dname VARCHAR(100), IN p_doffice VARCHAR(100), IN p_dphone VARCHAR(20), IN p_chair_id INT, IN p_cstartdate DATE, IN p_cname VARCHAR(100))
BEGIN
    DECLARE v_cname_exists INT;
    DECLARE v_chair_exists INT;

    IF p_cname IS NOT NULL THEN
        SELECT COUNT(*) INTO v_cname_exists FROM College WHERE CName = p_cname;
        IF v_cname_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'College name does not exist.';
        END IF;
    END IF;

    IF p_chair_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_chair_exists FROM Instructor WHERE Id = p_chair_id;
        IF v_chair_exists = 0 THEN
             SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Chair ID does not exist.';
        END IF;
    END IF;

    INSERT INTO Dept (DCode, DName, DOffice, DPhone, Chair_Id, CStartDate, CName) 
    VALUES (p_dcode, p_dname, p_doffice, p_dphone, p_chair_id, p_cstartdate, p_cname);
    SELECT 'Department added successfully' AS Message;
END //

-- Procedure 3: sp_AddInstructor
CREATE PROCEDURE sp_AddInstructor(IN p_iname VARCHAR(100), IN p_ioffice VARCHAR(100), IN p_iphone VARCHAR(20), IN p_rank VARCHAR(50), IN p_dcode VARCHAR(20))
BEGIN
    DECLARE v_dcode_exists INT;
    
    IF p_rank NOT IN ('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Adjunct') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid rank value.';
    END IF;

    IF p_dcode IS NOT NULL THEN
        SELECT COUNT(*) INTO v_dcode_exists FROM Dept WHERE DCode = p_dcode;
        IF v_dcode_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Department code does not exist.';
        END IF;
    END IF;

    INSERT INTO Instructor (IName, IOffice, IPhone, Rank, DCode) VALUES (p_iname, p_ioffice, p_iphone, p_rank, p_dcode);
    SELECT LAST_INSERT_ID() AS New_Id;
END //

-- Procedure 4: sp_AddCourse
CREATE PROCEDURE sp_AddCourse(IN p_ccode VARCHAR(20), IN p_coname VARCHAR(100), IN p_credits INT, IN p_dcode VARCHAR(20))
BEGIN
    DECLARE v_dcode_exists INT;

    IF p_credits <= 0 OR p_credits > 6 THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Credits must be strictly greater than 0 and less than or equal to 6.';
    END IF;

    IF p_dcode IS NOT NULL THEN
        SELECT COUNT(*) INTO v_dcode_exists FROM Dept WHERE DCode = p_dcode;
        IF v_dcode_exists = 0 THEN
             SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Department code does not exist.';
        END IF;
    END IF;

    INSERT INTO Course (CCode, CoName, Credits, DCode) VALUES (p_ccode, p_coname, p_credits, p_dcode);
    SELECT 'Course added successfully' AS Message;
END //

-- Procedure 5: sp_AddStudent
CREATE PROCEDURE sp_AddStudent(IN p_fname VARCHAR(50), IN p_lname VARCHAR(50), IN p_addr VARCHAR(200), IN p_phone VARCHAR(20), IN p_major VARCHAR(100), IN p_dob DATE, IN p_dcode VARCHAR(20))
BEGIN
    DECLARE v_dcode_exists INT;
    
    IF p_dcode IS NOT NULL THEN
        SELECT COUNT(*) INTO v_dcode_exists FROM Dept WHERE DCode = p_dcode;
        IF v_dcode_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Department code does not exist.';
        END IF;
    END IF;

    IF p_dob >= CURDATE() THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Date of birth must be in the past.';
    END IF;

    INSERT INTO Student (Fname, Lname, Addr, Phone, Major, DOB, DCode) VALUES (p_fname, p_lname, p_addr, p_phone, p_major, p_dob, p_dcode);
    SELECT LAST_INSERT_ID() AS New_SId;
END //

-- Procedure 6: sp_AddSection
CREATE PROCEDURE sp_AddSection(IN p_secno INT, IN p_sem VARCHAR(20), IN p_year INT, IN p_bldg VARCHAR(50), IN p_roomno VARCHAR(20), IN p_ccode VARCHAR(20), IN p_inst_id INT)
BEGIN
    DECLARE v_ccode_exists INT;
    DECLARE v_inst_exists INT;
    DECLARE v_conflict INT;

    IF p_sem NOT IN ('Fall', 'Spring', 'Summer', 'Winter') THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid semester value.';
    END IF;

    SELECT COUNT(*) INTO v_ccode_exists FROM Course WHERE CCode = p_ccode;
    IF v_ccode_exists = 0 THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Course code does not exist.';
    END IF;

    IF p_inst_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_inst_exists FROM Instructor WHERE Id = p_inst_id;
        IF v_inst_exists = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Instructor ID does not exist.';
        END IF;
    END IF;

    IF p_bldg IS NOT NULL AND p_roomno IS NOT NULL THEN
        SELECT COUNT(*) INTO v_conflict FROM Section 
        WHERE Bldg = p_bldg AND RoomNo = p_roomno AND Sem = p_sem AND Year = p_year;
        IF v_conflict > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room and time conflict exists.';
        END IF;
    END IF;

    INSERT INTO Section (SecNo, Sem, Year, Bldg, RoomNo, CCode, Inst_Id) 
    VALUES (p_secno, p_sem, p_year, p_bldg, p_roomno, p_ccode, p_inst_id);
    SELECT LAST_INSERT_ID() AS New_Sec_Id;
END //

-- Procedure 7: sp_EnrollStudent
CREATE PROCEDURE sp_EnrollStudent(IN p_sid INT, IN p_sec_id INT)
BEGIN
    DECLARE v_student_exists INT;
    DECLARE v_section_exists INT;
    DECLARE v_already_enrolled INT;
    DECLARE v_section_full BOOLEAN;

    SELECT COUNT(*) INTO v_student_exists FROM Student WHERE SId = p_sid;
    IF v_student_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student does not exist.';
    END IF;

    SELECT COUNT(*) INTO v_section_exists FROM Section WHERE Sec_Id = p_sec_id;
    IF v_section_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Section does not exist.';
    END IF;

    SELECT COUNT(*) INTO v_already_enrolled FROM Takes WHERE SId = p_sid AND Sec_Id = p_sec_id;
    IF v_already_enrolled > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student is already enrolled in this section.';
    END IF;

    SET v_section_full = fn_IsSectionFull(p_sec_id);
    IF v_section_full THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Section is full (capacity 40).';
    END IF;

    INSERT INTO Takes (SId, Sec_Id, Grade) VALUES (p_sid, p_sec_id, NULL);
    SELECT 'Student enrolled successfully' AS Message;
END //

-- Procedure 8: sp_AssignGrade
CREATE PROCEDURE sp_AssignGrade(IN p_sid INT, IN p_sec_id INT, IN p_grade VARCHAR(2))
BEGIN
    DECLARE v_enrollment_exists INT;
    
    SELECT COUNT(*) INTO v_enrollment_exists FROM Takes WHERE SId = p_sid AND Sec_Id = p_sec_id;
    IF v_enrollment_exists = 0 THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Enrollment does not exist.';
    END IF;

    IF p_grade NOT IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','W','I') AND p_grade IS NOT NULL THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid grade value.';
    END IF;

    UPDATE Takes SET Grade = p_grade WHERE SId = p_sid AND Sec_Id = p_sec_id;
    SELECT 'Grade assigned successfully' AS Message;
END //

-- Procedure 9: sp_DropStudent
CREATE PROCEDURE sp_DropStudent(IN p_sid INT, IN p_sec_id INT)
BEGIN
    DECLARE v_enrollment_exists INT;
    DECLARE v_grade VARCHAR(2);

    SELECT COUNT(*), Grade INTO v_enrollment_exists, v_grade FROM Takes WHERE SId = p_sid AND Sec_Id = p_sec_id;
    IF v_enrollment_exists = 0 THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Enrollment does not exist.';
    END IF;

    IF v_grade IS NOT NULL AND v_grade != 'W' AND v_grade != 'I' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot drop a course that already has a finalized grade.';
    END IF;

    DELETE FROM Takes WHERE SId = p_sid AND Sec_Id = p_sec_id;
    SELECT 'Student dropped successfully' AS Message;
END //

-- Procedure 10: sp_UpdateStudent
CREATE PROCEDURE sp_UpdateStudent(IN p_sid INT, IN p_fname VARCHAR(50), IN p_lname VARCHAR(50), IN p_addr VARCHAR(200), IN p_phone VARCHAR(20), IN p_major VARCHAR(100), IN p_dob DATE, IN p_dcode VARCHAR(20))
BEGIN
    DECLARE v_student_exists INT;
    SELECT COUNT(*) INTO v_student_exists FROM Student WHERE SId = p_sid;
    IF v_student_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student does not exist.';
    END IF;

    UPDATE Student SET Fname = p_fname, Lname = p_lname, Addr = p_addr, Phone = p_phone, Major = p_major, DOB = p_dob, DCode = p_dcode WHERE SId = p_sid;
    SELECT 'Student updated successfully' AS Message;
END //

-- Procedure 11: sp_UpdateInstructor
CREATE PROCEDURE sp_UpdateInstructor(IN p_id INT, IN p_iname VARCHAR(100), IN p_ioffice VARCHAR(100), IN p_iphone VARCHAR(20), IN p_rank VARCHAR(50), IN p_dcode VARCHAR(20))
BEGIN
    DECLARE v_inst_exists INT;
    SELECT COUNT(*) INTO v_inst_exists FROM Instructor WHERE Id = p_id;
    IF v_inst_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Instructor does not exist.';
    END IF;
    
    UPDATE Instructor SET IName = p_iname, IOffice = p_ioffice, IPhone = p_iphone, Rank = p_rank, DCode = p_dcode WHERE Id = p_id;
    SELECT 'Instructor updated successfully' AS Message;
END //

-- Procedure 12: sp_DeleteStudent
CREATE PROCEDURE sp_DeleteStudent(IN p_sid INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error deleting student. Transaction rolled back.';
    END;

    START TRANSACTION;
    DELETE FROM Takes WHERE SId = p_sid;
    DELETE FROM Student WHERE SId = p_sid;
    COMMIT;
    SELECT ROW_COUNT() AS DeletedRecords;
END //

-- Procedure 13: sp_DeleteInstructor
CREATE PROCEDURE sp_DeleteInstructor(IN p_id INT)
BEGIN
    DECLARE v_is_dean INT;
    DECLARE v_is_chair INT;

    SELECT COUNT(*) INTO v_is_dean FROM College WHERE Dean_Id = p_id;
    IF v_is_dean > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete instructor who is currently a Dean.';
    END IF;

    SELECT COUNT(*) INTO v_is_chair FROM Dept WHERE Chair_Id = p_id;
    IF v_is_chair > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete instructor who is currently a Department Chair.';
    END IF;

    DELETE FROM Instructor WHERE Id = p_id;
    SELECT 'Instructor deleted successfully' AS Message;
END //

-- Procedure 14: sp_GetStudentTranscript
CREATE PROCEDURE sp_GetStudentTranscript(IN p_sid INT)
BEGIN
    SELECT 
        c.CoName AS CourseName, 
        c.CCode AS CourseCode, 
        c.Credits, 
        s.Sem AS Semester, 
        s.Year, 
        t.Grade, 
        s.SecNo AS SectionNo, 
        i.IName AS InstructorName
    FROM Takes t
    JOIN Section s ON t.Sec_Id = s.Sec_Id
    JOIN Course c ON s.CCode = c.CCode
    LEFT JOIN Instructor i ON s.Inst_Id = i.Id
    WHERE t.SId = p_sid
    ORDER BY s.Year DESC, 
             FIELD(s.Sem, 'Spring', 'Summer', 'Fall', 'Winter') DESC;
END //

-- Procedure 15: sp_GetDeptReport
CREATE PROCEDURE sp_GetDeptReport(IN p_dcode VARCHAR(20))
BEGIN
    SELECT 
        d.DCode,
        d.DName,
        d.DOffice,
        d.DPhone,
        c.CName AS CollegeName,
        i.IName AS ChairName,
        fn_GetDeptInstructorCount(d.DCode) AS NumInstructors,
        fn_GetDeptStudentCount(d.DCode) AS NumStudents,
        (SELECT COUNT(*) FROM Course WHERE DCode = d.DCode) AS NumCourses,
        (SELECT COUNT(*) FROM Section s JOIN Course crs ON s.CCode = crs.CCode WHERE crs.DCode = d.DCode) AS NumSections
    FROM Dept d
    LEFT JOIN College c ON d.CName = c.CName
    LEFT JOIN Instructor i ON d.Chair_Id = i.Id
    WHERE d.DCode = p_dcode;
END //

-- Procedure 16: sp_TransferStudent
CREATE PROCEDURE sp_TransferStudent(IN p_sid INT, IN p_new_dcode VARCHAR(20))
BEGIN
    DECLARE v_student_exists INT;
    DECLARE v_dept_exists INT;
    DECLARE v_old_dept VARCHAR(20);

    SELECT COUNT(*), DCode INTO v_student_exists, v_old_dept FROM Student WHERE SId = p_sid;
    IF v_student_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student does not exist.';
    END IF;

    SELECT COUNT(*) INTO v_dept_exists FROM Dept WHERE DCode = p_new_dcode;
    IF v_dept_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'New department does not exist.';
    END IF;

    UPDATE Student SET DCode = p_new_dcode WHERE SId = p_sid;
    
    INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, Old_Values, New_Values, Changed_By)
    VALUES ('Student', 'TRANSFER', p_sid, CONCAT('old_dept:', IFNULL(v_old_dept, 'NULL')), CONCAT('new_dept:', p_new_dcode), 'SYSTEM');
    
    SELECT 'Student transferred successfully' AS Message;
END //

-- Procedure 17: sp_SearchStudents
CREATE PROCEDURE sp_SearchStudents(IN p_search_term VARCHAR(100))
BEGIN
    DECLARE search_pattern VARCHAR(102);
    SET search_pattern = CONCAT('%', p_search_term, '%');
    
    SELECT 
        s.SId, 
        s.Fname, 
        s.Lname, 
        s.Major, 
        d.DName AS Department
    FROM Student s
    LEFT JOIN Dept d ON s.DCode = d.DCode
    WHERE s.Fname LIKE search_pattern 
       OR s.Lname LIKE search_pattern 
       OR s.Major LIKE search_pattern 
       OR CAST(s.SId AS CHAR) LIKE search_pattern;
END //

-- Procedure 18: sp_GetSemesterReport
CREATE PROCEDURE sp_GetSemesterReport(IN p_sem VARCHAR(20), IN p_year INT)
BEGIN
    SELECT 
        s.Sec_Id,
        s.SecNo,
        c.CoName AS CourseName,
        c.CCode,
        s.Sem,
        s.Year,
        i.IName AS InstructorName,
        fn_GetSectionEnrollmentCount(s.Sec_Id) AS EnrollmentCount
    FROM Section s
    JOIN Course c ON s.CCode = c.CCode
    LEFT JOIN Instructor i ON s.Inst_Id = i.Id
    WHERE s.Sem = p_sem AND s.Year = p_year;
END //

-- Updates logic
CREATE PROCEDURE sp_UpdateCollege(IN p_cname VARCHAR(100), IN p_coffice VARCHAR(100), IN p_cphone VARCHAR(20), IN p_dean_id INT)
BEGIN
    UPDATE College SET COffice = p_coffice, CPhone = p_cphone, Dean_Id = p_dean_id WHERE CName = p_cname;
    SELECT 'College updated successfully' AS Message;
END //

CREATE PROCEDURE sp_DeleteCollege(IN p_cname VARCHAR(100))
BEGIN
    DELETE FROM College WHERE CName = p_cname;
    SELECT 'College deleted successfully' AS Message;
END //

CREATE PROCEDURE sp_UpdateDept(IN p_dcode VARCHAR(20), IN p_dname VARCHAR(100), IN p_doffice VARCHAR(100), IN p_dphone VARCHAR(20), IN p_chair_id INT, IN p_cstartdate DATE, IN p_cname VARCHAR(100))
BEGIN
    UPDATE Dept SET DName = p_dname, DOffice = p_doffice, DPhone = p_dphone, Chair_Id = p_chair_id, CStartDate = p_cstartdate, CName = p_cname WHERE DCode = p_dcode;
    SELECT 'Department updated successfully' AS Message;
END //

CREATE PROCEDURE sp_DeleteDept(IN p_dcode VARCHAR(20))
BEGIN
    DELETE FROM Dept WHERE DCode = p_dcode;
    SELECT 'Department deleted successfully' AS Message;
END //

CREATE PROCEDURE sp_UpdateCourse(IN p_ccode VARCHAR(20), IN p_coname VARCHAR(100), IN p_credits INT, IN p_dcode VARCHAR(20))
BEGIN
    UPDATE Course SET CoName = p_coname, Credits = p_credits, DCode = p_dcode WHERE CCode = p_ccode;
    SELECT 'Course updated successfully' AS Message;
END //

CREATE PROCEDURE sp_DeleteCourse(IN p_ccode VARCHAR(20))
BEGIN
    DELETE FROM Course WHERE CCode = p_ccode;
    SELECT 'Course deleted successfully' AS Message;
END //

CREATE PROCEDURE sp_UpdateSection(IN p_sec_id INT, IN p_secno INT, IN p_sem VARCHAR(20), IN p_year INT, IN p_bldg VARCHAR(50), IN p_roomno VARCHAR(20), IN p_ccode VARCHAR(20), IN p_inst_id INT)
BEGIN
    UPDATE Section SET SecNo = p_secno, Sem = p_sem, Year = p_year, Bldg = p_bldg, RoomNo = p_roomno, CCode = p_ccode, Inst_Id = p_inst_id WHERE Sec_Id = p_sec_id;
    SELECT 'Section updated successfully' AS Message;
END //

CREATE PROCEDURE sp_DeleteSection(IN p_sec_id INT)
BEGIN
    DELETE FROM Section WHERE Sec_Id = p_sec_id;
    SELECT 'Section deleted successfully' AS Message;
END //


DELIMITER ;
