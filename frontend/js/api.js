const API_BASE_URL = 'http://127.0.0.1:5000/api';

const api = {
    // Generic request handler
    async request(endpoint, options = {}) {
        const userStr = localStorage.getItem('uni_user');
        const user = userStr ? JSON.parse(userStr) : null;
        
        let customHeaders = {
            'Content-Type': 'application/json'
        };
        
        if (user) {
            customHeaders['X-Role'] = user.role;
            customHeaders['X-College'] = user.college || '';
        }

        showLoading();
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    ...customHeaders,
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            hideLoading();
            return data;
        } catch (error) {
            hideLoading();
            showToast(error.message, 'error');
            throw error;
        }
    },

    // Colleges
    getColleges: () => api.request('/colleges'),
    addCollege: (data) => api.request('/colleges', { method: 'POST', body: JSON.stringify(data) }),
    updateCollege: (cname, data) => api.request(`/colleges/${encodeURIComponent(cname)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCollege: (cname) => api.request(`/colleges/${encodeURIComponent(cname)}`, { method: 'DELETE' }),

    // Departments
    getDepts: () => api.request('/depts'),
    addDept: (data) => api.request('/depts', { method: 'POST', body: JSON.stringify(data) }),
    updateDept: (dcode, data) => api.request(`/depts/${encodeURIComponent(dcode)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDept: (dcode) => api.request(`/depts/${encodeURIComponent(dcode)}`, { method: 'DELETE' }),
    getDeptReport: (dcode) => api.request(`/depts/${encodeURIComponent(dcode)}/report`),

    // Instructors
    getInstructors: () => api.request('/instructors'),
    addInstructor: (data) => api.request('/instructors', { method: 'POST', body: JSON.stringify(data) }),
    updateInstructor: (id, data) => api.request(`/instructors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteInstructor: (id) => api.request(`/instructors/${id}`, { method: 'DELETE' }),

    // Courses
    getCourses: () => api.request('/courses'),
    addCourse: (data) => api.request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    updateCourse: (ccode, data) => api.request(`/courses/${encodeURIComponent(ccode)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCourse: (ccode) => api.request(`/courses/${encodeURIComponent(ccode)}`, { method: 'DELETE' }),
    
    // Materials (NoSQL)
    getMaterial: (ccode) => api.request(`/materials/${encodeURIComponent(ccode)}`),
    saveMaterial: (ccode, data) => api.request(`/materials/${encodeURIComponent(ccode)}`, { method: 'POST', body: JSON.stringify(data) }),

    // Students
    getStudents: () => api.request('/students'),
    getStudent: (sid) => api.request(`/students/${sid}`),
    addStudent: (data) => api.request('/students', { method: 'POST', body: JSON.stringify(data) }),
    updateStudent: (sid, data) => api.request(`/students/${sid}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteStudent: (sid) => api.request(`/students/${sid}`, { method: 'DELETE' }),
    searchStudents: (query) => api.request(`/students/search?q=${encodeURIComponent(query)}`),

    // Sections
    getSections: () => api.request('/sections'),
    addSection: (data) => api.request('/sections', { method: 'POST', body: JSON.stringify(data) }),
    updateSection: (sec_id, data) => api.request(`/sections/${sec_id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteSection: (sec_id) => api.request(`/sections/${sec_id}`, { method: 'DELETE' }),

    // Enrollments
    getEnrollments: () => api.request('/enrollments'),
    enrollStudent: (data) => api.request('/enrollments', { method: 'POST', body: JSON.stringify(data) }),
    assignGrade: (data) => api.request('/enrollments', { method: 'PUT', body: JSON.stringify(data) }),
    dropStudent: (data) => api.request('/enrollments', { method: 'DELETE', body: JSON.stringify(data) }),

    // Reports & Queries
    getReport: (type) => api.request(`/reports/${type}`),
    getSemesterReport: (sem, year) => api.request(`/reports/semester/${encodeURIComponent(sem)}/${year}`),
    getGpaRankings: () => api.request('/reports/gpa-rankings'),
    getAuditLog: () => api.request('/reports/audit-log'),
    getStudentTranscript: (sid) => api.request(`/students/${sid}/transcript`),
    getQuery: (endpoint, params = '') => api.request(`/queries/${endpoint}${params ? '?' + params : ''}`)
};
