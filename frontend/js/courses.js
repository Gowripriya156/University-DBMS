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
            <td class="flex items-center space-x-2">
                <button onclick="openSyllabusModal('${c.CCode}')" class="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded transition-colors text-sm font-medium flex items-center gap-2" title="Manage NoSQL Syllabus"><i class="fa-solid fa-file-lines"></i> NoSQL Syllabus</button>
                <button onclick="openEditCourseModal('${c.CCode}')" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="handleDeleteCourse('${c.CCode}')" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `;
    
    container.innerHTML = createTable(headers, cacheCourses, rowBuilder);
}

function getDeptOptions(selected = '') {
    // Wait, the Course table takes DCode. The dept view returns DCode, DeptName. 
    return `<option value="">-- Select Department --</option>` + 
        cacheDepts.map(d => `<option value="${d.DCode}" ${d.DCode === selected ? 'selected' : ''}>${d.DeptName || d.DName}</option>`).join('');
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

window.addSyllabusRow = function(containerId, type) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'flex items-center space-x-2 mt-2 animate-fade-in';
    
    if (type === 'topic' || type === 'material') {
        div.innerHTML = `
            <input type="text" name="${type}" required class="form-input flex-1" placeholder="Enter ${type}...">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 rounded transition-colors bg-red-50 hover:bg-red-100" title="Remove"><i class="fa-solid fa-trash"></i></button>
        `;
    } else if (type === 'custom') {
        div.innerHTML = `
            <input type="text" name="custom_key" required class="form-input w-1/3 text-sm font-mono" placeholder="Key (e.g. Website)">
            <input type="text" name="custom_val" required class="form-input flex-1" placeholder="Value">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 rounded transition-colors bg-red-50 hover:bg-red-100" title="Remove"><i class="fa-solid fa-trash"></i></button>
        `;
    }
    container.appendChild(div);
};

async function openSyllabusModal(ccode) {
    let syllabusData = {
        topics: ["Introduction", "Midterm"],
        materials: ["Textbook v2"]
    };
    try {
        const material = await api.getMaterial(ccode);
        if (material) {
            syllabusData = material;
        }
    } catch (err) {
        // Expected 404 if no material exists yet
    }

    const predefinedKeys = ['topics', 'materials', '_id', 'CCode'];
    const customKeys = Object.keys(syllabusData).filter(k => !predefinedKeys.includes(k));

    let topicsHtml = (syllabusData.topics || []).map(t => `
        <div class="flex items-center space-x-2 mt-2">
            <input type="text" name="topic" required class="form-input flex-1" value="${String(t).replace(/"/g, '&quot;')}" placeholder="Enter topic...">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 rounded transition-colors bg-red-50 hover:bg-red-100"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    let materialsHtml = (syllabusData.materials || []).map(m => `
        <div class="flex items-center space-x-2 mt-2">
            <input type="text" name="material" required class="form-input flex-1" value="${String(m).replace(/"/g, '&quot;')}" placeholder="Enter material...">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 rounded transition-colors bg-red-50 hover:bg-red-100"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    let customHtml = customKeys.map(k => `
        <div class="flex items-center space-x-2 mt-2">
            <input type="text" name="custom_key" required class="form-input w-1/3 text-sm font-mono" value="${String(k).replace(/"/g, '&quot;')}" placeholder="Key">
            <input type="text" name="custom_val" required class="form-input flex-1" value="${String(syllabusData[k]).replace(/"/g, '&quot;')}" placeholder="Value">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700 p-2 rounded transition-colors bg-red-50 hover:bg-red-100"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');

    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-file-code mr-2 text-indigo-600"></i> NoSQL Syllabus: ${ccode}</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="syllabus-form" onsubmit="handleSyllabusSubmit(event, '${ccode}')">
            <div class="space-y-6 max-h-[60vh] overflow-y-auto pr-2 fancy-scrollbar">
                
                <div class="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div class="flex justify-between items-center mb-2">
                        <label class="form-label text-indigo-900 mb-0"><i class="fa-solid fa-list-ul mr-1"></i> Topics</label>
                        <button type="button" onclick="addSyllabusRow('topics-container', 'topic')" class="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1 rounded font-semibold transition-colors shadow-sm"><i class="fa-solid fa-plus mr-1"></i> Add</button>
                    </div>
                    <div id="topics-container">
                        ${topicsHtml}
                    </div>
                </div>

                <div class="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <div class="flex justify-between items-center mb-2">
                        <label class="form-label text-emerald-900 mb-0"><i class="fa-solid fa-book-bookmark mr-1"></i> Materials</label>
                        <button type="button" onclick="addSyllabusRow('materials-container', 'material')" class="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 rounded font-semibold transition-colors shadow-sm"><i class="fa-solid fa-plus mr-1"></i> Add</button>
                    </div>
                    <div id="materials-container">
                        ${materialsHtml}
                    </div>
                </div>

                <div class="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <div class="flex justify-between items-center mb-2">
                        <label class="form-label text-amber-900 mb-0"><i class="fa-solid fa-tags mr-1"></i> Custom Details</label>
                        <button type="button" onclick="addSyllabusRow('custom-container', 'custom')" class="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded font-semibold transition-colors shadow-sm"><i class="fa-solid fa-plus mr-1"></i> Add</button>
                    </div>
                    <p class="text-xs text-amber-700/80 mb-3 leading-tight">Define dynamic Key-Value attributes (e.g. Website, Grading, Prerequisites).</p>
                    <div id="custom-container">
                        ${customHtml}
                    </div>
                </div>

            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary flex items-center bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-md hover:shadow-lg transition-all"><i class="fa-solid fa-server mr-2"></i> Save Changes</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleSyllabusSubmit(e, ccode) {
    e.preventDefault();
    
    const data = {
        topics: [],
        materials: []
    };

    const topicInputs = document.querySelectorAll('input[name="topic"]');
    topicInputs.forEach(i => {
        if(i.value.trim()) data.topics.push(i.value.trim());
    });

    const materialInputs = document.querySelectorAll('input[name="material"]');
    materialInputs.forEach(i => {
        if(i.value.trim()) data.materials.push(i.value.trim());
    });

    const customKeys = document.querySelectorAll('input[name="custom_key"]');
    const customVals = document.querySelectorAll('input[name="custom_val"]');
    for(let i=0; i<customKeys.length; i++) {
        const k = customKeys[i].value.trim();
        const v = customVals[i].value.trim();
        if(k && v && !['topics','materials','_id','CCode'].includes(k)) {
            data[k] = v;
        }
    }

    try {
        await api.saveMaterial(ccode, data);
        showToast("MongoDB syllabus updated successfully!", "success");
        closeModal();
    } catch (error) {
        showToast("Failed to save syllabus data", "error");
    }
}
