document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

let cacheSections = [];
let cacheCourses = [];
let cacheInstructors = [];

async function loadData() {
    try {
        const [sections, courses, instructors] = await Promise.all([
            api.getSections(), // vw_SectionDetails
            api.getCourses(),
            api.getInstructors()
        ]);
        cacheSections = sections;
        cacheCourses = courses;
        cacheInstructors = instructors;
        
        populateFilters();
        renderTable();
    } catch (error) {}
}

function populateFilters() {
    const pTerm = document.getElementById('filter-term');
    const pCcode = document.getElementById('filter-ccode');
    
    // Unique terms
    const uniqueTerms = [...new Set(cacheSections.map(s => `${s.Sem} ${s.Year}`))];
    pTerm.innerHTML = '<option value="all">All Terms</option>' + 
        uniqueTerms.map(t => `<option value="${t}">${t}</option>`).join('');
        
    // Unique courses
    pCcode.innerHTML = '<option value="all">All Courses</option>' + 
        cacheCourses.map(c => `<option value="${c.CCode}">${c.CCode}</option>`).join('');
}

function renderTable() {
    const fTerm = document.getElementById('filter-term').value;
    const fCcode = document.getElementById('filter-ccode').value;
    
    let filtered = cacheSections;
    if(fTerm !== 'all') {
        const [sem, year] = fTerm.split(' ');
        filtered = filtered.filter(s => s.Sem === sem && s.Year == year);
    }
    if(fCcode !== 'all') {
        filtered = filtered.filter(s => s.CCode === fCcode);
    }

    const container = document.getElementById('sections-table-container');
    const headers = ['Sec ID', 'Term', 'Course', 'Instructor', 'Location', 'Enrollment', 'Actions'];
    const rowBuilder = (s) => `
        <tr onclick="loadRoster(${s.Sec_Id}, '${s.CourseName.replace(/'/g, "\\'")}', '${s.Sem} ${s.Year}')" class="hover:bg-blue-50/50 cursor-pointer group transition-colors">
            <td class="font-mono text-sm text-gray-500">${s.Sec_Id}</td>
            <td class="font-semibold text-gray-800">
                ${s.Sem} ${s.Year}<br>
                <span class="text-xs font-normal text-gray-500 text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-1">Section: ${s.SecNo}</span>
            </td>
            <td>
                <span class="font-mono text-xs text-blue-600">${s.CCode}</span>
                <div class="font-medium text-gray-800">${s.CourseName}</div>
            </td>
            <td class="text-sm text-gray-700">${s.InstructorName || '<span class="italic text-gray-400">TBD</span>'}</td>
            <td class="text-sm text-gray-600">
                ${s.Bldg && s.RoomNo ? `${s.Bldg} - ${s.RoomNo}` : 'TBD'}
            </td>
            <td class="text-sm">
                <span class="${s.EnrollmentCount >= 40 ? 'text-red-600 font-bold' : 'text-emerald-600'} flex items-center">
                    <i class="fa-solid fa-users mr-1"></i> ${s.EnrollmentCount} / 40
                </span>
            </td>
            <td class="space-x-2" onclick="event.stopPropagation()">
                <button onclick="openEditSecModal(${s.Sec_Id})" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="handleDeleteSec(${s.Sec_Id})" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `;
    
    container.innerHTML = createTable(headers, filtered, rowBuilder);
}

async function loadRoster(secId, title, sub) {
    showLoading();
    try {
        const enrollments = await api.getEnrollments();
        const roster = enrollments.filter(e => e.Sec_Id === secId);
        
        const v = document.getElementById('roster-view');
        document.getElementById('roster-title').innerText = title;
        document.getElementById('roster-subtitle').innerText = `${sub} | Section ID: ${secId}`;
        
        const container = document.getElementById('roster-table-container');
        if(roster.length === 0) {
             container.innerHTML = `<div class="p-8 text-center text-gray-500 italic bg-gray-50 rounded-lg">No students currently enrolled in this section.</div>`;
        } else {
            const headers = ['SId', 'Student Name', 'Grade'];
            const rowBuilder = (st) => `
                <tr class="hover:bg-gray-50">
                    <td class="font-mono text-xs text-gray-500">${st.SId}</td>
                    <td class="font-medium text-gray-800">${st.Fname} ${st.Lname}</td>
                    <td class="font-semibold ${st.Grade ? 'text-blue-600' : 'text-gray-400'}">${st.Grade || 'In Progress'}</td>
                </tr>
            `;
            container.innerHTML = createTable(headers, roster, rowBuilder);
        }
        
        v.classList.remove('hidden');
        document.querySelector('.overflow-y-auto').scrollTo({top: 0, behavior: 'smooth'});
    } catch (err) { }
    hideLoading();
}

function getCourseOptions(selected = '') {
    return `<option value="">-- Select Course --</option>` + 
        cacheCourses.map(c => `<option value="${c.CCode}" ${c.CCode === selected ? 'selected' : ''}>${c.CCode} - ${c.CourseName}</option>`).join('');
}
function getInstructorOptions(selected = null) {
    return `<option value="">-- TBD (No Instructor) --</option>` + 
        cacheInstructors.map(i => `<option value="${i.Id}" ${i.Id == selected ? 'selected' : ''}>${i.IName} (${i.DName || 'No Dept'})</option>`).join('');
}

function openAddSectionModal() {
    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-chalkboard mr-2 text-blue-600"></i> Offer New Section</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="sec-form" onsubmit="handleAddSubmit(event)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                    <label class="form-label">Course *</label>
                    <select id="ccode" required class="form-input">
                        ${getCourseOptions()}
                    </select>
                </div>
                <div>
                    <label class="form-label">Section No *</label>
                    <input type="number" id="secno" required min="1" class="form-input">
                </div>
                <div>
                    <label class="form-label">Instructor</label>
                    <select id="inst_id" class="form-input">
                        ${getInstructorOptions()}
                    </select>
                </div>
                <div>
                    <label class="form-label">Semester *</label>
                    <select id="sem" required class="form-input">
                        <option value="Fall">Fall</option>
                        <option value="Spring">Spring</option>
                        <option value="Summer">Summer</option>
                        <option value="Winter">Winter</option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Year *</label>
                    <input type="number" id="year" required min="2000" max="2100" value="${new Date().getFullYear()}" class="form-input">
                </div>
                <div>
                    <label class="form-label">Building</label>
                    <input type="text" id="bldg" class="form-input">
                </div>
                <div>
                    <label class="form-label">Room No</label>
                    <input type="text" id="roomno" class="form-input">
                </div>
            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-save mr-2"></i> Save Section</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleAddSubmit(e) {
    e.preventDefault();
    const data = {
        ccode: document.getElementById('ccode').value,
        secno: parseInt(document.getElementById('secno').value),
        inst_id: document.getElementById('inst_id').value || null,
        sem: document.getElementById('sem').value,
        year: parseInt(document.getElementById('year').value),
        bldg: document.getElementById('bldg').value || null,
        roomno: document.getElementById('roomno').value || null
    };

    try {
        await api.addSection(data);
        showToast("Section scheduled successfully");
        closeModal();
        loadData();
    } catch (error) {}
}

async function openEditSecModal(secId) {
    try {
        // Needs raw section info
        const res = await api.request(`/sections/${secId}`);
        const formHtml = `
            <div class="flex justify-between items-center mb-6 border-b pb-4">
                <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-pen-to-square mr-2 text-blue-600"></i> Edit Section: ${secId}</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="sec-form" onsubmit="handleEditSubmit(event, ${secId})">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="form-label">Course *</label>
                        <select id="ccode" required class="form-input">
                            ${getCourseOptions(res.CCode)}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Section No *</label>
                        <input type="number" id="secno" required min="1" value="${res.SecNo}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Instructor</label>
                        <select id="inst_id" class="form-input">
                            ${getInstructorOptions(res.Inst_Id)}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Semester *</label>
                        <select id="sem" required class="form-input">
                            <option value="Fall" ${res.Sem === 'Fall'?'selected':''}>Fall</option>
                            <option value="Spring" ${res.Sem === 'Spring'?'selected':''}>Spring</option>
                            <option value="Summer" ${res.Sem === 'Summer'?'selected':''}>Summer</option>
                            <option value="Winter" ${res.Sem === 'Winter'?'selected':''}>Winter</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Year *</label>
                        <input type="number" id="year" required min="2000" max="2100" value="${res.Year}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Building</label>
                        <input type="text" id="bldg" value="${res.Bldg || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Room No</label>
                        <input type="text" id="roomno" value="${res.RoomNo || ''}" class="form-input">
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

async function handleEditSubmit(e, secId) {
    e.preventDefault();
     const data = {
        ccode: document.getElementById('ccode').value,
        secno: parseInt(document.getElementById('secno').value),
        inst_id: document.getElementById('inst_id').value || null,
        sem: document.getElementById('sem').value,
        year: parseInt(document.getElementById('year').value),
        bldg: document.getElementById('bldg').value || null,
        roomno: document.getElementById('roomno').value || null
    };

    try {
        await api.updateSection(secId, data);
        showToast("Section updated successfully");
        closeModal();
        loadData();
        document.getElementById('roster-view').classList.add('hidden');
    } catch (error) {}
}

function handleDeleteSec(secId) {
    confirmAction(
        "Delete Section",
        `Are you sure you want to delete section ID ${secId}? This will cascade delete related enrollment records.`,
        async () => {
             try {
                await api.deleteSection(secId);
                showToast("Section deleted successfully");
                loadData();
                 document.getElementById('roster-view').classList.add('hidden');
            } catch (error) {}
        }
    );
}
