async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    btn.disabled = true;
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p})
        });
        
        if (!response.ok) {
            hideLoading();
            btn.disabled = false;
            const err = await response.json();
            return showToast(err.error || "Login Failed", "error");
        }

        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('uni_user', JSON.stringify(data.user));
            showToast(`Welcome back, ${data.user.role}!`, 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (err) {
        hideLoading();
        btn.disabled = false;
        showToast("Network Error: Could not connect to API", "error");
    }
}
