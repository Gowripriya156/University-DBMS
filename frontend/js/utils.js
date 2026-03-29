// Global styling utilities and helpers

function showLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.remove('hidden');
}

function hideLoading() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.classList.add('hidden');
}

function showToast(message, type = 'success') {
    let bgColor = "linear-gradient(to right, #00b09b, #96c93d)"; // success
    if (type === 'error') bgColor = "linear-gradient(to right, #ff5f6d, #ffc371)";
    if (type === 'warning') bgColor = "linear-gradient(to right, #f6d365, #fda085)";
    if (type === 'info') bgColor = "linear-gradient(to right, #2193b0, #6dd5ed)";

    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", 
        position: "right",
        style: {
            background: bgColor,
        }
    }).showToast();
}

// Modal handling
let currentConfirmAction = null;

function openModal(contentHtml) {
    const container = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');
    content.innerHTML = contentHtml;
    
    container.classList.remove('hidden');
    // slight delay for animation
    setTimeout(() => {
        container.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    }, 10);
    document.body.classList.add('modal-open');

    // Add close listener to backdrop
    container.onclick = (e) => {
        if(e.target === container) closeModal();
    }
}

function closeModal() {
    const container = document.getElementById('modal-container');
    const content = document.getElementById('modal-content');
    
    container.classList.add('opacity-0');
    content.classList.add('scale-95');
    
    setTimeout(() => {
        container.classList.add('hidden');
        content.innerHTML = '';
        document.body.classList.remove('modal-open');
    }, 300);
}

function confirmAction(title, message, callback) {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    
    currentConfirmAction = callback;
    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const confirmCancel = document.getElementById('confirm-cancel');
    const confirmOk = document.getElementById('confirm-ok');
    const confirmModal = document.getElementById('confirm-modal');

    if(confirmCancel && confirmOk) {
        confirmCancel.onclick = () => {
            confirmModal.classList.add('hidden');
            currentConfirmAction = null;
        };
        confirmOk.onclick = () => {
            confirmModal.classList.add('hidden');
            if(currentConfirmAction) {
                currentConfirmAction();
                currentConfirmAction = null;
            }
        };
    }

    // Global Search behavior
    const searchInput = document.getElementById('global-search');
    if(searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const q = searchInput.value.trim();
                if(q) {
                    window.location.href = `students.html?search=${encodeURIComponent(q)}`;
                }
            }
        });
    }
});

// Table builder utility
function createTable(headers, data, rowBuilder) {
    if(!data || data.length === 0) {
        return `<div class="text-center py-8 text-gray-500 italic">No data found.</div>`;
    }
    
    let html = `
        <div class="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg">
            <table class="data-table">
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.map(row => rowBuilder(row)).join('')}
                </tbody>
            </table>
        </div>
    `;
    return html;
}
