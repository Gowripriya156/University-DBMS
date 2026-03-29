USE university_db;

CREATE INDEX idx_student_dcode ON Student(DCode);
CREATE INDEX idx_student_lname ON Student(Lname);
CREATE INDEX idx_instructor_dcode ON Instructor(DCode);
CREATE INDEX idx_section_ccode ON Section(CCode);
CREATE INDEX idx_section_inst_id ON Section(Inst_Id);
CREATE INDEX idx_section_sem_year ON Section(Sem, Year);
CREATE INDEX idx_takes_sid ON Takes(SId);
CREATE INDEX idx_takes_sec_id ON Takes(Sec_Id);
CREATE INDEX idx_dept_cname ON Dept(CName);
