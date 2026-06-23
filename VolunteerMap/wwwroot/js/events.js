// =======================================================
// ЛОГИКА МЕРОПРИЯТИЙ (Отображение, заявки, модерация)
// =======================================================

// Функция переключения вкладок "Текущие" и "Прошедшие" мероприятия
window.switchEventsTab = function (evt, tabId) {
    const tabPanels = document.querySelectorAll('.tab-panel-content');
    tabPanels.forEach(panel => panel.classList.remove('active'));

    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => link.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
};

// Загрузка и отрисовка мероприятий в карточке центра
function loadCenterEvents(centerId) {
    const currentList = document.getElementById('current-events-list');
    const pastList = document.getElementById('past-events-list');

    if (!currentList || !pastList) return;

    currentList.innerHTML = '<p style="color:#aaa; font-size:0.9em; padding:10px;">Загрузка активных наборов...</p>';
    pastList.innerHTML = '<p style="color:#aaa; font-size:0.9em; padding:10px;">Загрузка архива событий...</p>';

    fetch(`/api/events/center/${centerId}`)
        .then(res => res.json())
        .then(data => {
            currentList.innerHTML = '';
            pastList.innerHTML = '';

            if (data.current.length === 0) {
                currentList.innerHTML = '<p style="color:#666; font-size:0.9em; padding:10px;">В данный момент активных наборов нет.</p>';
            } else {
                data.current.forEach(ev => {
                    currentList.appendChild(createEventCardElement(ev));
                });
            }

            if (data.past.length === 0) {
                pastList.innerHTML = '<p style="color:#666; font-size:0.9em; padding:10px;">Архив прошедших событий пуст.</p>';
            } else {
                data.past.forEach(ev => {
                    pastList.appendChild(createEventCardElement(ev));
                });
            }
        })
        .catch(err => {
            console.error("Ошибка при получении мероприятий:", err);
            currentList.innerHTML = '<p style="color:#e74c3c; font-size:0.9em; padding:10px;">Ошибка загрузки</p>';
            pastList.innerHTML = '<p style="color:#e74c3c; font-size:0.9em; padding:10px;">Ошибка загрузки</p>';
        });
}

// Вспомогательная функция генерации HTML-элемента карточки события
function createEventCardElement(ev) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const start = new Date(ev.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const end = new Date(ev.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    card.innerHTML = `
        ${ev.imageUrl ? `<img src="${ev.imageUrl}" onerror="this.src='https://placehold.co'">` : '<div style="height:150px; background:#2a2a2a; display:flex; align-items:center; justify-content:center; color:#666; font-size:0.9em;">Нет обложки</div>'}
        <div class="event-card-info">
            <div class="event-card-date">📅 ${start} — ${end}</div>
            <h4 class="event-card-title">${ev.title}</h4>
            <div class="event-card-text">${ev.description || ''}</div>
            <p style="font-size:0.75em; color:#aaa; margin:0 0 5px 0;">📍 ${ev.location || 'Место не указано'}</p>
            <p style="font-size:0.75em; color:#888; margin:0;">👤 ${ev.coordinatorContacts || ''}</p>
        </div>
    `;
    card.style.cursor = 'pointer';
    card.onclick = (e) => {
        e.stopPropagation();
        openFullEventView(ev);
    };
    return card;
}

// =======================================================
// ЛОГИКА ОКНА ДЕТАЛЬНОГО ПРОСМОТРА МЕРОПРИЯТИЯ
// =======================================================
const eventViewModal = document.getElementById('event-view-modal');
const eventViewBody = document.getElementById('event-view-body');
const closeEventViewBtn = document.getElementById('close-event-view-btn');
const adminEventPanel = document.getElementById('admin-event-fixed-panel');

function openFullEventView(ev) {
    console.log("Открываем детальный просмотр мероприятия:", ev);

    if (!eventViewModal || !eventViewBody) return;

    const start = new Date(ev.startDate).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const end = new Date(ev.endDate).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    const centerModal = document.getElementById('modal-overlay');
    if (centerModal) centerModal.style.display = 'none';

    eventViewBody.innerHTML = `
        ${ev.imageUrl ? `<img src="${ev.imageUrl}" style="width:100%; height:350px; object-fit:cover;" onerror="this.style.display='none'">` : '<div style="height:200px; background:#222; display:flex; align-items:center; justify-content:center; color:#555;">Нет обложки мероприятия</div>'}
        <div class="event-view-info-block" style="padding-bottom: 120px;">
            <h1>${ev.title}</h1>
            <div class="event-view-desc">${ev.description || 'Описание задач отсутствует.'}</div>
            <div class="event-view-meta-grid">
                <p>📅 <b>Время проведения:</b> с ${start} до ${end}</p>
                <p>📍 <b>Место проведения / Сбор:</b> ${ev.location || 'Не указано'}</p>
                <p>📞 <b>Координатор события:</b> ${ev.coordinatorContacts || 'Контакты не указаны'}</p>
            </div>
        </div>
    `;

    const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));

    if (adminEventPanel) {
        adminEventPanel.style.display = 'flex';

        const editEvBtn = document.getElementById('admin-edit-event-btn');
        const deleteEvBtn = document.getElementById('admin-delete-event-btn');

        if (currentUser && currentUser.role === 'Admin') {
            if (editEvBtn) editEvBtn.style.display = 'block';
            if (deleteEvBtn) deleteEvBtn.style.display = 'block';

            deleteEvBtn.onclick = async () => {
                const confirmed = await showCustomConfirm(`Вы уверены, что хотите НАВСЕГДА удалить мероприятие "${ev.title}"?`);
                if (!confirmed) return;

                fetch(`/api/events/delete/${ev.eventId}`, { method: 'DELETE' })
                    .then(async res => {
                        const data = await res.json();
                        await showCustomAlert(data.message);
                        if (eventViewModal) hideCustomModal(eventViewModal);
                        // Перезагружаем мероприятия для текущего центра
                        const centerId = currentActiveCenter.centerId || currentActiveCenter.CenterId || currentActiveCenter.id;
                        if (centerId) loadCenterEvents(centerId);
                    })
                    .catch(async err => await showCustomAlert("Ошибка удаления"));
            };

            editEvBtn.onclick = () => {
                if (eventViewModal) hideCustomModal(eventViewModal);

                const evModal = document.getElementById('add-event-modal');
                showCustomModal(evModal);

                evModal.querySelector('.modal-title').innerText = "Редактирование мероприятия";
                evModal.querySelector('.action-btn').innerText = "Сохранить изменения";

                document.getElementById('edit-event-id').value = ev.eventId;

                document.getElementById('event-title').value = ev.title;
                document.getElementById('event-description').value = ev.description;
                document.getElementById('event-start').value = ev.startDate.substring(0, 16);
                document.getElementById('event-end').value = ev.endDate.substring(0, 16);
                document.getElementById('event-location').value = ev.location || '';
                document.getElementById('event-contacts').value = ev.coordinatorContacts || '';
            };

        } else {
            if (editEvBtn) editEvBtn.style.display = 'none';
            if (deleteEvBtn) deleteEvBtn.style.display = 'none';
        }
    }

    showCustomModal(eventViewModal);
    document.body.style.overflow = 'hidden';
}

if (closeEventViewBtn) {
    closeEventViewBtn.onclick = function () {
        if (eventViewModal) hideCustomModal(eventViewModal);
        if (adminEventPanel) adminEventPanel.style.display = 'none';

        const centerModal = document.getElementById('modal-overlay');
        if (centerModal) {
            centerModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    };
}

// =======================================================
// УПРАВЛЕНИЕ ОКНОМ ФОРМЫ "ПРЕДЛОЖИТЬ МЕРОПРИЯТИЕ"
// =======================================================
const addEventModalBtn = document.getElementById('add-event-modal-btn');
const addEventModal = document.getElementById('add-event-modal');
const closeEventModalBtn = document.getElementById('close-event-modal-btn');

function resetEventForm() {
    const editEvIdField = document.getElementById('edit-event-id');
    if (editEvIdField) editEvIdField.value = "";

    if (addEventModal) {
        const modalTitle = addEventModal.querySelector('.modal-title');
        if (modalTitle) modalTitle.innerText = "Предложить мероприятие";
        const submitBtn = addEventModal.querySelector('button[type="submit"]') || addEventModal.querySelector('.action-btn');
        if (submitBtn) submitBtn.innerText = "Отправить событие на модерацию";
    }

    if (eventForm) eventForm.reset();
}

if (addEventModalBtn) {
    addEventModalBtn.onclick = function () {
        resetEventForm();

        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (!currentUser) {
            showCustomAlert("Чтобы предложить мероприятие, необходимо войти в Личный кабинет!");
            return;
        }

        document.getElementById('modal-overlay').style.display = 'none';
        showCustomModal(addEventModal);
    };
}

if (closeEventModalBtn) {
    closeEventModalBtn.onclick = function () {
        resetEventForm();
        hideCustomModal(addEventModal);
        document.getElementById('modal-overlay').style.display = 'flex';
    };
}

// Обработка отправки формы мероприятия пользователем
const eventForm = document.getElementById('event-application-form');

if (eventForm) {
    eventForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (!currentUser || !currentActiveCenter) {
            showCustomAlert("Ошибка сессии. Перезайдите в систему.");
            return;
        }

        const centerId = currentActiveCenter.centerId || currentActiveCenter.CenterId || currentActiveCenter.id;

        const editEventIdField = document.getElementById('edit-event-id');
        const editEventId = editEventIdField ? editEventIdField.value : "";

        console.log("Отправка формы мероприятия. Текущий флаг editEventId =", editEventId);

        const formData = new FormData();
        formData.append('centerId', centerId);
        formData.append('userId', currentUser.userId);
        formData.append('title', document.getElementById('event-title').value);
        formData.append('description', document.getElementById('event-description').value);
        formData.append('startDate', document.getElementById('event-start').value);
        formData.append('endDate', document.getElementById('event-end').value);
        formData.append('location', document.getElementById('event-location').value);
        formData.append('coordinatorContacts', document.getElementById('event-contacts').value);

        const fileInput = document.getElementById('event-image-file');
        if (fileInput && fileInput.files.length > 0) {
            formData.append('imageFile', fileInput.files[0]);
        }

        let url = '/api/events/apply';
        let method = 'POST';

        if (editEventId && editEventId !== "") {
            console.log("Сработало условие: Прямое изменение утвержденного мероприятия в БД. ID =", editEventId);
            url = `/api/events/update/${editEventId}`;
            method = 'PUT';
            formData.append('eventId', editEventId);
        }

        fetch(url, {
            method: method,
            body: formData
        })
            .then(async response => {
                if (!response.ok) throw new Error('Не удалось обработать запрос к серверу.');
                return response.json();
            })
            .then(async data => {
                await showCustomAlert(data.message);
                eventForm.reset();

                if (document.getElementById('edit-event-id')) {
                    document.getElementById('edit-event-id').value = "";
                }

                hideCustomModal(document.getElementById('add-event-modal'));

                if (editEventId && editEventId !== "") {
                    console.log("Обновление списка мероприятий после редактирования...");
                    loadCenterEvents(centerId);
                } else {
                    const centerModal = document.getElementById('modal-overlay');
                    if (centerModal) centerModal.style.display = 'flex';
                    loadCenterEvents(centerId);
                }
            })
            .catch(async err => await showCustomAlert(err.message));
    });
}

// =======================================================
// ЛОГИКА МОДЕРАЦИИ МЕРОПРИЯТИЙ АДМИНИСТРАТОРОМ
// =======================================================

const tabCentersBtn = document.getElementById('tab-centers-btn');
const tabEventsBtn = document.getElementById('tab-events-btn');
const centersAppsPanel = document.getElementById('centers-apps-panel');
const eventsAppsPanel = document.getElementById('events-apps-panel');
const eventsAppsListContainer = document.getElementById('events-apps-list-container');

if (tabCentersBtn && tabEventsBtn) {
    tabCentersBtn.addEventListener('click', function () {
        tabEventsBtn.classList.remove('active');
        this.classList.add('active');
        eventsAppsPanel.classList.remove('active');
        centersAppsPanel.classList.add('active');
        loadPendingApplications();
    });

    tabEventsBtn.addEventListener('click', function () {
        tabCentersBtn.classList.remove('active');
        this.classList.add('active');
        centersAppsPanel.classList.remove('active');
        eventsAppsPanel.classList.add('active');
        loadPendingEventApplications();
    });
}

function loadPendingEventApplications() {
    if (!eventsAppsListContainer) return;
    eventsAppsListContainer.innerHTML = '<p style="color:#aaa; font-size:0.9em;">Загрузка списка мероприятий...</p>';

    fetch('/api/events/pending')
        .then(res => res.json())
        .then(apps => {
            eventsAppsListContainer.innerHTML = '';

            if (apps.length === 0) {
                eventsAppsListContainer.innerHTML = '<p style="color:#666; text-align:center; padding: 20px;">Новых заявок на мероприятия нет.</p>';
                return;
            }

            apps.forEach(app => {
                const item = document.createElement('div');
                item.style = "background:#222; border:1px solid #333; padding:20px; margin-bottom:15px; border-radius:6px;";

                const start = new Date(app.startDate).toLocaleString('ru-RU');
                const end = new Date(app.endDate).toLocaleString('ru-RU');

                item.innerHTML = `
                    <h3 style="color:#e50914; margin-top:0;">${app.title}</h3>
                    <p style="font-size:0.9em; opacity:0.8;">${app.description}</p>
                    <p style="font-size:0.85em;">📅 <b>Сроки:</b> ${start} — ${end}</p>
                    <p style="font-size:0.85em;">📍 <b>Место сбора:</b> ${app.location || 'Не указано'}</p>
                    <p style="font-size:0.85em;">📞 <b>Контакты куратора:</b> ${app.coordinatorContacts || 'Не указаны'}</p>
                    ${app.imageUrl ? `<p style="font-size:0.85em;">🖼️ <b>Обложка:</b> <a href="${app.imageUrl}" target="_blank" style="color:#aaa; text-decoration:underline;">Просмотреть загруженный файл</a></p>` : ''}
                    <div style="margin-top:15px; display:flex; gap:10px;">
                        <button onclick="moderateEvent(${app.eventApplicationId}, 'approve')" style="background:#2ecc71; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">Одобрить</button>
                        <button onclick="moderateEvent(${app.eventApplicationId}, 'reject')" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">Отклонить</button>
                    </div>
                `;
                eventsAppsListContainer.appendChild(item);
            });
        })
        .catch(err => {
            console.error("Ошибка при загрузке заявок на события:", err);
            eventsAppsListContainer.innerHTML = '<p style="color:#e74c3c;">Не удалось загрузить данные.</p>';
        });
}

window.moderateEvent = async function (id, action) {
    const actionText = action === 'approve' ? 'одобрить' : 'отклонить';
    const confirmed = await showCustomConfirm(`Вы уверены, что хотите ${actionText} это мероприятие?`);
    if (!confirmed) return;

    fetch(`/api/events/${action}/${id}`, { method: 'POST' })
        .then(async res => {
            if (!res.ok) throw new Error('Ошибка обработки на сервере.');
            const data = await res.json();
            await showCustomAlert(data.message);
            loadPendingEventApplications();
        })
        .catch(async err => await showCustomAlert(err.message));
};