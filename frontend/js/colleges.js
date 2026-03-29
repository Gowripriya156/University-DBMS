document.addEventListener('DOMContentLoaded', () => {
    loadColleges();
});

let currentInstructors = [];

async function loadColleges() {
    try {
        const [colleges, instructors] = await Promise.all([
            api.getReport('college-overview'), // Uses the view which includes DeanName
            api.getInstructors()
        ]);
        currentInstructors = instructors; // Cache for dropdowns
        
        const container = document.getElementById('colleges-table-container');
        
        const headers = ['College Name', 'Office', 'Phone', 'Dean', 'Depts', 'Data', 'Actions'];
        const rowBuilder = (col) => `
            <tr>
                <td class="font-semibold text-gray-800">${col.CName || '-'}</td>
                <td>${col.COffice || '-'}</td>
                <td>${col.CPhone || '-'}</td>
                <td>${col.DeanName || '<span class="text-gray-400 italic">None</span>'}</td>
                <td><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${col.NumDepts || 0}</span></td>
                <td class="text-xs text-gray-500">
                    <div class="flex flex-col space-y-1">
                        <span><i class="fa-solid fa-user-graduate w-4"></i> ${col.TotalStudents || 0}</span>
                        <span><i class="fa-solid fa-book w-4"></i> ${col.TotalCourses || 0}</span>
                    </div>
                </td>
                <td class="space-x-2">
                    <button onclick="openEditCollegeModal('${col.CName}', '${col.COffice}', '${col.CPhone}', '${col.DeanName}')" class="text-blue-600 hover:text-blue-900"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button onclick="handleDeleteCollege('${col.CName}')" class="text-red-600 hover:text-red-900"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `;
        
        container.innerHTML = createTable(headers, colleges, rowBuilder);
    } catch (error) {
        console.error("Failed to load colleges", error);
    }
}

function getInstructorOptions(selectedName = null) {
    let options = `<option value="">-- No Dean --</option>`;
    currentInstructors.forEach(inst => {
        const isSelected = inst.IName === selectedName ? 'selected' : '';
        options += `<option value="${inst.Id}" ${isSelected}>${inst.IName} (${inst.DName || 'No Dept'})</option>`;
    });
    return options;
}

function openAddCollegeModal() {
    const formHtml = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-gray-800">Add New College</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <form id="college-form" onsubmit="handleAddSubmit(event)">
            <div class="space-y-4">
                <div>
                    <label class="form-label">College Name *</label>
                    <input type="text" id="cname" required class="form-input">
                </div>
                <div>
                    <label class="form-label">Office Location</label>
                    <input type="text" id="coffice" class="form-input">
                </div>
                <div>
                    <label class="form-label">Phone</label>
                    <input type="text" id="cphone" class="form-input">
                </div>
                <div>
                    <label class="form-label">Dean</label>
                    <select id="dean_id" class="form-input">
                        ${getInstructorOptions()}
                    </select>
                </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary">Save College</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleAddSubmit(e) {
    e.preventDefault();
    const data = {
        cname: document.getElementById('cname').value,
        coffice: document.getElementById('coffice').value,
        cphone: document.getElementById('cphone').value,
        dean_id: document.getElementById('dean_id').value || null
    };

    try {
        await api.addCollege(data);
        showToast("College added successfully");
        closeModal();
        loadColleges();
    } catch (error) {
        // Error handled in API
    }
}

function openEditCollegeModal(cname, coffice, cphone, deanName) {
    // Find dean ID from name if possible, or we could just fetch single college details. 
    // Faster to fetch single college to be safe.
    showLoading();
    api.getColleges().then(colleges => {
        hideLoading();
        const col = colleges.find(c => c.CName === cname);
        if(!col) return showToast("College data error", "error");

        let deanHtmlOptions = `<option value="">-- No Dean --</option>`;
        currentInstructors.forEach(inst => {
            const isSelected = inst.Id == col.Dean_Id ? 'selected' : '';
            deanHtmlOptions += `<option value="${inst.Id}" ${isSelected}>${inst.IName} (${inst.DName || 'No Dept'})</option>`;
        });

        const formHtml = `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-gray-800">Edit College: ${cname}</h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <form id="college-form" onsubmit="handleEditSubmit(event, '${cname}')">
                <div class="space-y-4">
                    <div>
                        <label class="form-label">Office Location</label>
                        <input type="text" id="coffice" value="${col.COffice || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Phone</label>
                        <input type="text" id="cphone" value="${col.CPhone || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Dean</label>
                        <select id="dean_id" class="form-input">
                            ${deanHtmlOptions}
                        </select>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                    <button type="submit" class="btn-primary">Update College</button>
                </div>
            </form>
        `;
        openModal(formHtml);
    });
}

async function handleEditSubmit(e, cname) {
    e.preventDefault();
    const data = {
        coffice: document.getElementById('coffice').value,
        cphone: document.getElementById('cphone').value,
        dean_id: document.getElementById('dean_id').value || null
    };

    try {
        await api.updateCollege(cname, data);
        showToast("College updated successfully");
        closeModal();
        loadColleges();
    } catch (error) {}
}

function handleDeleteCollege(cname) {
    confirmAction(
        "Delete College",
        `Are you sure you want to delete ${cname}? This action cannot be undone and will fail if departments exist under it.`,
        async () => {
            try {
                await api.deleteCollege(cname);
                showToast("College deleted successfully");
                loadColleges();
            } catch (error) {}
        }
    );
}
