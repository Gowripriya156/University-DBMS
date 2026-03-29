document.addEventListener('DOMContentLoaded', () => {
    loadDepts();
});

let cacheColleges = [];
let cacheInstructors = [];

async function loadDepts() {
    try {
        const [depts, colleges, instructors] = await Promise.all([
            api.getDepts(),
            api.getColleges(),
            api.getInstructors()
        ]);
        cacheColleges = colleges;
        cacheInstructors = instructors;
        
        const container = document.getElementById('depts-table-container');
        
        const headers = ['Code', 'Department Name', 'College', 'ChairName', 'People', 'Academics', 'Actions'];
        const rowBuilder = (d) => `
            <tr onclick="showDeptReport('${d.DCode}')" class="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                <td class="font-mono font-bold text-purple-700">${d.DCode}</td>
                <td class="font-semibold text-gray-800">${d.DeptName}</td>
                <td class="text-gray-600">${d.CollegeName || '-'}</td>
                <td class="text-gray-600">${d.ChairName || '-'}</td>
                <td class="text-xs text-gray-500">
                    <span title="Instructors"><i class="fa-solid fa-chalkboard-user w-4 mr-1 text-emerald-500"></i>${d.NumInstructors}</span><br>
                    <span title="Students"><i class="fa-solid fa-user-graduate w-4 mr-1 text-blue-500"></i>${d.NumStudents}</span>
                </td>
                <td class="text-xs text-gray-500">
                    <span title="Courses"><i class="fa-solid fa-book w-4 mr-1 text-amber-500"></i>${d.NumCourses}</span><br>
                    <span title="Sections"><i class="fa-solid fa-chalkboard w-4 mr-1 text-purple-500"></i>${d.NumSections}</span>
                </td>
                <td class="space-x-2" onclick="event.stopPropagation()">
                    <button onclick="openEditDeptModal('${d.DCode}')" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="handleDeleteDept('${d.DCode}')" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
        
        container.innerHTML = createTable(headers, depts, rowBuilder);
    } catch (error) {
        console.error("Failed to load departments", error);
    }
}

async function showDeptReport(dcode) {
    try {
        const report = await api.getDeptReport(dcode);
        const v = document.getElementById('dept-report-view');
        
        document.getElementById('rep-icon').innerText = dcode.substring(0,2).toUpperCase();
        document.getElementById('rep-title').innerText = `${report.DName} (${dcode})`;
        document.getElementById('rep-college').innerText = report.CollegeName || 'No College Assigned';
        document.getElementById('rep-chair').innerText = report.ChairName || 'Not Assigned';
        
        document.getElementById('rep-inst').innerText = report.NumInstructors;
        document.getElementById('rep-stu').innerText = report.NumStudents;
        document.getElementById('rep-crs').innerText = report.NumCourses;
        document.getElementById('rep-sec').innerText = report.NumSections;
        
        document.getElementById('rep-office').innerText = report.DOffice || 'N/A';
        document.getElementById('rep-phone').innerText = report.DPhone || 'N/A';
        
        v.classList.remove('hidden');
        // Scroll to top to see report
        document.querySelector('.overflow-y-auto').scrollTo({top: 0, behavior: 'smooth'});
    } catch(err) {
        // error handled by api
    }
}

function getCollegeOptions(selected = '') {
    return `<option value="">-- Select College --</option>` + 
        cacheColleges.map(c => `<option value="${c.CName}" ${c.CName === selected ? 'selected' : ''}>${c.CName}</option>`).join('');
}

function getInstructorOptions(selected = null) {
    return `<option value="">-- No Chair --</option>` + 
        cacheInstructors.map(i => `<option value="${i.Id}" ${i.Id == selected ? 'selected' : ''}>${i.IName} (${i.DName || 'No Dept'})</option>`).join('');
}

function openAddDeptModal() {
    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-plus-circle mr-2 text-blue-600"></i> Add New Department</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="dept-form" onsubmit="handleAddSubmit(event)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="form-label">Department Code *</label>
                    <input type="text" id="dcode" required class="form-input" placeholder="e.g., CS">
                </div>
                <div>
                    <label class="form-label">Department Name *</label>
                    <input type="text" id="dname" required class="form-input">
                </div>
                <div>
                    <label class="form-label">College</label>
                    <select id="cname" class="form-input">
                        ${getCollegeOptions()}
                    </select>
                </div>
                <div>
                    <label class="form-label">Chair</label>
                    <select id="chair_id" class="form-input">
                        ${getInstructorOptions()}
                    </select>
                </div>
                <div>
                    <label class="form-label">Office</label>
                    <input type="text" id="doffice" class="form-input">
                </div>
                <div>
                    <label class="form-label">Phone</label>
                    <input type="text" id="dphone" class="form-input">
                </div>
                <div>
                    <label class="form-label">Chair Start Date</label>
                    <input type="date" id="cstartdate" class="form-input">
                </div>
            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-save mr-2"></i> Save Department</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleAddSubmit(e) {
    e.preventDefault();
    const data = {
        dcode: document.getElementById('dcode').value,
        dname: document.getElementById('dname').value,
        cname: document.getElementById('cname').value || null,
        chair_id: document.getElementById('chair_id').value || null,
        doffice: document.getElementById('doffice').value,
        dphone: document.getElementById('dphone').value,
        cstartdate: document.getElementById('cstartdate').value || null
    };

    try {
        await api.addDept(data);
        showToast("Department added successfully");
        closeModal();
        loadDepts();
    } catch (error) {}
}

async function openEditDeptModal(dcode) {
    showLoading();
    try {
        // Fetch specific dept full info
        const deptResponse = await fetch(`${API_BASE_URL}/depts/${encodeURIComponent(dcode)}`);
        if(!deptResponse.ok) throw new Error("Failed connecting to local server");
        const dept = await deptResponse.json();
        hideLoading();

        if(dept.error) return showToast(dept.error, "error");

        const formHtml = `
            <div class="flex justify-between items-center mb-6 border-b pb-4">
                <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-pen-to-square mr-2 text-blue-600"></i> Edit Department: ${dcode}</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="dept-form" onsubmit="handleEditSubmit(event, '${dcode}')">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                        <label class="form-label">Department Name *</label>
                        <input type="text" id="dname" required value="${dept.DName || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">College</label>
                        <select id="cname" class="form-input">
                            ${getCollegeOptions(dept.CName)}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Chair</label>
                        <select id="chair_id" class="form-input">
                            ${getInstructorOptions(dept.Chair_Id)}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Office</label>
                        <input type="text" id="doffice" value="${dept.DOffice || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Phone</label>
                        <input type="text" id="dphone" value="${dept.DPhone || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Chair Start Date</label>
                        <input type="date" id="cstartdate" value="${dept.CStartDate ? dept.CStartDate.split('T')[0] : ''}" class="form-input">
                    </div>
                </div>
                 <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-save mr-2"></i> Update</button>
                </div>
            </form>
        `;
        openModal(formHtml);
    } catch(err) {
        hideLoading();
        showToast(err.message, 'error');
    }
}

async function handleEditSubmit(e, dcode) {
    e.preventDefault();
    const data = {
        dname: document.getElementById('dname').value,
        cname: document.getElementById('cname').value || null,
        chair_id: document.getElementById('chair_id').value || null,
        doffice: document.getElementById('doffice').value,
        dphone: document.getElementById('dphone').value,
        cstartdate: document.getElementById('cstartdate').value || null
    };

    try {
        await api.updateDept(dcode, data);
        showToast("Department updated successfully");
        closeModal();
        loadDepts();
        document.getElementById('dept-report-view').classList.add('hidden'); // Hide report if open as it changed
    } catch (error) {}
}

function handleDeleteDept(dcode) {
    confirmAction(
        "Delete Department",
        `Are you sure you want to delete department ${dcode}? This will fail if there are any students, instructors, or courses linked to it.`,
        async () => {
            try {
                await api.deleteDept(dcode);
                showToast("Department deleted successfully");
                loadDepts();
                document.getElementById('dept-report-view').classList.add('hidden');
            } catch (error) {}
        }
    );
}
