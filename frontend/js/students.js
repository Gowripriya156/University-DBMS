// Check if search param is in URL from dashboard global search
const urlParams = new URLSearchParams(window.location.search);
const initialSearch = urlParams.get('search');

document.addEventListener('DOMContentLoaded', () => {
    if(initialSearch) {
        document.getElementById('local-search').value = initialSearch;
        performSearch(initialSearch);
    } else {
        loadData();
    }

    // Debounced search
    let timer;
    document.getElementById('local-search')?.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            const val = e.target.value.trim();
            if(val.length > 0) {
                performSearch(val);
            } else {
                loadData();
            }
        }, 500);
    });
});

let cacheStudents = [];
let cacheDepts = [];

async function loadData() {
    try {
        const [students, depts] = await Promise.all([
            api.getStudents(), // From vw_StudentEnrollment view
            api.getDepts()   // for filter
        ]);
        cacheStudents = students;
        cacheDepts = depts;
        
        populateFilters();
        renderTable();
    } catch (error) {}
}

async function performSearch(query) {
    showLoading();
    try {
        // use SP sp_SearchStudents
        const students = await api.searchStudents(query);
        // Map SP properties to view properties for consistent rendering
        cacheStudents = students.map(s => ({
            SId: s.SId,
            StudentFullName: s.Fname + ' ' + s.Lname,
            DeptName: s.Department || s.DeptName || s.DName,
            Major: s.Major,
            // Search SP doesn't return GPA/Credits, but that's ok, just show N/A
            GPA: null, TotalCoursesCompleted: null, CurrentEnrollments: null
        }));
        
        // ensure we have depts loaded for the edit modal
        if(cacheDepts.length === 0) {
            cacheDepts = await api.getDepts();
            populateFilters();
        }

        renderTable();
    } catch(err) {
        showToast("Search failed", "error");
    } finally {
        hideLoading();
    }
}

function populateFilters() {
    const s = document.getElementById('filter-dept');
    // keep "all"
    s.innerHTML = '<option value="all">All Depts</option>' + cacheDepts.map(d => `<option value="${d.DName}">${d.DName}</option>`).join('');
}

function renderTable() {
    const deptFilter = document.getElementById('filter-dept').value;
    
    let filtered = cacheStudents;
    if(deptFilter !== 'all') {
        filtered = filtered.filter(s => s.DeptName === deptFilter);
    }

    const container = document.getElementById('students-table-container');
    const headers = ['ID', 'Student Name', 'Department / Major', 'Academics', 'Actions'];
    const rowBuilder = (s) => `
        <tr onclick="loadTranscript(${s.SId}, '${s.StudentFullName.replace(/'/g, "\\'")}')" class="hover:bg-blue-50/50 cursor-pointer group transition-colors">
            <td class="font-mono text-sm text-gray-500">${s.SId}</td>
            <td class="font-bold text-gray-800 flex items-center">
                <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 font-bold text-xs ring-2 ring-white shadow-sm">
                    ${s.StudentFullName.substring(0,2).toUpperCase()}
                </div>
                ${s.StudentFullName}
            </td>
            <td>
                <div class="flex flex-col text-sm">
                    <span class="font-semibold text-gray-700">${s.DeptName || '-'}</span>
                    <span class="text-xs text-gray-500">${s.Major || '-'}</span>
                </div>
            </td>
            <td class="text-xs text-gray-500 flex flex-col space-y-1">
                <span>GPA: <strong class="text-gray-800">${s.GPA !== null ? s.GPA : 'N/A'}</strong></span>
                <span>Credits: ${s.TotalCoursesCompleted !== null ? (s.TotalCoursesCompleted*3) + '+' : 'N/A'}</span>
            </td>
            <td class="space-x-2" onclick="event.stopPropagation()">
                <button onclick="openEditStudentModal(${s.SId})" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="handleDeleteStudent(${s.SId})" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `;
    
    container.innerHTML = createTable(headers, filtered, rowBuilder);
}

async function loadTranscript(sid, name) {
    try {
        const transcript = await api.getStudentTranscript(sid);
        
        const v = document.getElementById('transcript-view');
        document.getElementById('tr-name').innerText = name;
        document.getElementById('tr-id').innerText = sid;
        
        const container = document.getElementById('transcript-table-container');
        if(transcript.length === 0) {
            container.innerHTML = `<div class="p-8 text-center text-gray-500 italic bg-gray-50 rounded-lg">No transcript records found for this student.</div>`;
        } else {
            const headers = ['Term', 'Course', 'Instructor', 'Credits', 'Grade'];
            const rowBuilder = (t) => {
                let gradeClass = 'text-gray-800 font-bold';
                if(t.Grade && t.Grade.startsWith('A')) gradeClass = 'text-green-600 font-bold';
                if(t.Grade && (t.Grade.startsWith('D') || t.Grade === 'F')) gradeClass = 'text-red-600 font-bold';
                if(!t.Grade) gradeClass = 'text-gray-400 italic';
                
                return `
                <tr>
                    <td class="text-sm">
                        <span class="font-semibold text-gray-700">${t.Semester} ${t.Year}</span><br>
                        <span class="text-xs text-gray-500 line-clamp-1">Sec: ${t.SectionNo}</span>
                    </td>
                    <td class="text-sm">
                        <span class="font-mono text-xs text-blue-600">${t.CourseCode}</span>
                        <div class="font-medium text-gray-800 line-clamp-1">${t.CourseName}</div>
                    </td>
                    <td class="text-sm text-gray-600">${t.InstructorName || 'TBD'}</td>
                    <td class="text-sm text-center">${t.Credits}</td>
                    <td class="${gradeClass} text-center">${t.Grade || 'In Progress'}</td>
                </tr>
            `};
            // Override createTable to add custom class if passed, but here we just use utils.js logic
            container.innerHTML = createTable(headers, transcript, rowBuilder);
        }
        
        v.classList.remove('hidden');
        document.querySelector('.overflow-y-auto').scrollTo({top: 0, behavior: 'smooth'});
    } catch(err) {
        showToast("Transcript not found.", "error");
    }
}

function getDeptOptions(selected = '') {
    return `<option value="">-- Let system inherit --</option>` + 
        cacheDepts.map(d => `<option value="${d.DCode}" ${d.DCode === selected ? 'selected' : ''}>${d.DName}</option>`).join('');
}

function openAddStudentModal() {
    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-user-plus mr-2 text-blue-600"></i> Add Student</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="stu-form" onsubmit="handleAddSubmit(event)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="form-label">First Name *</label>
                    <input type="text" id="fname" required class="form-input">
                </div>
                <div>
                    <label class="form-label">Last Name *</label>
                    <input type="text" id="lname" required class="form-input">
                </div>
                <div class="md:col-span-2">
                    <label class="form-label">Address</label>
                    <input type="text" id="addr" class="form-input">
                </div>
                <div>
                    <label class="form-label">Phone</label>
                    <input type="text" id="phone" class="form-input">
                </div>
                <div>
                    <label class="form-label">Date of Birth</label>
                    <input type="date" id="dob" class="form-input" max="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label class="form-label">Department</label>
                    <select id="dcode" class="form-input">
                        ${getDeptOptions()}
                    </select>
                </div>
                <div>
                    <label class="form-label">Major</label>
                    <input type="text" id="major" class="form-input">
                </div>
            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-save mr-2"></i> Enroll Student</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleAddSubmit(e) {
    e.preventDefault();
    const data = {
        fname: document.getElementById('fname').value,
        lname: document.getElementById('lname').value,
        addr: document.getElementById('addr').value,
        phone: document.getElementById('phone').value,
        dob: document.getElementById('dob').value || null,
        dcode: document.getElementById('dcode').value || null,
        major: document.getElementById('major').value
    };

    try {
        await api.addStudent(data);
        showToast("Student created successfully");
        closeModal();
        if(document.getElementById('local-search').value) {
            performSearch(document.getElementById('local-search').value);
        } else {
            loadData();
        }
    } catch (error) {}
}

async function openEditStudentModal(sid) {
    try {
        // Must fetch complete student info because vw_StudentEnrollment hides DCode, Addr, DOB etc.
        const res = await api.getStudent(sid);
        
        const formHtml = `
            <div class="flex justify-between items-center mb-6 border-b pb-4">
                <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-pen-to-square mr-2 text-blue-600"></i> Edit Student: ${sid}</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="stu-form" onsubmit="handleEditSubmit(event, ${sid})">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">First Name *</label>
                        <input type="text" id="fname" required value="${res.Fname}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Last Name *</label>
                        <input type="text" id="lname" required value="${res.Lname}" class="form-input">
                    </div>
                    <div class="md:col-span-2">
                        <label class="form-label">Address</label>
                        <input type="text" id="addr" value="${res.Addr || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Phone</label>
                        <input type="text" id="phone" value="${res.Phone || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Date of Birth</label>
                        <input type="date" id="dob" value="${res.DOB ? res.DOB.split('T')[0] : ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Department</label>
                        <select id="dcode" class="form-input">
                            ${getDeptOptions(res.DCode)}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Major</label>
                        <input type="text" id="major" value="${res.Major || ''}" class="form-input">
                    </div>
                </div>
                <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-save mr-2"></i> Update</button>
                </div>
            </form>
        `;
        openModal(formHtml);
    } catch(err) {}
}

async function handleEditSubmit(e, sid) {
    e.preventDefault();
    const data = {
        fname: document.getElementById('fname').value,
        lname: document.getElementById('lname').value,
        addr: document.getElementById('addr').value,
        phone: document.getElementById('phone').value,
        dob: document.getElementById('dob').value || null,
        dcode: document.getElementById('dcode').value || null,
        major: document.getElementById('major').value
    };

    try {
        await api.updateStudent(sid, data);
        showToast("Student updated successfully");
        closeModal();
        if(document.getElementById('local-search').value) {
            performSearch(document.getElementById('local-search').value);
        } else {
            loadData();
        }
        document.getElementById('transcript-view').classList.add('hidden');
    } catch (error) {}
}

function handleDeleteStudent(sid) {
    confirmAction(
        "Delete Student",
        `Are you sure you want to delete student ID ${sid}? This will delete their enrollment records, but will fail if they have graded courses.`,
        async () => {
            try {
                await api.deleteStudent(sid);
                showToast("Student wiped systemically");
                if(document.getElementById('local-search').value) {
                    performSearch(document.getElementById('local-search').value);
                } else {
                    loadData();
                }
                document.getElementById('transcript-view').classList.add('hidden');
            } catch (error) {
                // error is toasted inside API handler natively
            }
        }
    );
}
