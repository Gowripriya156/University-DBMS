document.addEventListener('DOMContentLoaded', () => {
    loadData();
});

let cacheInsts = [];
let cacheDepts = [];

async function loadData() {
    try {
        const [insts, depts] = await Promise.all([
            api.getInstructors(),
            api.getDepts()
        ]);
        cacheInsts = insts;
        cacheDepts = depts;
        
        populateDeptFilter();
        renderTable();
    } catch (error) {
        console.error("Failed to load instructors", error);
    }
}

function populateDeptFilter() {
    const select = document.getElementById('filter-dept');
    cacheDepts.forEach(d => {
        select.innerHTML += `<option value="${d.DCode}">${d.DCode} - ${d.DName}</option>`;
    });
}

function renderTable() {
    const filterDept = document.getElementById('filter-dept').value;
    let filtered = cacheInsts;
    if(filterDept !== 'all') {
        filtered = cacheInsts.filter(i => i.DCode === filterDept);
    }

    const container = document.getElementById('inst-table-container');
    const headers = ['ID', 'Name', 'Rank', 'Department', 'Contact', 'Actions'];
    const rowBuilder = (i) => `
        <tr class="hover:bg-blue-50/50 transition-colors">
            <td class="font-mono text-xs text-gray-500">${i.Id}</td>
            <td class="font-semibold text-gray-800 flex items-center">
                <div class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 font-bold text-xs">
                    ${i.IName.substring(0,2).toUpperCase()}
                </div>
                ${i.IName}
            </td>
            <td>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    ${i.Rank}
                </span>
            </td>
            <td class="text-sm text-gray-600">${i.DName || i.DCode || '-'}</td>
            <td class="text-xs text-gray-500">
                <div class="flex flex-col space-y-1">
                    <span><i class="fa-solid fa-door-open w-4"></i> ${i.IOffice || 'N/A'}</span>
                    <span><i class="fa-solid fa-phone w-4"></i> ${i.IPhone || 'N/A'}</span>
                </div>
            </td>
            <td class="space-x-2">
                <button onclick="openEditInstModal(${i.Id})" class="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="handleDeleteInst(${i.Id})" class="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        </tr>
    `;
    
    container.innerHTML = createTable(headers, filtered, rowBuilder);
}

function getDeptOptions(selected = '') {
    return `<option value="">-- Select Department --</option>` + 
        cacheDepts.map(d => `<option value="${d.DCode}" ${d.DCode === selected ? 'selected' : ''}>${d.DName}</option>`).join('');
}

const rankOptions = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Adjunct'];
function getRankOptions(selected = '') {
    return rankOptions.map(r => `<option value="${r}" ${r === selected ? 'selected' : ''}>${r}</option>`).join('');
}

function openAddInstModal() {
    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-user-plus mr-2 text-blue-600"></i> Add New Instructor</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="inst-form" onsubmit="handleAddSubmit(event)">
            <div class="space-y-4">
                <div>
                    <label class="form-label">Full Name *</label>
                    <input type="text" id="iname" required class="form-input">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Rank *</label>
                        <select id="rank" required class="form-input">
                            ${getRankOptions()}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Department</label>
                        <select id="dcode" class="form-input">
                            ${getDeptOptions()}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Office</label>
                        <input type="text" id="ioffice" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Phone</label>
                        <input type="text" id="iphone" class="form-input">
                    </div>
                </div>
            </div>
            <div class="mt-8 flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="submit" class="btn-primary flex items-center"><i class="fa-solid fa-save mr-2"></i> Save Instructor</button>
            </div>
        </form>
    `;
    openModal(formHtml);
}

async function handleAddSubmit(e) {
    e.preventDefault();
    const data = {
        iname: document.getElementById('iname').value,
        ioffice: document.getElementById('ioffice').value,
        iphone: document.getElementById('iphone').value,
        rank: document.getElementById('rank').value,
        dcode: document.getElementById('dcode').value || null
    };

    try {
        await api.addInstructor(data);
        showToast("Instructor added successfully");
        closeModal();
        loadData();
    } catch (error) {}
}

function openEditInstModal(id) {
    const inst = cacheInsts.find(i => i.Id === id);
    if(!inst) return;

    const formHtml = `
        <div class="flex justify-between items-center mb-6 border-b pb-4">
            <h2 class="text-xl font-bold text-gray-800"><i class="fa-solid fa-pen-to-square mr-2 text-blue-600"></i> Edit Instructor: ${inst.IName}</h2>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="inst-form" onsubmit="handleEditSubmit(event, ${id})">
            <div class="space-y-4">
                <div>
                    <label class="form-label">Full Name *</label>
                    <input type="text" id="iname" required value="${inst.IName}" class="form-input">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Rank *</label>
                        <select id="rank" required class="form-input">
                            ${getRankOptions(inst.Rank)}
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Department</label>
                        <select id="dcode" class="form-input">
                            ${getDeptOptions(inst.DCode)}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="form-label">Office</label>
                        <input type="text" id="ioffice" value="${inst.IOffice || ''}" class="form-input">
                    </div>
                    <div>
                        <label class="form-label">Phone</label>
                        <input type="text" id="iphone" value="${inst.IPhone || ''}" class="form-input">
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
}

async function handleEditSubmit(e, id) {
    e.preventDefault();
    const data = {
        iname: document.getElementById('iname').value,
        ioffice: document.getElementById('ioffice').value,
        iphone: document.getElementById('iphone').value,
        rank: document.getElementById('rank').value,
        dcode: document.getElementById('dcode').value || null
    };

    try {
        await api.updateInstructor(id, data);
        showToast("Instructor updated successfully");
        closeModal();
        loadData();
    } catch (error) {}
}

function handleDeleteInst(id) {
    confirmAction(
        "Delete Instructor",
        `Are you sure you want to delete instructor ID ${id}? This will fail if they are a Dean or Chair.`,
        async () => {
            try {
                await api.deleteInstructor(id);
                showToast("Instructor deleted successfully");
                loadData();
            } catch (error) {}
        }
    );
}
