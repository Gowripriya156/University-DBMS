USE university_db;

-- Insert Colleges
INSERT INTO College (CName, COffice, CPhone) VALUES
('Engineering', 'ENG 101', '555-0101'),
('Arts & Sciences', 'AS 201', '555-0201'),
('Business', 'BUS 301', '555-0301');

-- Insert Departments
INSERT INTO Dept (DCode, DName, DOffice, DPhone, CName) VALUES
('CS', 'Computer Science', 'ENG 201', '555-1101', 'Engineering'),
('EE', 'Electrical Engineering', 'ENG 301', '555-1201', 'Engineering'),
('ME', 'Mechanical Engineering', 'ENG 401', '555-1301', 'Engineering'),
('MATH', 'Mathematics', 'AS 101', '555-2101', 'Arts & Sciences'),
('PHYS', 'Physics', 'AS 201', '555-2201', 'Arts & Sciences'),
('ENG', 'English', 'AS 301', '555-2301', 'Arts & Sciences'),
('FIN', 'Finance', 'BUS 101', '555-3101', 'Business'),
('MKT', 'Marketing', 'BUS 201', '555-3201', 'Business'),
('MGT', 'Management', 'BUS 301', '555-3301', 'Business');

-- Insert Instructors
INSERT INTO Instructor (IName, IOffice, IPhone, Rank, DCode) VALUES
('Alice Smith', 'ENG 202', '555-1102', 'Professor', 'CS'),
('Bob Johnson', 'ENG 203', '555-1103', 'Associate Professor', 'CS'),
('Charlie Brown', 'ENG 204', '555-1104', 'Assistant Professor', 'CS'),
('David Lee', 'ENG 302', '555-1202', 'Professor', 'EE'),
('Eve Davis', 'ENG 303', '555-1203', 'Lecturer', 'EE'),
('Frank Garcia', 'ENG 402', '555-1302', 'Professor', 'ME'),
('Grace Hall', 'AS 102', '555-2102', 'Professor', 'MATH'),
('Henry King', 'AS 103', '555-2103', 'Associate Professor', 'MATH'),
('Ivy Lewis', 'AS 202', '555-2202', 'Professor', 'PHYS'),
('Jack Martinez', 'AS 302', '555-2302', 'Lecturer', 'ENG'),
('Karen Nelson', 'BUS 102', '555-3102', 'Professor', 'FIN'),
('Leo Perez', 'BUS 202', '555-3202', 'Associate Professor', 'MKT'),
('Mia Quinn', 'BUS 302', '555-3302', 'Professor', 'MGT');

-- Set Deans (Circular dependency resolution)
UPDATE College SET Dean_Id = 1 WHERE CName = 'Engineering';
UPDATE College SET Dean_Id = 7 WHERE CName = 'Arts & Sciences';
UPDATE College SET Dean_Id = 11 WHERE CName = 'Business';

-- Set Chairs
UPDATE Dept SET Chair_Id = 1, CStartDate = '2020-01-01' WHERE DCode = 'CS';
UPDATE Dept SET Chair_Id = 4, CStartDate = '2021-01-01' WHERE DCode = 'EE';
UPDATE Dept SET Chair_Id = 6, CStartDate = '2019-01-01' WHERE DCode = 'ME';
UPDATE Dept SET Chair_Id = 7, CStartDate = '2020-01-01' WHERE DCode = 'MATH';
UPDATE Dept SET Chair_Id = 9, CStartDate = '2022-01-01' WHERE DCode = 'PHYS';
UPDATE Dept SET Chair_Id = 11, CStartDate = '2020-01-01' WHERE DCode = 'FIN';
UPDATE Dept SET Chair_Id = 12, CStartDate = '2021-01-01' WHERE DCode = 'MKT';
UPDATE Dept SET Chair_Id = 13, CStartDate = '2019-01-01' WHERE DCode = 'MGT';


-- Insert Courses
INSERT INTO Course (CCode, CoName, Credits, DCode) VALUES
('CS101', 'Intro to Programming', 3, 'CS'),
('CS201', 'Data Structures', 4, 'CS'),
('CS301', 'Algorithms', 4, 'CS'),
('CS401', 'Database Systems', 3, 'CS'),
('EE101', 'Circuits I', 3, 'EE'),
('EE201', 'Signals and Systems', 4, 'EE'),
('ME101', 'Statics', 3, 'ME'),
('MATH101', 'Calculus I', 4, 'MATH'),
('MATH102', 'Calculus II', 4, 'MATH'),
('MATH201', 'Linear Algebra', 3, 'MATH'),
('PHYS101', 'Physics I', 4, 'PHYS'),
('ENG101', 'English Composition', 3, 'ENG'),
('FIN101', 'Principles of Finance', 3, 'FIN'),
('MKT101', 'Principles of Marketing', 3, 'MKT'),
('MGT101', 'Principles of Management', 3, 'MGT');

-- Insert Students
INSERT INTO Student (Fname, Lname, Addr, Phone, Major, DOB, DCode) VALUES
('Noah', 'Adams', '123 Main St', '555-4001', 'Computer Science', '2000-05-15', 'CS'),
('Olivia', 'Baker', '456 Oak St', '555-4002', 'Computer Science', '2001-08-20', 'CS'),
('Liam', 'Clark', '789 Pine St', '555-4003', 'Electrical Engineering', '1999-11-10', 'EE'),
('Emma', 'Diaz', '321 Elm St', '555-4004', 'Mathematics', '2002-02-25', 'MATH'),
('William', 'Evans', '654 Maple St', '555-4005', 'Physics', '2000-07-30', 'PHYS'),
('Ava', 'Ford', '987 Cedar St', '555-4006', 'Finance', '2001-04-12', 'FIN'),
('James', 'Gomez', '147 Birch St', '555-4007', 'Marketing', '1998-09-05', 'MKT'),
('Isabella', 'Hayes', '258 Walnut St', '555-4008', 'Management', '2002-12-18', 'MGT'),
('Mason', 'Irwin', '369 Cherry St', '555-4009', 'Computer Science', '2000-10-22', 'CS'),
('Sophia', 'Jones', '741 Spruce St', '555-4010', 'Mathematics', '2001-06-08', 'MATH'),
('Logan', 'Kelly', '852 Fir St', '555-4011', 'Computer Science', '1999-12-01', 'CS'),
('Amelia', 'Lopez', '963 Ash St', '555-4012', 'Electrical Engineering', '2002-03-14', 'EE');

-- Insert Sections
INSERT INTO Section (SecNo, Sem, Year, Bldg, RoomNo, CCode, Inst_Id) VALUES
(1, 'Fall', 2023, 'ENG', '101', 'CS101', 1),
(2, 'Fall', 2023, 'ENG', '102', 'CS101', 2),
(1, 'Fall', 2023, 'ENG', '201', 'CS201', 1),
(1, 'Fall', 2023, 'AS', '101', 'MATH101', 7),
(1, 'Fall', 2023, 'AS', '201', 'PHYS101', 9),
(1, 'Spring', 2024, 'ENG', '101', 'CS101', 3),
(1, 'Spring', 2024, 'ENG', '201', 'CS201', 2),
(1, 'Spring', 2024, 'ENG', '301', 'CS301', 1),
(1, 'Spring', 2024, 'AS', '102', 'MATH102', 8),
(1, 'Spring', 2024, 'BUS', '101', 'FIN101', 11),
(1, 'Fall', 2024, 'ENG', '101', 'CS101', 2),
(1, 'Fall', 2024, 'ENG', '401', 'CS401', 1),
(1, 'Fall', 2024, 'AS', '101', 'MATH101', 7),
(1, 'Fall', 2024, 'BUS', '201', 'MKT101', 12);

-- Insert Takes (Enrollments)
INSERT INTO Takes (SId, Sec_Id, Grade) VALUES
(1, 1, 'A'), (1, 4, 'B+'), (1, 5, 'A-'), -- Noah Adams (Fall 2023)
(2, 2, 'B'), (2, 4, 'A'), (2, 5, 'C+'), -- Olivia Baker (Fall 2023)
(3, 1, 'C'), (3, 4, 'B-'),              -- Liam Clark (Fall 2023)
(4, 4, 'A+'),                             -- Emma Diaz (Fall 2023)
(1, 6, 'A'), (1, 7, 'A-'), (1, 9, 'B+'), -- Noah Adams (Spring 2024)
(2, 7, 'B+'), (2, 9, 'A-'),             -- Olivia Baker (Spring 2024)
(9, 6, 'B'), (9, 7, 'C'),               -- Mason Irwin (Spring 2024)
(1, 12, 'A'),                           -- Noah Adams (Fall 2024)
(11, 11, NULL), (10, 13, NULL),         -- Logan, Sophia (Fall 2024 - In Progress)
(6, 10, 'A'), (7, 10, 'B'), (8, 10, 'A-'), -- Business students (Spring 2024)
(5, 5, 'F'), (5, 4, 'F'), (5, 9, 'F'), -- Failing student for Q9
(4, 6, 'D'), (4, 7, 'D+'), (4, 9, 'C-'), -- Low GPA student for Q2
(8, 11, 'A'), (9, 13, 'B'), (3, 13, 'C'); -- More enrollments

