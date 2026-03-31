USE university_db;

-- Create tables without foreign keys first to avoid circular reference issues
CREATE TABLE College (
    CName VARCHAR(100) PRIMARY KEY,
    COffice VARCHAR(100),
    CPhone VARCHAR(20),
    Dean_Id INT UNIQUE
);

CREATE TABLE Dept (
    DCode VARCHAR(20) PRIMARY KEY,
    DName VARCHAR(100) NOT NULL UNIQUE,
    DOffice VARCHAR(100),
    DPhone VARCHAR(20),
    Chair_Id INT UNIQUE,
    CStartDate DATE,
    CName VARCHAR(100)
);

CREATE TABLE Instructor (
    Id INT PRIMARY KEY AUTO_INCREMENT,
    IName VARCHAR(100) NOT NULL,
    IOffice VARCHAR(100),
    IPhone VARCHAR(20),
    `Rank` VARCHAR(50),
    DCode VARCHAR(20) NOT NULL
);

CREATE TABLE Course (
    CCode VARCHAR(20) PRIMARY KEY,
    CoName VARCHAR(100) NOT NULL UNIQUE,
    Credits INT NOT NULL CHECK (Credits > 0 AND Credits <= 6),
    DCode VARCHAR(20) NOT NULL
);

CREATE TABLE Student (
    SId INT PRIMARY KEY AUTO_INCREMENT,
    Fname VARCHAR(50) NOT NULL,
    Lname VARCHAR(50) NOT NULL,
    Addr VARCHAR(200),
    Phone VARCHAR(20),
    Major VARCHAR(100),
    DOB DATE,
    DCode VARCHAR(20) NOT NULL
);

CREATE TABLE Section (
    Sec_Id INT PRIMARY KEY AUTO_INCREMENT,
    SecNo INT NOT NULL,
    Sem VARCHAR(20) NOT NULL CHECK (Sem IN ('Fall','Spring','Summer','Winter')),
    Year INT NOT NULL CHECK (Year >= 2000 AND Year <= 2100),
    Bldg VARCHAR(50),
    RoomNo VARCHAR(20),
    CCode VARCHAR(20) NOT NULL,
    Inst_Id INT NOT NULL
);

CREATE TABLE Takes (
    SId INT,
    Sec_Id INT,
    Grade VARCHAR(2) CHECK (Grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','W','I',NULL)),
    PRIMARY KEY (SId, Sec_Id)
);
