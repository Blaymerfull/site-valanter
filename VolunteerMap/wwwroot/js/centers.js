// ==========================================
// ЛОГИКА ЦЕНТРОВ (Заявки, модерация, регионы/районы)
// ==========================================

// Функция управления видимостью верхней панели (поиск, кнопки, личный кабинет)
function toggleAuthPanel(show) {
    const authPanel = document.querySelector('.auth-panel');
    if (!authPanel) return;

    if (show) {
        authPanel.style.display = 'flex';
        setTimeout(() => {
            authPanel.style.transition = 'opacity 0.5s ease';
            authPanel.style.opacity = '1';
            authPanel.style.pointerEvents = 'auto';
        }, 10);
    } else {
        authPanel.style.transition = 'opacity 0.4s ease';
        authPanel.style.opacity = '0';
        authPanel.style.pointerEvents = 'none';
        setTimeout(() => {
            if (authPanel.style.opacity === '0') {
                authPanel.style.display = 'none';
            }
        }, 400);
    }
}

function renderCenters(data) {
    const list = document.getElementById('centers-list');
    const centersView = document.getElementById('centers-view');
    centersView.style.display = 'block';
    centersView.style.opacity = '1';
    list.innerHTML = '';
    wrapper.classList.add('map-hidden');
    data.forEach((c, index) => {
        const card = document.createElement('div');
        card.className = 'center-card';
        card.innerHTML = `
                ${c.imageUrl ? `<img src="${c.imageUrl}" onerror="this.style.display='none'">` : '<div class="no-photo">Нет фото</div>'}
                <h2>${c.name}</h2>
                <div class="card-description">${c.description || ''}</div>
                <button class="more-btn" style="background:#e50914; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">Подробнее</button>
            `;
        card.onclick = () => openFullView(c);
        list.appendChild(card);
        setTimeout(() => card.classList.add('animate'), index * 100);
    });
}

function openFullView(center) {
    console.log("Открываем карточку (сырые данные):", center);
    currentActiveCenter = center;

    const modal = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');
    const closeBtn = document.getElementById('close-modal');
    const backBtnElem = document.getElementById('back-button');
    const adminPanel = document.getElementById('admin-fixed-panel');
    const editBtn = document.getElementById('admin-edit-center-btn');
    const deleteBtn = document.getElementById('admin-delete-center-btn');

    if (backBtnElem) {
        backBtnElem.style.opacity = '0';
        backBtnElem.style.pointerEvents = 'none';
    }

    if (closeBtn) {
        closeBtn.style.display = 'flex';
        setTimeout(() => closeBtn.style.opacity = '1', 10);
    }

    // Нормализация входящих данных
    const cId = center.centerId || center.CenterId || center.id;
    const cName = center.name || center.Name || "";
    const cDesc = center.description || center.Description || "Описание отсутствует";
    const cAddr = center.address || center.Address || "Адрес не указан";
    const cCont = center.contacts || center.Contacts || "Контакты не указаны";
    const cImg = center.imageUrl || center.ImageUrl || "";
    const dId = center.districtId || center.DistrictId || "";

    body.innerHTML = `
            ${cImg ? `<img src="${cImg}" style="width:100%; height:400px; object-fit:cover; border-radius: 15px 15px 0 0;" onerror="this.style.display='none'">` : ''}
            <div style="padding: 40px; background:#141414;">
                <h1 style="color:#e50914; margin-top:0;">${cName}</h1>
                <p style="font-size:1.1em; line-height:1.6; color: #fff;">${cDesc}</p>
                <div style="margin-top:30px; padding-top:20px; border-top:1px solid #333;">
                    <p>📍 ${cAddr}</p>
                    <p>📞 ${cCont}</p>
                </div>
            </div>
        `;

    // Показываем кнопку чата для авторизованных пользователей
    const chatBtn = document.getElementById('open-center-chat-btn');
    const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
    if (chatBtn) {
        if (currentUser) {
            chatBtn.style.display = 'block';
        } else {
            chatBtn.style.display = 'none';
        }
    }

    if (adminPanel) {
        adminPanel.style.display = 'flex';

        if (currentUser && currentUser.role === 'Admin') {
            if (editBtn) editBtn.style.display = 'block';
            if (deleteBtn) deleteBtn.style.display = 'block';

            if (deleteBtn) {
                deleteBtn.onclick = async () => {
                    if (!cId) {
                        await showCustomAlert("Ошибка: Не удалось определить ID центра для удаления.");
                        return;
                    }
                    const confirmed = await showCustomConfirm(`Вы уверены, что хотите НАВСЕГДА удалить центр "${cName}" из системы?`);
                    if (!confirmed) return;

                    fetch(`/api/map/delete-center/${cId}`, { method: 'DELETE' })
                        .then(async res => {
                            const data = await res.json();
                            await showCustomAlert(data.message);
                            // Закрываем карточку центра
                            document.getElementById('close-modal').click();
                            // Закрываем боковую панель центров, если открыта
                            const centersView = document.getElementById('centers-view');
                            if (centersView && centersView.style.display === 'block') {
                                const backBtnElem = document.getElementById('back-button');
                                centersView.style.display = 'none';
                                centersView.style.opacity = '0';
                                if (backBtnElem) backBtnElem.classList.add('visible');
                            }
                        })
                        .catch(async err => await showCustomAlert("Ошибка при удалении центра"));
                };
            }

            if (editBtn) {
                editBtn.onclick = async () => {
                    console.log("Админ нажал Изменить. Начинаем точечное заполнение формы...");

                    if (modal) { modal.style.opacity = '0'; modal.style.display = 'none'; }
                    if (closeBtn) closeBtn.style.display = 'none';
                    if (adminPanel) adminPanel.style.display = 'none';

                    const addModal = document.getElementById('add-center-modal');
                    if (!addModal) {
                        await showCustomAlert("Критическая ошибка: Элемент #add-center-modal не найден на странице!");
                        return;
                    }

                    showCustomModal(addModal);
                    document.body.style.overflow = 'hidden';

                    const modalTitle = addModal.querySelector('.modal-title');
                    if (modalTitle) modalTitle.innerText = "Редактирование волонтерского центра";

                    const submitBtn = addModal.querySelector('button[type="submit"]') || addModal.querySelector('.action-btn');
                    if (submitBtn) submitBtn.innerText = "Сохранить изменения";

                    if (document.getElementById('edit-center-id')) document.getElementById('edit-center-id').value = cId;
                    if (document.getElementById('edit-app-id')) document.getElementById('edit-app-id').value = "";

                    const inputName = document.getElementById('app-name');
                    const inputDesc = document.getElementById('app-description');
                    const inputAddr = document.getElementById('app-address');
                    const inputCont = document.getElementById('app-contacts');
                    const inputImg = document.getElementById('app-image');

                    if (inputName) { inputName.value = cName; console.log("Успех! Имя записано в поле:", cName); }
                    if (inputDesc) inputDesc.value = cDesc;
                    if (inputAddr) inputAddr.value = cAddr;
                    if (inputCont) inputCont.value = cCont;
                    if (inputImg) inputImg.value = cImg;

                    const modalRegionSelect = document.getElementById('app-region');
                    const modalDistrictSelect = document.getElementById('app-district');

                    if (modalRegionSelect && modalDistrictSelect) {
                        loadRegionsToForm().then(() => {
                            const rId = currentActiveCenter.regionId || currentActiveCenter.RegionId;

                            if (rId) {
                                modalRegionSelect.value = rId;
                                modalDistrictSelect.innerHTML = '<option value="" disabled selected>Загрузка районов...</option>';
                                modalDistrictSelect.disabled = true;

                                return fetch(`/api/map/districts/${rId}`);
                            } else {
                                modalRegionSelect.value = "";
                                modalDistrictSelect.innerHTML = '<option value="" disabled selected>Заново выберите регион для смены района</option>';
                                modalDistrictSelect.disabled = true;
                                return null;
                            }
                        })
                            .then(res => {
                                if (!res) return;
                                return res.json();
                            })
                            .then(districts => {
                                if (!districts) return;
                                modalDistrictSelect.innerHTML = '<option value="" disabled selected>Выберите район расположения</option>';

                                districts.forEach(d => {
                                    const opt = document.createElement('option');
                                    opt.value = d.districtId;
                                    opt.innerText = d.districtName;
                                    if (String(d.districtId) === String(dId)) {
                                        opt.selected = true;
                                    }
                                    modalDistrictSelect.appendChild(opt);
                                });
                                modalDistrictSelect.disabled = false;
                            })
                            .catch(err => {
                                console.error("Ошибка автоподгрузки списков регионов/районов:", err);
                                modalDistrictSelect.innerHTML = '<option value="" disabled selected>Ошибка загрузки</option>';
                            });
                    }
                };
            }
        } else {
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        modal.style.opacity = '1';
    }, 10);
    loadCenterEvents(cId);
}

// Обработчик закрытия карточки центра
document.getElementById('close-modal').onclick = function () {
    const modal = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('close-modal');
    const backBtnElem = document.getElementById('back-button');
    const adminPanel = document.getElementById('admin-fixed-panel');

    if (modal) modal.style.opacity = '0';
    if (adminPanel) adminPanel.style.display = 'none';

    setTimeout(() => {
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        if (backBtnElem) {
            backBtnElem.style.opacity = '1';
            backBtnElem.style.display = 'block';
            backBtnElem.style.pointerEvents = 'auto';
        }
    }, 400);
};

// ==========================================
// ЛОГИКА ФОРМЫ ДОБАВЛЕНИЯ ЦЕНТРА
// ==========================================

// 1. Функция загрузки ВСЕХ регионов при открытии модального окна
function loadRegionsToForm() {
    if (!appRegionSelect) return Promise.resolve();

    if (appRegionSelect.children.length > 1) return Promise.resolve();

    return fetch('/api/map/regions')
        .then(res => res.json())
        .then(regions => {
            regions.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.regionId;
                opt.innerText = r.fullName;
                appRegionSelect.appendChild(opt);
            });
        })
        .catch(err => console.error("Ошибка загрузки регионов:", err));
}

// 2. Обработчик выбора региона — подгружает соответствующие районы
if (appRegionSelect) {
    appRegionSelect.addEventListener('change', function () {
        const selectedRegionId = this.value;
        appDistrictSelect.innerHTML = '<option value="" disabled selected>Загрузка районов...</option>';
        appDistrictSelect.disabled = true;

        fetch(`/api/map/districts/${selectedRegionId}`)
            .then(res => res.json())
            .then(districts => {
                appDistrictSelect.innerHTML = '<option value="" disabled selected>Выберите район расположения</option>';

                if (districts.length === 0) {
                    appDistrictSelect.innerHTML = '<option value="" disabled selected>В этом регионе нет районов</option>';
                    return;
                }

                districts.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.districtId;
                    opt.innerText = d.districtName;
                    appDistrictSelect.appendChild(opt);
                });

                appDistrictSelect.disabled = false;
            })
            .catch(err => {
                console.error("Ошибка загрузки районов:", err);
                appDistrictSelect.innerHTML = '<option value="" disabled selected>Ошибка загрузки</option>';
            });
    });
}

// 3. Обработчик кнопки "Добавить центр"
if (addCenterBtn) {
    addCenterBtn.onclick = function () {
        console.log("Пользователь нажал 'Добавить центр' (Первый клик). Инициализируем форму...");

        const addCenterModal = document.getElementById('add-center-modal');
        if (!addCenterModal) {
            showCustomAlert("Ошибка: Элемент #add-center-modal не найден на странице!");
            return;
        }

        showCustomModal(addCenterModal);

        if (appForm) appForm.reset();

        const editAppField = document.getElementById('edit-app-id');
        const editCenterField = document.getElementById('edit-center-id');
        if (editAppField) editAppField.value = "";
        if (editCenterField) editCenterField.value = "";

        const modalTitle = addCenterModal.querySelector('.modal-title');
        if (modalTitle) modalTitle.innerText = "Подать заявку на создание центра";

        const submitBtn = addCenterModal.querySelector('button[type="submit"]') || addCenterModal.querySelector('.action-btn');
        if (submitBtn) submitBtn.innerText = "Отправить на модерацию";

        const appRegionSelect = document.getElementById('app-region');
        const appDistrictSelect = document.getElementById('app-district');

        if (appRegionSelect) appRegionSelect.value = "";
        if (appDistrictSelect) {
            appDistrictSelect.innerHTML = '<option value="" disabled selected>Сначала выберите регион</option>';
            appDistrictSelect.disabled = true;
        }

        loadRegionsToForm();
    };
}

// 4. Обработчик закрытия формы
if (closeAddModalBtn) {
    closeAddModalBtn.onclick = function () {
        console.log("Клик по крестику отмены формы. Анализируем состояние экрана...");

        const addCenterModal = document.getElementById('add-center-modal');
        if (addCenterModal) {
            const editAppField = document.getElementById('edit-app-id');
            const editCenterField = document.getElementById('edit-center-id');
            if (editAppField) editAppField.value = "";
            if (editCenterField) editCenterField.value = "";

            const modalTitle = addCenterModal.querySelector('.modal-title');
            if (modalTitle) modalTitle.innerText = "Подать заявку на создание центра";
            const submitBtn = addCenterModal.querySelector('button[type="submit"]') || addCenterModal.querySelector('.action-btn');
            if (submitBtn) submitBtn.innerText = "Отправить на модерацию";

            const appRegionSelect = document.getElementById('app-region');
            const appDistrictSelect = document.getElementById('app-district');
            if (appRegionSelect) appRegionSelect.value = "";
            if (appDistrictSelect) {
                appDistrictSelect.innerHTML = '<option value="" disabled selected>Сначала выберите регион</option>';
                appDistrictSelect.disabled = true;
            }

            if (appForm) appForm.reset();

            hideCustomModal(addCenterModal);
        }

        const editCenterIdField = document.getElementById('edit-center-id');
        const editCenterId = editCenterIdField ? editCenterIdField.value : "";
        const backBtnElem = document.getElementById('back-button');

        const centersView = document.getElementById('centers-view');
        const isCardsListOpen = centersView && (centersView.style.display === 'block' || centersView.style.opacity === '1');

        if (editCenterId && editCenterId !== "") {
            if (isCardsListOpen) {
                console.log("Админ отменил редактирование внутри списка карточек. Возвращаем кнопку 'Назад к карте'...");
                if (backBtnElem) {
                    backBtnElem.style.display = 'block';
                    setTimeout(() => {
                        backBtnElem.style.opacity = '1';
                        backBtnElem.style.pointerEvents = 'auto';
                        backBtnElem.classList.add('visible');
                    }, 50);
                }
            } else {
                console.log("Админ отменил редактирование на карте России. Кнопка 'Назад к карте' не требуется.");
                if (backBtnElem) {
                    backBtnElem.style.display = 'none';
                    backBtnElem.style.opacity = '0';
                    backBtnElem.style.pointerEvents = 'none';
                    backBtnElem.classList.remove('visible');
                }
            }
        }
    };
}

// ==========================================
// ОТПРАВКА ФОРМЫ И МОДЕРАЦИЯ ЗАЯВОК (API)
// ==========================================

// Открытие и закрытие окна модерации для админа
if (viewAppsBtn) {
    viewAppsBtn.addEventListener('click', () => {
        showCustomModal(viewAppsModal);
        loadPendingApplications();
    });
}
if (closeAppsModalBtn) {
    closeAppsModalBtn.addEventListener('click', () => hideCustomModal(viewAppsModal));
}

// А. Пользователь отправляет форму в БД
if (appForm) {
    appForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
        if (!currentUser) {
            showCustomAlert("Ошибка сессии. Перезайдите в аккаунт.");
            return;
        }

        const editAppId = document.getElementById('edit-app-id') ? document.getElementById('edit-app-id').value : "";
        const editCenterId = document.getElementById('edit-center-id') ? document.getElementById('edit-center-id').value : "";

        console.log("Отправка формы. Текущие флаги режима: editAppId =", editAppId, "| editCenterId =", editCenterId);

        const inputDistrict = document.getElementById('app-district');
        const inputName = document.getElementById('app-name');
        const inputDesc = document.getElementById('app-description');
        const inputAddr = document.getElementById('app-address');
        const inputCont = document.getElementById('app-contacts');
        const inputImg = document.getElementById('app-image');

        const appData = {
            districtId: inputDistrict ? inputDistrict.value : "",
            name: inputName ? inputName.value : "",
            description: inputDesc ? inputDesc.value : "",
            address: inputAddr ? inputAddr.value : "",
            contacts: inputCont ? inputCont.value : "",
            imageUrl: inputImg ? inputImg.value : ""
        };

        let url = '/api/applications';
        let method = 'POST';

        if (editCenterId && editCenterId !== "") {
            console.log("Сработало условие: Прямое обновление центра в БД. ID =", editCenterId);
            url = `/api/map/update-center/${editCenterId}`;
            method = 'PUT';
            appData.centerId = parseInt(editCenterId);
        }
        else if (editAppId && editAppId !== "") {
            console.log("Сработало условие: Редактирование черновика заявки. ID =", editAppId);
            url = `/api/applications/update/${editAppId}`;
            method = 'PUT';
        }
        else {
            console.log("Сработало условие: Создание новой заявки пользователем.");
            appData.userId = currentUser.userId;
        }

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        })
            .then(async response => {
                if (!response.ok) throw new Error('Не удалось обработать запрос к серверу.');
                return response.json();
            })
            .then(async data => {
                await showCustomAlert(data.message);
                appForm.reset();

                if (document.getElementById('edit-app-id')) document.getElementById('edit-app-id').value = "";
                if (document.getElementById('edit-center-id')) document.getElementById('edit-center-id').value = "";
                if (document.getElementById('app-region')) document.getElementById('app-region').value = "";
                if (document.getElementById('app-district')) {
                    document.getElementById('app-district').innerHTML = '<option value="" disabled selected>Сначала выберите регион</option>';
                    document.getElementById('app-district').disabled = true;
                }

                hideCustomModal(document.getElementById('add-center-modal'));

                if (editCenterId) {
                    // Обновляем данные центра без перезагрузки страницы
                    // Используем данные из формы, которые только что отправили
                    const updatedCenter = Object.assign({}, currentActiveCenter, {
                        name: appData.name,
                        description: appData.description,
                        address: appData.address,
                        contacts: appData.contacts,
                        imageUrl: appData.imageUrl,
                        districtId: appData.districtId
                    });
                    currentActiveCenter = updatedCenter;
                    // Открываем карточку с обновленными данными
                    setTimeout(() => openFullView(updatedCenter), 500);
                }
                else if (editAppId) {
                    // Если редактировали из личного кабинета — возвращаемся в личный кабинет
                    if (editingFromPersonalAccount) {
                        editingFromPersonalAccount = false;
                        const personalAccountModal = document.getElementById('personal-account-modal');
                        if (personalAccountModal) {
                            const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
                            if (currentUser) {
                                loadUserApplications(currentUser.userId);
                                loadUserEventApplications(currentUser.userId);
                            }
                            showCustomModal(personalAccountModal);
                        }
                    } else {
                        showCustomModal(document.getElementById('view-apps-modal'));
                        loadPendingApplications();
                    }
                }
            })
            .catch(async err => await showCustomAlert(err.message));
    });
}

// Б. Админ загружает список ожидающих заявок
function loadPendingApplications() {
    if (!appsListContainer) return;
    appsListContainer.innerHTML = '<p style="color:#aaa;">Загрузка списка заявок...</p>';

    fetch('/api/applications/pending')
        .then(res => res.json())
        .then(apps => {
            appsListContainer.innerHTML = '';

            if (apps.length === 0) {
                appsListContainer.innerHTML = '<p style="color:#aaa; text-align:center;">Новых заявок на модерацию нет.</p>';
                return;
            }

            currentUserCenterApps = apps;

            apps.forEach(app => {
                const item = document.createElement('div');
                item.style = "background:#222; border:1px solid #333; padding:20px; margin-bottom:15px; border-radius:6px;";
                item.innerHTML = `
                        <h3 style="color:#e50914; margin-top:0;">${app.name}</h3>
                        <p style="font-size:0.9em; opacity:0.8;">${app.description || 'Без описания'}</p>
                        <p style="font-size:0.85em;">📍 <b>Адрес:</b> ${app.address}</p>
                        <p style="font-size:0.85em;">📞 <b>Контакты:</b> ${app.contacts}</p>
                        ${app.imageUrl ? `<p style="font-size:0.85em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">🖼️ <b>Ссылка на фото:</b> <a href="${app.imageUrl}" target="_blank" style="color:#aaa;">${app.imageUrl}</a></p>` : ''}
                        <div style="margin-top:15px; display:flex; gap:10px;">
                            <button onclick="moderateApp(${app.applicationId}, 'approve')" style="background:#2ecc71; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">Одобрить</button>
                            <button onclick="moderateApp(${app.applicationId}, 'reject')" style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">Отклонить</button>
                            <button onclick="openEditAppForm(${app.applicationId})" style="background:#f39c12; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; font-weight:bold;">Изменить</button>
                        </div>
                    `;
                appsListContainer.appendChild(item);
            });
        })
        .catch(err => console.error("Ошибка загрузки заявок:", err));
}

// В. Функция одобрения / отклонения
window.moderateApp = async function (id, action) {
    const confirmed = await showCustomConfirm(`Вы уверены, что хотите ${action === 'approve' ? 'одобрить' : 'отклонить'} эту заявку?`);
    if (!confirmed) return;

    fetch(`/api/applications/${action}/${id}`, { method: 'POST' })
        .then(async res => {
            const data = await res.json();
            await showCustomAlert(data.message);
            loadPendingApplications();
        })
        .catch(async err => await showCustomAlert("Ошибка при обработке действия."));
};

// Функция открытия формы для редактирования заявки админом
window.openEditAppForm = function (appId) {
    // Ищем заявку в глобальном массиве currentUserCenterApps
    const app = currentUserCenterApps.find(a => a.applicationId === appId);
    if (!app) {
        showCustomAlert("Ошибка: заявка не найдена.");
        return;
    }

    hideCustomModal(document.getElementById('view-apps-modal'));
    const addModal = document.getElementById('add-center-modal');
    showCustomModal(addModal);

    addModal.querySelector('.modal-title').innerText = "Редактирование заявки администратором";
    addModal.querySelector('.action-btn').innerText = "Сохранить изменения";

    document.getElementById('edit-app-id').value = app.applicationId;
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
            .then(res => {
                if (!res) return;
                return res.json();
            })
            .then(districts => {
                if (!districts) return;

                appDistrictSelect.innerHTML = '<option value="" disabled selected>Выберите район расположения</option>';

                districts.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.districtId;
                    opt.innerText = d.districtName;

                    if (String(d.districtId) === String(app.districtId)) {
                        opt.selected = true;
                    }
                    appDistrictSelect.appendChild(opt);
                });

                appDistrictSelect.disabled = false;
            })
            .catch(err => {
                console.error("Ошибка автоподгрузки районов:", err);
                appDistrictSelect.innerHTML = '<option value="" disabled selected>Ошибка загрузки</option>';
            });
    }
};
