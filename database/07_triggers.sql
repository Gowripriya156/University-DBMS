USE university_db;

DELIMITER //

-- Trigger 1: AfterInsertStudent
DROP TRIGGER IF EXISTS trg_AfterInsertStudent;
CREATE TRIGGER trg_AfterInsertStudent
AFTER INSERT ON Student
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, New_Values, Changed_By)
    VALUES ('Student', 'INSERT', NEW.SId, CONCAT('Fname:', NEW.Fname, ', Lname:', NEW.Lname), 'SYSTEM');
END //

-- Trigger 2: AfterUpdateStudent
DROP TRIGGER IF EXISTS trg_AfterUpdateStudent;
CREATE TRIGGER trg_AfterUpdateStudent
AFTER UPDATE ON Student
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, Old_Values, New_Values, Changed_By)
    VALUES ('Student', 'UPDATE', NEW.SId, CONCAT('Fname:', OLD.Fname, ', Lname:', OLD.Lname), CONCAT('Fname:', NEW.Fname, ', Lname:', NEW.Lname), 'SYSTEM');
END //

-- Trigger 3: BeforeDeleteStudent
DROP TRIGGER IF EXISTS trg_BeforeDeleteStudent;
CREATE TRIGGER trg_BeforeDeleteStudent
BEFORE DELETE ON Student
FOR EACH ROW
BEGIN
    DECLARE v_has_grades INT;
    SELECT COUNT(*) INTO v_has_grades FROM Takes WHERE SId = OLD.SId AND Grade IS NOT NULL AND Grade != 'W';
    
    IF v_has_grades > 0 THEN
        INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, Old_Values, Changed_By)
        VALUES ('Student', 'DELETE_FAIL', OLD.SId, 'Student has grades', 'SYSTEM');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete student with non-null grades.';
    ELSE
        INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, Old_Values, Changed_By)
        VALUES ('Student', 'DELETE', OLD.SId, CONCAT('Fname:', OLD.Fname, ', Lname:', OLD.Lname), 'SYSTEM');
    END IF;
END //

-- Trigger 4: AfterInsertTakes
DROP TRIGGER IF EXISTS trg_AfterInsertTakes;
CREATE TRIGGER trg_AfterInsertTakes
AFTER INSERT ON Takes
FOR EACH ROW
BEGIN
    DECLARE v_is_full BOOLEAN;
    
    INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, New_Values, Changed_By)
    VALUES ('Takes', 'INSERT', CONCAT(NEW.SId, '-', NEW.Sec_Id), CONCAT('Grade:', IFNULL(NEW.Grade, 'NULL')), 'SYSTEM');

    -- Note: capacity check is often better in SP since trigger abort might be confusing, but as per requirement:
    SET v_is_full = fn_IsSectionFull(NEW.Sec_Id);
    IF v_is_full THEN
        -- Though fn_IsSectionFull checks >= 40, since this is AFTER insert, it would mean it just hit 41. 
        -- To be strictly correct with "SIGNAL error if full", we should theoretically do it BEFORE insert. 
        -- Leaving as AFTER as per specs but with logic adjusted or as is.
        IF (SELECT COUNT(*) FROM Takes WHERE Sec_Id = NEW.Sec_Id) > 40 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Section capacity exceeded.';
        END IF;
    END IF;
END //

-- Trigger 5: AfterUpdateTakes (Grade Change)
DROP TRIGGER IF EXISTS trg_AfterUpdateTakes;
CREATE TRIGGER trg_AfterUpdateTakes
AFTER UPDATE ON Takes
FOR EACH ROW
BEGIN
    IF OLD.Grade IS NULL OR NEW.Grade != OLD.Grade OR (OLD.Grade IS NOT NULL AND NEW.Grade IS NULL) THEN
        INSERT INTO Grade_History (SId, Sec_Id, Old_Grade, New_Grade)
        VALUES (NEW.SId, NEW.Sec_Id, OLD.Grade, NEW.Grade);
        
        INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, Old_Values, New_Values, Changed_By)
        VALUES ('Takes', 'GRADE_CHANGE', CONCAT(NEW.SId, '-', NEW.Sec_Id), CONCAT('Grade:', IFNULL(OLD.Grade, 'NULL')), CONCAT('Grade:', IFNULL(NEW.Grade, 'NULL')), 'SYSTEM');
    END IF;
END //

-- Trigger 6: BeforeInsertSection
DROP TRIGGER IF EXISTS trg_BeforeInsertSection;
CREATE TRIGGER trg_BeforeInsertSection
BEFORE INSERT ON Section
FOR EACH ROW
BEGIN
    DECLARE v_inst_dept VARCHAR(20);
    DECLARE v_course_dept VARCHAR(20);

    IF NEW.Inst_Id IS NOT NULL THEN
        SELECT DCode INTO v_inst_dept FROM Instructor WHERE Id = NEW.Inst_Id;
        SELECT DCode INTO v_course_dept FROM Course WHERE CCode = NEW.CCode;
        
        IF v_inst_dept != v_course_dept THEN
             SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Instructor and Course must belong to the same department.';
        END IF;
    END IF;
END //

-- Trigger 7: BeforeDeleteDept
DROP TRIGGER IF EXISTS trg_BeforeDeleteDept;
CREATE TRIGGER trg_BeforeDeleteDept
BEFORE DELETE ON Dept
FOR EACH ROW
BEGIN
    DECLARE v_student_count INT;
    DECLARE v_inst_count INT;
    DECLARE v_course_count INT;

    SELECT COUNT(*) INTO v_student_count FROM Student WHERE DCode = OLD.DCode;
    SELECT COUNT(*) INTO v_inst_count FROM Instructor WHERE DCode = OLD.DCode;
    SELECT COUNT(*) INTO v_course_count FROM Course WHERE DCode = OLD.DCode;

    IF v_student_count > 0 OR v_inst_count > 0 OR v_course_count > 0 THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete department: has dependent students, instructors, or courses.';
    END IF;
END //

-- Trigger 8: BeforeDeleteCollege
DROP TRIGGER IF EXISTS trg_BeforeDeleteCollege;
CREATE TRIGGER trg_BeforeDeleteCollege
BEFORE DELETE ON College
FOR EACH ROW
BEGIN
    DECLARE v_dept_count INT;
    SELECT COUNT(*) INTO v_dept_count FROM Dept WHERE CName = OLD.CName;
    IF v_dept_count > 0 THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot delete college: has dependent departments.';
    END IF;
END //

-- Trigger 9: AfterInsertInstructor
DROP TRIGGER IF EXISTS trg_AfterInsertInstructor;
CREATE TRIGGER trg_AfterInsertInstructor
AFTER INSERT ON Instructor
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, New_Values, Changed_By)
    VALUES ('Instructor', 'INSERT', NEW.Id, CONCAT('IName:', NEW.IName), 'SYSTEM');
END //

-- Trigger 10: BeforeUpdateDept_Chair
DROP TRIGGER IF EXISTS trg_BeforeUpdateDept_Chair;
CREATE TRIGGER trg_BeforeUpdateDept_Chair
BEFORE UPDATE ON Dept
FOR EACH ROW
BEGIN
    DECLARE v_chair_dept VARCHAR(20);
    
    IF NEW.Chair_Id != OLD.Chair_Id OR (OLD.Chair_Id IS NULL AND NEW.Chair_Id IS NOT NULL) THEN
        IF NEW.Chair_Id IS NOT NULL THEN
            SELECT DCode INTO v_chair_dept FROM Instructor WHERE Id = NEW.Chair_Id;
            IF v_chair_dept != NEW.DCode THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'New chair must belong to this department.';
            END IF;
            SET NEW.CStartDate = CURDATE();
        ELSE
            SET NEW.CStartDate = NULL;
        END IF;
    END IF;
END //

-- Trigger 11: AfterInsertCollege
DROP TRIGGER IF EXISTS trg_AfterInsertCollege;
CREATE TRIGGER trg_AfterInsertCollege
AFTER INSERT ON College
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, New_Values, Changed_By)
    VALUES ('College', 'INSERT', NEW.CName, CONCAT('Phone:', NEW.CPhone, ', Office:', NEW.COffice), 'SYSTEM');
END //

-- Trigger 12: AfterInsertDept
DROP TRIGGER IF EXISTS trg_AfterInsertDept;
CREATE TRIGGER trg_AfterInsertDept
AFTER INSERT ON Dept
FOR EACH ROW
BEGIN
    INSERT INTO Audit_Log (Table_Name, Operation, Record_Id, New_Values, Changed_By)
    VALUES ('Dept', 'INSERT', NEW.DCode, CONCAT('DName:', NEW.DName, ', CName:', NEW.CName), 'SYSTEM');
END //

DELIMITER ;
