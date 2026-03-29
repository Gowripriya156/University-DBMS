USE university_db;

CREATE TABLE Audit_Log (
    Log_Id INT PRIMARY KEY AUTO_INCREMENT,
    Table_Name VARCHAR(50),
    Operation VARCHAR(10),
    Record_Id VARCHAR(100),
    Old_Values TEXT,
    New_Values TEXT,
    Changed_By VARCHAR(100),
    Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Grade_History (
    History_Id INT PRIMARY KEY AUTO_INCREMENT,
    SId INT,
    Sec_Id INT,
    Old_Grade VARCHAR(2),
    New_Grade VARCHAR(2),
    Changed_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
