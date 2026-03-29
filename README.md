# University Database Management System

A full-stack, comprehensive Database Management System built specifically to manage a university ecosystem (Colleges, Departments, Faculty, Courses, Students, and Enrollments). 

This application demonstrates advanced relational database concepts. **100% of the business logic**, including constraints, calculated fields, auditing, data validation, and aggregation, resides entirely within MySQL 8.0+ using Stored Procedures, Functions, Triggers, and Views. 

The Python backend serves strictly as a **thin API layer** that connects the Vanilla frontend to the database.

## 🚀 Key Features
- **Zero Backend Business Logic**: Python handles strictly network requests, mapping routes directly to MySQL `CALL sp_...` statements.
- **Complex Relational Schema**: 7 Core tables with fully implemented foreign keys (`CASCADE` and `SET NULL` behaviors).
- **18 Advanced Stored Procedures**: Complete CRUD mapped strictly strictly to Procedures.
- **10 Custom SQL Functions**: Used for on-the-fly calculations like `fn_GetStudentGPA()` (A+=4.0, A-=3.7 etc.)
- **10 Triggers**: For maintaining `Audit_Log` insertions, `Grade_History` updates, auto-date stamps, and cross-department validations.
- **10 Virtual Views**: Providing pre-computed aggregates to construct the dashboard instantly without complex frontend assembly.
- **18 Complex Queries**: Ranging from Window Functions (`RANK OVER PARTITION`), existential subqueries (`NOT EXISTS`), self-joins, to complex `GROUP BY` rollups.
- **Aesthetic Frontend**: Modern, responsive dashboard powered by Tailwind CSS, featuring Chart.js integration, micro-animations, glassmorphism elements, and Toastify notifications.

## 🛠️ Technology Stack
- **Database**: MySQL 8.0+
- **Backend API**: Python 3.9+ (Flask, `mysql-connector-python`, `flask-cors`)
- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS, Chart.js, Toastify
- **Architecture**: N-Tier (DB-Heavy, Thin API, Thick Client view)

---

## 💻 Setup Instructions

### 1. Database Setup (MySQL)
1. Open your MySQL client (e.g., MySQL Workbench, DBeaver, or CLI).
2. Execute the scripts located in the `database/` folder in the **exact numerical order provided**:
    - `00_create_database.sql`
    - `01_create_tables.sql`
    - `02_alter_foreign_keys.sql`
    - `03_create_audit_tables.sql`
    - `04_indexes.sql`
    - `05_functions.sql`
    - `06_stored_procedures.sql`
    - `07_triggers.sql`
    - `08_views.sql`
    - `09_complex_queries.sql`
    - `10_sample_data.sql`

*Note: The script generation has specifically ordered them to prevent circular dependency lookup failures.*

### 2. Backend Setup (Python API)
1. Ensure you have Python 3.9+ installed.
2. Navigate to the `backend/` directory in your terminal.
3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4. Update your MySQL connection settings natively in `backend/config.py` or via environment variables (default user: `root`, default pass: `root`, port: `3306`).
5. Start the API server:
    ```bash
    python app.py
    ```
   *The Flask API will run on `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend/` folder.
2. Serve the folder using a local HTTP server to avoid CORS issues with `file://` protocols:
    ```bash
    python -m http.server 8000
    ```
3. Open your browser and go to `http://localhost:8000/index.html` to view the beautiful dashboard!

---

## 📜 Project Structure

```text
university-dbms/
├── database/                    # SQL Scripts (Schema, Triggers, Procs, Views)
├── backend/                     # Python Flask API
│   ├── app.py
│   ├── config.py
│   ├── db.py
│   ├── requirements.txt
│   └── routes/                  # Blueprint REST endpoints
└── frontend/                    # Browser-native Web Application UI
    ├── index.html               # Main Dashboard
    ├── colleges.html            
    ├── departments.html
    ├── instructors.html
    ├── courses.html
    ├── students.html
    ├── sections.html
    ├── enrollments.html
    ├── reports.html             # Pre-aggregated report views
    ├── queries.html             # Complex query execution views
    ├── css/
    │   └── styles.css
    └── js/
        ├── api.js               # Centralized API fetch logic
        ├── utils.js             # Globals for Modal, Toast, Loading UI
        └── ...                  # Page specific JS files
```

## 🔐 Security Context
Currently, CORS is generically bypassed with `flask-cors` configuring `origins="*"` for local accessibility. SQL injections are mitigated as **every** SQL route strictly invokes Stored Procedures via bound payload variables with `cursor.callproc()` or bound variables inside `cursor.execute()`. Python handles ZERO string interpolation against arbitrary input.
