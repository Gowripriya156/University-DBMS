let currentData = null;

function toggleParams() {
    const sel = document.getElementById('query-select').value;
    const pArea = document.getElementById('params-area');
    const pSem = document.getElementById('param-sem');
    const pYear = document.getElementById('param-year');
    
    pArea.classList.add('hidden');
    pSem.classList.add('hidden');
    pYear.classList.add('hidden');

    if(sel === 'busy-instructors') {
        pArea.classList.remove('hidden');
        pSem.classList.remove('hidden');
        pYear.classList.remove('hidden');
    }
}

async function executeQuery(e) {
    e.preventDefault();
    const type = document.getElementById('query-select').value;
    const title = document.getElementById('query-select').options[document.getElementById('query-select').selectedIndex].text;
    
    let params = '';
    if(type === 'busy-instructors') {
        const sem = document.getElementById('input-sem').value;
        const year = document.getElementById('input-year').value;
        params = `sem=${encodeURIComponent(sem)}&year=${year}`;
    }

    document.getElementById('result-title').innerText = title;
    
    showLoading();
    try {
        const data = await api.getQuery(type, params);
        currentData = data;
        renderResults(type, data);
        if(data && data.length > 0) {
            document.getElementById('btn-export').classList.remove('hidden');
        } else {
            document.getElementById('btn-export').classList.add('hidden');
        }
    } catch(err) {
        document.getElementById('result-content').innerHTML = `<p class="text-red-500 py-8 text-center">Failed to execute query: ${err.message}</p>`;
        document.getElementById('btn-export').classList.add('hidden');
    }
    hideLoading();
}

function renderResults(type, data) {
    const container = document.getElementById('result-content');
    
    if(!data || data.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-gray-500 bg-gray-50 rounded-lg italic">No results returned for this query.</div>`;
        return;
    }

    // Dynamic rendering of headers based on keys
    const rawHeaders = Object.keys(data[0]);
    // Optionally format headers to be spaced 'Camel Case' -> 'Camel Case' (simple regex)
    const formattedHeaders = rawHeaders.map(h => h.replace(/([A-Z])/g, ' $1').trim());
    
    const rowBuilder = (row) => `
        <tr class="hover:bg-blue-50/50">
            ${rawHeaders.map((h, i) => {
                let v = row[h];
                if(v === null || v===undefined) v = '-';
                // formatting
                let css = "text-sm text-gray-700";
                if(i===0) css += " font-medium"; // first col bold
                if(h.includes('GPA') || h.includes('Count')) css += " text-center";
                return `<td class="${css}">${v}</td>`;
            }).join('')}
        </tr>
    `;

    container.innerHTML = createTable(formattedHeaders, data, rowBuilder);
}

function exportCSV() {
    if(!currentData || currentData.length === 0) return;
    
    const headers = Object.keys(currentData[0]);
    const csvRows = [];
    csvRows.push(headers.join(',')); // Header row
    
    for(const row of currentData) {
        const values = headers.map(header => {
            let val = row[header];
            if(val === null || val === undefined) val = '';
            // Escape quotes and wrap in quotes if contains comma
            val = String(val).replace(/"/g, '""');
            if(val.includes(',')) val = `"${val}"`;
            return val;
        });
        csvRows.push(values.join(','));
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const queryName = document.getElementById('query-select').value;
    link.setAttribute("download", `unidbms_export_${queryName}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
}
