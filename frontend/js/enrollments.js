document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

let cacheEnroll = [];
let cacheStudents = [];
let cacheSections = [];

async function loadData() {
    try {
        const [enrollments, students, sections] = await Promise.all([
            api.getEnrollments(),
            api.getStudents(), // For SId to Name mapping if needed for enrollment dropdowns
            api.getSections()  // For SecId to details for dropdowns
        ]);
        cacheEnroll = enrollments;
        cacheStudents = students;
        cacheSections = sections;
        
        populateDatalists();
        renderTable();
    } catch (error) {}
}

function renderTable() {
    const q = document.getElementById('search-enroll').value.toLowerCase();
    let filtered = cacheEnroll;
    if(q) {
        filtered = filtered.filter(e => 
            e.Fname.toLowerCase().includes(q) || 
            e.Lname.toLowerCase().includes(q) || 
            e.CoName.toLowerCase().includes(q) ||
            e.SId.toString().includes(q)
        );
    }

    const container = document.getElementById('enroll-table-container');
    const headers = ['Student', 'Section Info', 'Course', 'Grade', 'Actions'];
    const rowBuilder = (e) => {
        let gradeBadge = `<span class="italic text-gray-400">In Progress</span>`;
        if(e.Grade) {
            let colors = "bg-gray-100 text-gray-800";
            if(e.Grade.startsWith('A')) colors = "bg-green-100 text-green-800";
            if(e.Grade.startsWith('B')) colors = "bg-blue-100 text-blue-800";
            if(e.Grade.startsWith('C')) colors = "bg-yellow-100 text-yellow-800";
            if(e.Grade.startsWith('D')) colors = "bg-orange-100 text-orange-800";
            if(e.Grade === 'F') colors = "bg-red-100 text-red-800";
            if(e.Grade === 'W') colors = "bg-slate-200 text-slate-700";
            
            gradeBadge = `<span class="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold ${colors} ring-1 ring-black/5 shadow-sm">${e.Grade}</span>`;
        }
        
        return `
        <tr class="hover:bg-blue-50/50 transition-colors">
            <td>
                <div class="font-medium text-gray-900">${e.Fname} ${e.Lname}</div>
                <div class="text-xs text-gray-500 font-mono mt-0.5">ID: ${e.SId}</div>
            </td>
             <td>
                <div class="text-sm text-gray-700">Sec ID: <span class="font-mono text-purple-600 font-semibold">${e.Sec_Id}</span></div>
                <div class="text-xs text-gray-500 mt-0.5">Section No: ${e.SecNo}</div>
            </td>
            <td class="font-semibold text-gray-800">${e.CoName}</td>
            <td class="text-center">${gradeBadge}</td>
            <td class="space-x-2 w-32">
                <button onclick="openAssignGradeModal(${e.SId}, ${e.Sec_Id}, '${e.Grade||''}')" class="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded text-xs font-medium transition-colors"><i class="fa-solid fa-award mr-1"></i> Grade</button>
                <button onclick="handleDropStudent(${e.SId}, ${e.Sec_Id})" class="text-red-500 hover:text-red-700 p-1.5 rounded transition-colors" title="Drop Section"><i class="fa-solid fa-user-minus"></i></button>
            </td>
        </tr>
    `};
    
    container.innerHTML = createTable(headers, filtered, rowBuilder);
}

function populateDatalists() {
    const sl = document.getElementById('student-list');
    sl.innerHTML = cacheStudents.map(s => `<option value="${s.SId}">${s.StudentFullName}</option>`).join('');
    
    const sec = document.getElementById('section-list');
    sec.innerHTML = cacheSections.map(s => `<option value="${s.Sec_Id}">${s.CourseName} (${s.Sem} ${s.Year} - Sec ${s.SecNo})</option>`).join('');
}

function openEnrollModal() {
    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-user-plus mr-2 text-blue-600"></i> Enroll Student</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="enroll-form" onsubmit="handleEnrollSubmit(event)">
            <div class="space-y-6">
                <div>
                    <label class="form-label">Student ID *</label>
                    <!-- Using input with datalist for combo-box behavior -->
                    <input list="student-list" id="sid" required class="form-input" placeholder="Type or select ID...">
                </div>
                <div>
                    <label class="form-label">Section ID *</label>
                    <input list="section-list" id="sec_id" required class="form-input" placeholder="Type or select Section ID...">
                </div>
            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-check mr-2"></i> Enroll</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleEnrollSubmit(e) {
    e.preventDefault();
    const data = {
        sid: parseInt(document.getElementById('sid').value),
        sec_id: parseInt(document.getElementById('sec_id').value)
    };

    try {
        await api.enrollStudent(data);
        showToast("Student enrolled successfully");
        closeModal();
        loadData();
    } catch (error) {}
}

const grades = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','W','I'];

function openAssignGradeModal(sid, secId, currentGrade) {
    const gradeOptions = `<option value="">-- Clear Grade (In Progress) --</option>` + 
        grades.map(g => `<option value="${g}" ${g === currentGrade ? 'selected' : ''}>${g}</option>`).join('');

    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-award mr-2 text-amber-500"></i> Assign Grade</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
            <p class="text-sm text-gray-600 font-medium">Student ID: <span class="font-mono text-gray-900">${sid}</span></p>
            <p class="text-sm text-gray-600 font-medium mt-1">Section ID: <span class="font-mono text-purple-600">${secId}</span></p>
        </div>
        <form id="grade-form" onsubmit="handleGradeSubmit(event, ${sid}, ${secId})">
            <div>
                <label class="form-label mb-2">Select Grade</label>
                <select id="grade" class="form-input text-lg py-3 font-semibold text-center">
                    ${gradeOptions}
                </select>
            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-colors flex items-center"><i class="fa-solid fa-save mr-2"></i> Save Grade</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleGradeSubmit(e, sid, sec_id) {
    e.preventDefault();
    const data = {
        sid: sid,
        sec_id: sec_id,
        grade: document.getElementById('grade').value || null
    };

    try {
        await api.assignGrade(data);
        showToast("Grade assigned successfully");
        closeModal();
        loadData();
    } catch (error) {}
}

function handleDropStudent(sid, secId) {
    confirmAction(
        "Drop Student",
        `Drop Student ${sid} from Section ${secId}? This cannot be done if the student has a finalized grade.`,
        async () => {
             try {
                await api.dropStudent({sid, sec_id: secId});
                showToast("Student dropped from section");
                loadData();
            } catch (error) {}
        }
    );
}
