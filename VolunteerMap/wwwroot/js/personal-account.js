// =======================================================
// ЛОГИКА ЛИЧНОГО КАБИНЕТА (ЗАЯВКИ ПОЛЬЗОВАТЕЛЯ)
// =======================================================

const tabMyCentersBtn = document.getElementById('tab-my-centers-btn');
const tabMyEventsBtn = document.getElementById('tab-my-events-btn');
const myCentersAppsPanel = document.getElementById('my-centers-apps-panel');
const myEventsAppsPanel = document.getElementById('my-events-apps-panel');
const myCentersListContainer = document.getElementById('my-centers-list-container');
const myEventsListContainer = document.getElementById('my-events-list-container');

if (tabMyCentersBtn && tabMyEventsBtn) {
    tabMyCentersBtn.addEventListener('click', function () {
        tabMyEventsBtn.classList.remove('active');
        this.classList.add('active');
        myEventsAppsPanel.classList.remove('active');
        myCentersAppsPanel.classList.add('active');
        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (currentUser) loadUserApplications(currentUser.userId);
    });

    tabMyEventsBtn.addEventListener('click', function () {
        tabMyCentersBtn.classList.remove('active');
        this.classList.add('active');
        myCentersAppsPanel.classList.remove('active');
        myEventsAppsPanel.classList.add('active');
        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (currentUser) loadUserEventApplications(currentUser.userId);
    });
}

// Уведомления об изменении статуса
function checkStatusNotifications(apps, type) {
    const storageKey = type === 'center' ? 'notified_center_apps' : 'notified_event_apps';
    const notified = JSON.parse(localStorage.getItem(storageKey) || '{}');

    apps.forEach(app => {
        const appId = app.applicationId || app.eventApplicationId;
        const prevStatus = notified[appId];
        if (prevStatus && prevStatus !== app.status) {
            const name = app.name || app.title;
            const statusText = app.status === 'Approved' ? 'одобрена' : (app.status === 'Rejected' ? 'отклонена' : 'на рассмотрении');
            showCustomAlert(`Статус заявки "${name}" изменён на "${statusText}"`);
        }
        notified[appId] = app.status;
    });

    localStorage.setItem(storageKey, JSON.stringify(notified));
}

// Загрузка заявок пользователя на центры
function loadUserApplications(userId) {
    if (!myCentersListContainer) return;
    myCentersListContainer.innerHTML = '<p style="color:#aaa; text-align:center;">Загрузка ваших заявок на центры...</p>';

    fetch(`/api/applications/user/${userId}`)
        .then(res => res.json())
        .then(apps => {
            // Сохраняем заявки пользователя в глобальный массив для функции редактирования
            currentUserCenterApps = apps;

            checkStatusNotifications(apps, 'center');

            if (currentFilterStatus !== 'all') {
                apps = apps.filter(a => a.status === currentFilterStatus);
            }

            myCentersListContainer.innerHTML = '';

            if (apps.length === 0) {
                myCentersListContainer.innerHTML = '<p style="color:#666; text-align:center; padding: 20px;">У вас нет активных заявок на центры.</p>';
                return;
            }

            apps.forEach(app => {
                const item = document.createElement('div');
                item.style = "background:#222; border:1px solid #333; padding:20px; margin-bottom:15px; border-radius:6px;";
                const statusText = app.status === 'Pending' ? 'На рассмотрении' : (app.status === 'Approved' ? 'Одобрено' : 'Отклонено');
                const statusColor = app.status === 'Approved' ? '#2ecc71' : (app.status === 'Rejected' ? '#e74c3c' : '#f39c12');

                let buttonsHtml = '';
                if (app.status === 'Pending') {
                    buttonsHtml = `
                        <button onclick="cancelCenterApp(${app.applicationId})" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85em; margin-right:8px;">Отменить</button>
                        <button onclick="editCenterApp(${app.applicationId})" style="background:#f39c12; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85em;">Редактировать</button>
                    `;
                } else if (app.status === 'Approved') {
                    buttonsHtml = `
                        <button onclick="openCenterOnMap('${app.name.replace(/'/g, "\\'")}')" style="background:#2ecc71; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85em;">Открыть на карте</button>
                    `;
                }

                item.innerHTML = `
                        <h3 style="color:#e50914; margin-top:0;">${app.name}</h3>
                        <p style="font-size:0.9em; opacity:0.8;">${app.description || 'Без описания'}</p>
                        <p style="font-size:0.85em;">📍 <b>Адрес:</b> ${app.address}</p>
                        <p style="font-size:0.85em;">📞 <b>Контакты:</b> ${app.contacts}</p>
                        ${app.imageUrl ? `<p style="font-size:0.85em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🖼️ <b>Ссылка на фото:</b> <a href="${app.imageUrl}" target="_blank" style="color:#aaa;">${app.imageUrl}</a></p>` : ''}
                        <p style="font-size:0.85em;"><b>Статус:</b> <span style="color:${statusColor};">${statusText}</span></p>
                        <div style="margin-top:10px;">${buttonsHtml}</div>
                    `;
                myCentersListContainer.appendChild(item);
            });
        })
        .catch(err => {
            console.error("Ошибка загрузки заявок пользователя на центры:", err);
            myCentersListContainer.innerHTML = '<p style="color:#e74c3c;">Не удалось загрузить ваши заявки на центры.</p>';
        });
}

// Отмена заявки на центр
window.cancelCenterApp = async function (id) {
    const confirmed = await showCustomConfirm("Вы уверены, что хотите отменить эту заявку?");
    if (!confirmed) return;
    try {
        const res = await fetch(`/api/applications/cancel/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        await showCustomAlert(data.message);
        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (currentUser) loadUserApplications(currentUser.userId);
    } catch (err) {
        await showCustomAlert(err.message);
    }
};

// Функция открытия формы редактирования заявки пользователем
window.editCenterApp = function (appId) {
    // Ищем заявку в глобальном массиве
    const app = currentUserCenterApps.find(a => a.applicationId === appId);
    if (!app) {
        showCustomAlert("Ошибка: заявка не найдена.");
        return;
    }

    // Устанавливаем флаг, что редактируем из личного кабинета
    editingFromPersonalAccount = true;

    // Скрываем личный кабинет, чтобы форма редактирования была поверх
    const personalAccountModal = document.getElementById('personal-account-modal');
    if (personalAccountModal) hideCustomModal(personalAccountModal);

    const addModal = document.getElementById('add-center-modal');
    showCustomModal(addModal);

    addModal.querySelector('.modal-title').innerText = "Редактирование заявки";
    addModal.querySelector('.action-btn').innerText = "Сохранить изменения";

    document.getElementById('edit-app-id').value = app.applicationId;
    document.getElementById('edit-center-id').value = "";
    document.getElementById('app-name').value = app.name;
    document.getElementById('app-description').value = app.description || '';
    document.getElementById('app-address').value = app.address || '';
    document.getElementById('app-contacts').value = app.contacts || '';
    document.getElementById('app-image').value = app.imageUrl || '';

    if (appRegionSelect && appDistrictSelect) {
        loadRegionsToForm().then(() => {
            appRegionSelect.value = app.regionId;
            appDistrictSelect.innerHTML = '<option value="" disabled selected>Загрузка районов...</option>';
            appDistrictSelect.disabled = true;
            return fetch(`/api/map/districts/${app.regionId}`);
        })
        .then(res => res && res.json())
        .then(districts => {
            if (!districts) return;
            appDistrictSelect.innerHTML = '<option value="" disabled selected>Выберите район расположения</option>';
            districts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.districtId;
                opt.innerText = d.districtName;
                if (String(d.districtId) === String(app.districtId)) opt.selected = true;
                appDistrictSelect.appendChild(opt);
            });
            appDistrictSelect.disabled = false;
        })
        .catch(err => console.error(err));
    }
};

// Открыть центр на карте по названию
window.openCenterOnMap = function (name) {
    hideCustomModal(document.getElementById('personal-account-modal'));
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = name;
        searchInput.dispatchEvent(new Event('input'));
        setTimeout(() => {
            const results = document.querySelectorAll('.search-result-item');
            results.forEach(item => {
                if (item.querySelector('h4')?.innerText === name) {
                    item.click();
                }
            });
        }, 500);
    }
};

// Загрузка заявок пользователя на мероприятия
function loadUserEventApplications(userId) {
    if (!myEventsListContainer) return;
    myEventsListContainer.innerHTML = '<p style="color:#aaa; text-align:center;">Загрузка ваших заявок на мероприятия...</p>';

    fetch(`/api/events/user-applications/${userId}`)
        .then(res => res.json())
        .then(apps => {
            checkStatusNotifications(apps, 'event');

            if (currentFilterStatus !== 'all') {
                apps = apps.filter(a => a.status === currentFilterStatus);
            }

            myEventsListContainer.innerHTML = '';

            if (apps.length === 0) {
                myEventsListContainer.innerHTML = '<p style="color:#666; text-align:center; padding: 20px;">У вас нет активных заявок на мероприятия.</p>';
                return;
            }

            apps.forEach(app => {
                const item = document.createElement('div');
                item.style = "background:#222; border:1px solid #333; padding:20px; margin-bottom:15px; border-radius:6px;";

                const start = new Date(app.startDate).toLocaleString('ru-RU');
                const end = new Date(app.endDate).toLocaleString('ru-RU');
                const statusText = app.status === 'Pending' ? 'На рассмотрении' : (app.status === 'Approved' ? 'Одобрено' : 'Отклонено');
                const statusColor = app.status === 'Approved' ? '#2ecc71' : (app.status === 'Rejected' ? '#e74c3c' : '#f39c12');

                let buttonsHtml = '';
                if (app.status === 'Pending') {
                    buttonsHtml = `
                        <button onclick="cancelEventApp(${app.eventApplicationId})" style="background:#e74c3c; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85em;">Отменить</button>
                    `;
                }

                item.innerHTML = `
                        <h3 style="color:#e50914; margin-top:0;">${app.title}</h3>
                        <p style="font-size:0.9em; opacity:0.8;">${app.description}</p>
                        <p style="font-size:0.85em;">📅 <b>Сроки:</b> ${start} — ${end}</p>
                        <p style="font-size:0.85em;">📍 <b>Место сбора:</b> ${app.location || 'Не указано'}</p>
                        <p style="font-size:0.85em;">📞 <b>Контакты куратора:</b> ${app.coordinatorContacts || 'Не указаны'}</p>
                        ${app.imageUrl ? `<p style="font-size:0.85em;">🖼️ <b>Обложка:</b> <a href="${app.imageUrl}" target="_blank" style="color:#aaa; text-decoration:underline;">Просмотреть загруженный файл</a></p>` : ''}
                        <p style="font-size:0.85em;"><b>Статус:</b> <span style="color:${statusColor};">${statusText}</span></p>
                        <div style="margin-top:10px;">${buttonsHtml}</div>
                    `;
                myEventsListContainer.appendChild(item);
            });
        })
        .catch(err => {
            console.error("Ошибка при загрузке заявок пользователя на события:", err);
            myEventsListContainer.innerHTML = '<p style="color:#e74c3c;">Не удалось загрузить ваши заявки на мероприятия.</p>';
        });
}

// Отмена заявки на мероприятие
window.cancelEventApp = async function (id) {
    const confirmed = await showCustomConfirm("Вы уверены, что хотите отменить эту заявку?");
    if (!confirmed) return;
    try {
        const res = await fetch(`/api/events/cancel/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        await showCustomAlert(data.message);
        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (currentUser) loadUserEventApplications(currentUser.userId);
    } catch (err) {
        await showCustomAlert(err.message);
    }
};

// Обработчик смены пароля
const changePasswordBtn = document.getElementById('change-password-btn');
if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', async function () {
        const currentPassword = document.getElementById('change-current-password').value;
        const newPassword = document.getElementById('change-new-password').value;
        const confirmPassword = document.getElementById('change-confirm-password').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            await showCustomAlert("Заполните все поля для смены пароля.");
            return;
        }

        if (newPassword !== confirmPassword) {
            await showCustomAlert("Новый пароль и подтверждение не совпадают.");
            return;
        }

        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (!currentUser) {
            await showCustomAlert("Необходимо войти в систему.");
            return;
        }

        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.userId,
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            await showCustomAlert(data.message);
            document.getElementById('change-current-password').value = '';
            document.getElementById('change-new-password').value = '';
            document.getElementById('change-confirm-password').value = '';
        } catch (err) {
            await showCustomAlert(err.message);
        }
    });
}

// Фильтр статусов
const statusFilter = document.getElementById('status-filter');
if (statusFilter) {
    statusFilter.addEventListener('change', function () {
        currentFilterStatus = this.value;
        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (currentUser) {
            const myCentersPanel = document.getElementById('my-centers-apps-panel');
            const myEventsPanel = document.getElementById('my-events-apps-panel');
            if (myCentersPanel && myCentersPanel.classList.contains('active')) {
                loadUserApplications(currentUser.userId);
            } else {
                loadUserEventApplications(currentUser.userId);
            }
        }
    });
}

// Функция открытия личного кабинета
function openPersonalAccount() {
    const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
    if (!currentUser) {
        showCustomAlert("Необходимо войти в систему.");
        return;
    }

    const personalAccountModal = document.getElementById('personal-account-modal');
    if (!personalAccountModal) return;

    const accountEmail = document.getElementById('account-email');
    const accountRole = document.getElementById('account-role');
    if (accountEmail) accountEmail.innerText = currentUser.email;
    if (accountRole) accountRole.innerText = currentUser.role === 'Admin' ? 'Администратор' : 'Пользователь';

    loadUserApplications(currentUser.userId);
    loadUserEventApplications(currentUser.userId);

    showCustomModal(personalAccountModal);
}

// Обработчик закрытия личного кабинета
const closePersonalAccountBtn = document.getElementById('close-personal-account-btn');
if (closePersonalAccountBtn) {
    closePersonalAccountBtn.addEventListener('click', () => {
        const personalAccountModal = document.getElementById('personal-account-modal');
        if (personalAccountModal) hideCustomModal(personalAccountModal);
    });
}

// Логика переключения главных вкладок личного кабинета (Профиль / Безопасность)
const mainTabProfileBtn = document.getElementById('main-tab-profile-btn');
const mainTabSecurityBtn = document.getElementById('main-tab-security-btn');
const mainProfilePanel = document.getElementById('main-profile-panel');
const mainSecurityPanel = document.getElementById('main-security-panel');

if (mainTabProfileBtn && mainTabSecurityBtn) {
    mainTabProfileBtn.addEventListener('click', () => {
        mainTabProfileBtn.classList.add('active');
        mainTabSecurityBtn.classList.remove('active');
        mainProfilePanel.style.display = 'block';
        mainSecurityPanel.style.display = 'none';
    });

    mainTabSecurityBtn.addEventListener('click', () => {
        mainTabSecurityBtn.classList.add('active');
        mainTabProfileBtn.classList.remove('active');
        mainProfilePanel.style.display = 'none';
        mainSecurityPanel.style.display = 'block';
    });
}