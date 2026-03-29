document.addEventListener('DOMContentLoaded', () => {
    // Load first report automatically
    const firstBtn = document.querySelector('#report-nav button');
    if(firstBtn) loadReport('gpa-rankings', firstBtn);
});

async function loadReport(type, btn) {
    // Nav highlight
    document.querySelectorAll('#report-nav button').forEach(b => {
        b.className = "w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors";
    });
    btn.className = "w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 rounded-l-none";

    // Set title
    const titles = {
        'gpa-rankings': 'Student GPA Rankings',
        'dept-summary': 'Department Summary Report',
        'college-overview': 'College Overview Report',
        'instructor-load': 'Faculty Teaching Load',
        'grade-distribution': 'Course Grade Distribution',
        'audit-log': 'System Audit Log'
    };
    document.getElementById('report-title').innerText = titles[type];
    
    showLoading();
    try {
        const data = await api.getReport(type);
        renderReport(type, data);
    } catch(err) {
        document.getElementById('report-content').innerHTML = `<p class="text-red-500 text-center py-8">Failed to fetch report data.</p>`;
    }
    hideLoading();
}

function renderReport(type, data) {
    const container = document.getElementById('report-content');
    
    if(!data || data.length === 0) {
        container.innerHTML = `<p class="text-gray-500 italic text-center py-8">No data available for this report.</p>`;
        return;
    }

    let headers = [];
    let rowBuilder = null;

    if(type === 'gpa-rankings') {
        headers = ['Rank', 'ID', 'Name', 'Program', 'Total Credits', 'System GPA'];
        data = data.sort((a,b) => b.GPA - a.GPA);
        rowBuilder = (d, i) => `
            <tr>
                <td class="font-bold text-gray-500">${i+1}</td>
                <td class="font-mono text-xs text-blue-600">${d.SId}</td>
                <td class="font-medium text-gray-800">${d.Fname} ${d.Lname}</td>
                <td class="text-gray-600">${d.DeptName || '-'}</td>
                <td class="text-center">${d.TotalCredits}</td>
                <td class="text-center font-bold ${d.GPA < 2.5 ? 'text-red-500' : 'text-emerald-500'}">${d.GPA}</td>
            </tr>
        `;
    } 
    else if (type === 'dept-summary') {
        headers = ['Dept', 'College', 'Chair', 'Faculty', 'Students', 'Courses', 'Active Sections'];
        rowBuilder = (d) => `
            <tr>
                <td class="font-bold text-purple-700">${d.DeptName} (${d.DCode})</td>
                <td class="text-gray-600">${d.CollegeName || '-'}</td>
                <td class="text-gray-600">${d.ChairName || '-'}</td>
                <td class="text-center">${d.NumInstructors}</td>
                <td class="text-center">${d.NumStudents}</td>
                <td class="text-center">${d.NumCourses}</td>
                <td class="text-center">${d.NumSections}</td>
            </tr>
        `;
    }
    else if (type === 'college-overview') {
         headers = ['College', 'Dean', 'Location', 'Depts', 'Faculty', 'Students'];
         rowBuilder = (d) => `
            <tr>
                <td class="font-bold text-gray-800">${d.CName}</td>
                <td class="text-gray-600">${d.DeanName || '-'}</td>
                <td class="text-gray-500 text-sm">${d.COffice} <br> ${d.CPhone}</td>
                <td class="text-center">${d.NumDepts}</td>
                <td class="text-center">${d.TotalInstructors}</td>
                <td class="text-center">${d.TotalStudents}</td>
            </tr>
        `;
    }
    else if (type === 'instructor-load') {
         headers = ['ID', 'Faculty Member', 'Rank', 'Dept', 'Sections (This Sem)', 'Total Historic', 'Distinct Courses'];
         rowBuilder = (d) => `
            <tr>
                <td class="font-mono text-xs text-gray-500">${d.InstructorId}</td>
                <td class="font-medium text-gray-800">${d.InstructorName}</td>
                <td class="text-sm text-gray-600">${d.Rank}</td>
                <td class="text-sm text-gray-600">${d.DeptName || '-'}</td>
                 <td class="text-center font-bold ${d.NumSectionsCurrentSem > 3 ? 'text-red-500' : 'text-blue-500'}">${d.NumSectionsCurrentSem}</td>
                <td class="text-center">${d.NumSectionsTotal}</td>
                <td class="text-center">${d.NumDistinctCourses}</td>
            </tr>
        `;
    }
    else if (type === 'grade-distribution') {
        headers = ['Course', 'A Range', 'B Range', 'C Range', 'D Range', 'F (Fails)', 'Overall Avg GPA'];
        rowBuilder = (d) => `
            <tr>
                <td class="font-semibold text-gray-800">
                    <span class="font-mono text-xs text-blue-600 mr-2">${d.CCode}</span>${d.CourseName}
                </td>
                <td class="text-center text-green-600">${d.GradeA_Count}</td>
                <td class="text-center text-blue-600">${d.GradeB_Count}</td>
                <td class="text-center text-amber-500">${d.GradeC_Count}</td>
                <td class="text-center text-orange-500">${d.GradeD_Count}</td>
                <td class="text-center font-bold text-red-600">${d.GradeF_Count}</td>
                <td class="text-center font-semibold text-gray-800">${d.AvgGPA}</td>
            </tr>
        `;
    }
    else if (type === 'audit-log') {
         headers = ['Timestamp', 'Table', 'Action', 'Record ID', 'By', 'Details'];
         rowBuilder = (d) => {
             let color = 'text-gray-600';
             if(d.Operation === 'INSERT') color = 'text-green-600';
             if(d.Operation === 'UPDATE' || d.Operation === 'GRADE_CHANGE' || d.Operation==='TRANSFER') color = 'text-blue-600';
             if(d.Operation.includes('DELETE')) color = 'text-red-600';
             
             return `
            <tr>
                <td class="whitespace-nowrap text-xs text-gray-500">${d.Formatted_Time}</td>
                <td class="font-medium text-gray-800">${d.Table_Name}</td>
                <td class="font-bold text-xs ${color}">${d.Operation}</td>
                <td class="font-mono text-xs">${d.Record_Id}</td>
                <td class="text-xs text-gray-600">${d.Changed_By}</td>
                <td class="text-xs text-gray-500 max-w-xs truncate" title="${d.New_Values||d.Old_Values||''}">${d.New_Values||d.Old_Values||'-'}</td>
            </tr>
        `};
    }

    container.innerHTML = createTable(headers, data, rowBuilder);
}
