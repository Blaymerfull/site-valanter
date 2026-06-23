// ==========================================
// ЛОГИКА АВТОРИЗАЦИИ И СЕССИИ
// ==========================================

// Функция, которая настраивает кнопки на сайте в зависимости от того, вошел ли пользователь
function checkUserAuth() {
    const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
    const viewAppsBtn = document.getElementById('view-apps-btn');

    if (currentUser) {
        if (accountBtn) accountBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (userEmailDisplay) {
            userEmailDisplay.innerText = currentUser.email;
            userEmailDisplay.style.display = 'block';
        }
        if (addCenterBtn) addCenterBtn.style.display = 'block';

        if (currentUser.role === 'Admin' && viewAppsBtn) {
            viewAppsBtn.style.display = 'block';
        } else if (viewAppsBtn) {
            viewAppsBtn.style.display = 'none';
        }
    } else {
        if (accountBtn) accountBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userEmailDisplay) {
            userEmailDisplay.innerText = '';
            userEmailDisplay.style.display = 'none';
        }
        if (addCenterBtn) addCenterBtn.style.display = 'none';
        if (viewAppsBtn) viewAppsBtn.style.display = 'none';
    }
}

// Запускаем проверку авторизации сразу при загрузке страницы
checkUserAuth();

// Обработка РЕГИСТРАЦИИ
if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            showCustomAlert("Пароли не совпадают!");
            return;
        }

        fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Ошибка регистрации');
                return data;
            })
            .then(async data => {
                await showCustomAlert(data.message);
                if (toLoginBtn) toLoginBtn.click();
            })
            .catch(async err => await showCustomAlert(err.message));
    });
}

// Обработка ВХОДА
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Неверный логин или пароль');
                return data;
            })
            .then(async data => {
                await showCustomAlert(data.message);
                localStorage.setItem('volunteer_user', JSON.stringify({
                    email: data.email,
                    role: data.role,
                    userId: data.userId
                }));

                hideCustomModal(authModal);
                checkUserAuth();
            })
            .catch(async err => await showCustomAlert(err.message));
    });
}

// Обработка ВЫХОДА из аккаунта
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('volunteer_user');
        checkUserAuth();
        location.reload();
    });
}

// Обработчик кнопки "Личный кабинет"
accountBtn.addEventListener('click', function() {
    const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
    if (currentUser) {
        openPersonalAccount();
    } else {
        showCustomModal(authModal);
    }
});

closeAuthBtn.addEventListener('click', () => hideCustomModal(authModal));

// Переключение Вход/Регистрация
toRegisterBtn.addEventListener('click', () => {
    loginBlock.style.display = 'none';
    registerBlock.style.display = 'block';
});

toLoginBtn.addEventListener('click', () => {
    registerBlock.style.display = 'none';
    loginBlock.style.display = 'block';
});