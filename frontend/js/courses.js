document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

let cacheCourses = [];
let cacheDepts = [];

async function loadData() {
    try {
        const [courses, depts] = await Promise.all([
            api.getCourses(),
            api.getDepts()
        ]);
        cacheCourses = courses;
        cacheDepts = depts;
        
        renderTable();
    } catch (error) {}
}

function renderTable() {
    const container = document.getElementById('courses-table-container');
    const headers = ['Code', 'Course Name', 'Credits', 'Department', 'Stats', 'Actions'];
    const rowBuilder = (c) => `
        <tr class="hover:bg-blue-50/50 transition-colors">
            <td class="font-mono font-bold text-blue-700">${c.CCode}</td>
            <td class="font-semibold text-gray-800">${c.CourseName}</td>
            <td>
                <span class="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-800 text-xs font-bold border border-gray-200">
                    ${c.Credits}
                </span>
            </td>
            <td class="text-sm text-gray-600">${c.DeptName || '-'}</td>
            <td class="text-xs text-gray-500">
                <div class="flex space-x-4">
                    <span title="Sections"><i class="fa-solid fa-chalkboard w-4 text-purple-500"></i> ${c.NumSections || 0}</span>
                    <span title="Total Enrolled"><i class="fa-solid fa-users w-4 text-emerald-500"></i> ${c.TotalEnrolled || 0}</span>
                    <span title="Avg GPA"><i class="fa-solid fa-star w-4 text-amber-500"></i> ${c.AvgGPA > 0 ? c.AvgGPA : 'N/A'}</span>
                </div>
            </td>
            <td class="space-x-2">
                <button onclick="openEditCourseModal('${c.CCode}')" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="handleDeleteCourse('${c.CCode}')" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `;
    
    container.innerHTML = createTable(headers, cacheCourses, rowBuilder);
}

function getDeptOptions(selected = '') {
    // using DName as value to match what might be needed, but DB schema expects DCode.
    // Wait, the Course table takes DCode. The dept view returns DCode, DeptName. 
    return `<option value="">-- Select Department --</option>` + 
        cacheDepts.map(d => `<option value="${d.DCode}" ${d.DCode === selected ? 'selected' : ''}>${d.DName}</option>`).join('');
}

function openAddCourseModal() {
    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-book-open mr-2 text-blue-600"></i> Add New Course</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="course-form" onsubmit="handleAddSubmit(event)">
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Course Code *</label>
                        <input type="text" id="ccode" required class="form-input" placeholder="e.g. CS101" maxlength="20">
                    </div>
                    <div>
                        <label class="form-label">Credits *</label>
                        <input type="number" id="credits" required min="1" max="6" class="form-input">
                    </div>
                </div>
                <div>
                    <label class="form-label">Course Name *</label>
                    <input type="text" id="coname" required class="form-input">
                </div>
                <div>
                    <label class="form-label">Department</label>
                    <select id="dcode" class="form-input">
                        ${getDeptOptions()}
                    </select>
                </div>
            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-save mr-2"></i> Save Course</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleAddSubmit(e) {
    e.preventDefault();
    const data = {
        ccode: document.getElementById('ccode').value.toUpperCase(),
        coname: document.getElementById('coname').value,
        credits: parseInt(document.getElementById('credits').value),
        dcode: document.getElementById('dcode').value || null
    };

    try {
        await api.addCourse(data);
        showToast("Course added successfully");
        closeModal();
        loadData();
    } catch (error) {}
}

async function openEditCourseModal(ccode) {
    showLoading();
    try {
        // Fetch raw course to get actual DCode since view only has DeptName
        const res = await api.request(`/courses/${encodeURIComponent(ccode)}`);
        
        const formHtml = `
            <div class="flex justify-between items-center mb-6 border-b pb-4">
                <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-pen-to-square mr-2 text-blue-600"></i> Edit Course: ${ccode}</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <form id="course-form" onsubmit="handleEditSubmit(event, '${ccode}')">
                <div class="space-y-4">
                     <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                             <label class="form-label">Course Name *</label>
                            <input type="text" id="coname" required value="${res.CoName}" class="form-input">
                        </div>
                        <div>
                            <label class="form-label">Credits *</label>
                            <input type="number" id="credits" required min="1" max="6" value="${res.Credits}" class="form-input">
                        </div>
                        <div>
                            <label class="form-label">Department</label>
                            <select id="dcode" class="form-input">
                                ${getDeptOptions(res.DCode)}
                            </select>
                        </div>
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

async function handleEditSubmit(e, ccode) {
    e.preventDefault();
    const data = {
        coname: document.getElementById('coname').value,
        credits: parseInt(document.getElementById('credits').value),
        dcode: document.getElementById('dcode').value || null
    };

    try {
        await api.updateCourse(ccode, data);
        showToast("Course updated successfully");
        closeModal();
        loadData();
    } catch (error) {}
}

function handleDeleteCourse(ccode) {
    confirmAction(
        "Delete Course",
        `Are you sure you want to delete course ${ccode}? Sections offering this course will also be deleted.`,
        async () => {
            try {
                await api.deleteCourse(ccode);
                showToast("Course deleted successfully");
                loadData();
            } catch (error) {}
        }
    );
}
