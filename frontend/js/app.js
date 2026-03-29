document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const userStr = localStorage.getItem('uni_user');
    if (!userStr && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    const user = userStr ? JSON.parse(userStr) : null;
    if(user) {
        // Enforce RBAC on the sidebar
        const role = user.role;
        
        // Add User Profile Badge & Logout button to sidebar
        const nav = document.querySelector('nav ul');
        if(nav) {
            const logoutHtml = `
                <li class="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-4 border-t border-slate-800 pt-4">Account: ${user.username} (${role})</li>
                <li><a href="#" onclick="logout(); return false;" class="nav-item flex items-center px-6 py-3 hover:bg-red-900/50 text-red-400 hover:text-red-300 transition-colors"><i class="fa-solid fa-right-from-bracket w-6"></i> Logout</a></li>
            `;
            nav.insertAdjacentHTML('beforeend', logoutHtml);

            // Restrict views based on role
            if(role === 'College') {
                // College users cannot access specific global tools according to rules
                const restrictLinks = [
                    'colleges.html', // Can't manipulate global colleges, just view their own via simple list maybe
                ];
                
                document.querySelectorAll('nav a').forEach(a => {
                    const h = a.getAttribute('href');
                    if(restrictLinks.includes(h)) {
                        a.parentElement.style.display = 'none'; // Hide in sidebar
                    }
                });

                // Hard block if they try to access it via URL
                if(window.location.href.includes('colleges.html')) {
                    alert("Unauthorized Access. College admins cannot access the University College view.");
                    window.location.href = 'index.html';
                }
            }
        }
    }

    // Auto-set active nav link
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if(href && href !== '#') {
            if (path.includes(href) && href !== 'index.html') {
                document.querySelector('.nav-item.active')?.classList.remove('active', 'bg-slate-800');
                link.classList.add('active', 'bg-slate-800');
            } else if (path.endsWith('/') && href === 'index.html') {
                link.classList.add('active', 'bg-slate-800');
            }
        }
    });
});

window.logout = function() {
    localStorage.removeItem('uni_user');
    window.location.href = 'login.html';
}
