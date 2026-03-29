document.addEventListener('DOMContentLoaded', () => {
    // Only run if on dashboard page
    if(!document.getElementById('dashboard-view')) return;

    loadDashboardData();
});

let deptChartInstance = null;
let gradeChartInstance = null;

async function loadDashboardData() {
    try {
        const userStr = localStorage.getItem('uni_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const role = user ? user.role : 'University';

        if(role === 'University') {
            // University View
            const [students, depts, audit] = await Promise.all([
                api.getStudents(),
                api.getDepts(),
                api.getAuditLog()
            ]);
            
            // Show only the 2 major boxes at top
            const dashCounts = document.getElementById('dash-counts');
            if(dashCounts) {
               dashCounts.innerHTML = `
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between col-span-1 md:col-span-2">
                    <div>
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Students (Whole University)</p>
                        <h3 class="text-3xl font-bold text-blue-600 mt-2">${students.length}</h3>
                    </div>
                    <div class="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl"><i class="fa-solid fa-users"></i></div>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between col-span-1 md:col-span-2">
                    <div>
                        <p class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Active Departments</p>
                        <h3 class="text-3xl font-bold text-purple-600 mt-2">${depts.length}</h3>
                    </div>
                    <div class="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 text-2xl"><i class="fa-solid fa-sitemap"></i></div>
                </div>
               `;
            }
            
            // Hide charts but SHOW THE AUDIT LOG (Details entered)
            const chartsContainer = document.getElementById('charts-container');
            if(chartsContainer) chartsContainer.style.display = 'none';
            
            // Show audit log section
            const auditSection = document.querySelector('.bg-white.rounded-xl.shadow-sm.border.border-gray-100.overflow-hidden').parentElement;
            if(auditSection) auditSection.style.display = 'block';

            renderAuditLog(audit.slice(0, 15));

        } else {
            // College Admin View
            const [students, instructors, courses, depts, grades, audit] = await Promise.all([
                api.getStudents(),
                api.getInstructors(),
                api.getCourses(),
                api.getDepts(),
                api.getReport('grade-distribution'),
                api.getAuditLog()
            ]);

            // Ensure charts are visible
            const chartsContainer = document.getElementById('charts-container');
            if(chartsContainer) chartsContainer.style.display = 'grid';

            // Update counts in the 4 boxes
            const sCount = document.getElementById('dash-students');
            const iCount = document.getElementById('dash-instructors');
            const cCount = document.getElementById('dash-courses');
            const dCount = document.getElementById('dash-depts');
            
            if(sCount) sCount.innerText = students.length || 0;
            if(iCount) iCount.innerText = instructors.length || 0;
            if(cCount) cCount.innerText = courses.length || 0;
            if(dCount) dCount.innerText = depts.length || 0;

            // Render Dept Chart
            renderDeptChart(depts);
            
            // Render Grade Chart
            renderGradeChart(grades);

            // Render Audit Log
            renderAuditLog(audit.slice(0, 10));
        }

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

function renderDeptChart(depts) {
    const ctx = document.getElementById('deptChart');
    if(!ctx) return;
    if(deptChartInstance) deptChartInstance.destroy();

    const labels = depts.map(d => d.DName || d.DeptName || d.DCode);
    const data = depts.map(d => d.NumStudents || 0);

    deptChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Students',
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderGradeChart(gradesData) {
    const ctx = document.getElementById('gradeChart');
    if(!ctx) return;
    if(gradeChartInstance) gradeChartInstance.destroy();

    let totalA = 0, totalB = 0, totalC = 0, totalD = 0, totalF = 0;
    gradesData.forEach(r => {
        totalA += parseInt(r.GradeA_Count) || 0;
        totalB += parseInt(r.GradeB_Count) || 0;
        totalC += parseInt(r.GradeC_Count) || 0;
        totalD += parseInt(r.GradeD_Count) || 0;
        totalF += parseInt(r.GradeF_Count) || 0;
    });

    gradeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['A Range', 'B Range', 'C Range', 'D Range', 'F'],
            datasets: [{
                data: [totalA, totalB, totalC, totalD, totalF],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function renderAuditLog(logs) {
    const body = document.getElementById('dash-audit-body');
    if(!body) return;

    if(!logs || logs.length === 0) {
        body.innerHTML = `<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">No recent activity detected.</td></tr>`;
        return;
    }

    body.innerHTML = logs.map(log => {
        let opColor = 'text-gray-500';
        if(log.Operation === 'INSERT') opColor = 'text-green-600 bg-green-50 px-2 py-1 rounded-md text-xs font-bold';
        else if(log.Operation === 'UPDATE') opColor = 'text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold';
        else if(log.Operation === 'DELETE') opColor = 'text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold';
        
        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${log.Formatted_Time || log.Changed_At}</td>
                <td class="px-4 py-3 font-medium text-gray-900">${log.Table_Name}</td>
                <td class="px-4 py-3"><span class="${opColor}">${log.Operation}</span></td>
                <td class="px-4 py-3 font-mono text-xs text-gray-600">${log.Record_Id}</td>
                <td class="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title="${log.New_Values || log.Old_Values}">
                    ${log.New_Values || log.Old_Values || '-'}
                </td>
            </tr>
        `;
    }).join('');
}
