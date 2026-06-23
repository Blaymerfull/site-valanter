// ==========================================
// ЛОГИКА ЧАТА ВОЛОНТЕРСКОГО ЦЕНТРА (SignalR)
// ==========================================

let chatConnection = null;
let currentChatCenterId = null;

const chatModal = document.getElementById('center-chat-modal');
const chatCloseBtn = document.getElementById('close-chat-btn');
const chatMessagesContainer = document.getElementById('chat-messages-container');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const openChatBtn = document.getElementById('open-center-chat-btn');

function initChatConnection() {
    if (chatConnection && chatConnection.state === 'Connected') {
        return Promise.resolve();
    }

    const currentUserForChat = JSON.parse(localStorage.getItem('volunteer_user'));
    const emailParam = currentUserForChat ? encodeURIComponent(currentUserForChat.email) : 'unknown';

    chatConnection = new signalR.HubConnectionBuilder()
        .withUrl("/chatHub?email=" + emailParam)
        .withAutomaticReconnect()
        .build();

    chatConnection.on("ReceiveMessage", function (message) {
        addChatMessage(message.userEmail, message.messageText, message.time);
    });

    chatConnection.onreconnecting(() => {
        console.log("Чат: переподключение к серверу...");
    });

    chatConnection.onreconnected(() => {
        console.log("Чат: переподключено!");
        if (currentChatCenterId) {
            chatConnection.invoke("JoinCenterChat", currentChatCenterId.toString())
                .catch(err => console.error("Ошибка повторного входа в комнату:", err));
        }
    });

    return chatConnection.start()
        .then(() => console.log("Чат: соединение установлено"))
        .catch(err => console.error("Ошибка подключения к чату:", err));
}

function addChatMessage(email, text, time) {
    const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
    const isOwn = currentUser && currentUser.email === email;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message' + (isOwn ? ' own' : ' other');

    msgDiv.innerHTML = `
        <span class="msg-email">${isOwn ? 'Вы' : email}</span>
        ${text}
        <span class="msg-time">${time}</span>
    `;

    chatMessagesContainer.appendChild(msgDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

function loadChatHistory(centerId) {
    chatMessagesContainer.innerHTML = '<div class="chat-empty">Загрузка истории сообщений...</div>';

    fetch(`/api/chat/history/${centerId}`)
        .then(res => res.json())
        .then(messages => {
            chatMessagesContainer.innerHTML = '';

            if (messages.length === 0) {
                chatMessagesContainer.innerHTML = '<div class="chat-empty">История сообщений пуста. Напишите первое сообщение!</div>';
                return;
            }

            messages.forEach(msg => {
                addChatMessage(msg.userEmail, msg.messageText, msg.time);
            });
        })
        .catch(err => {
            console.error("Ошибка загрузки истории чата:", err);
            chatMessagesContainer.innerHTML = '<div class="chat-empty">Не удалось загрузить историю сообщений.</div>';
        });
}

function openCenterChat() {
    const currentUser = JSON.parse(localStorage.getItem('volunteer_user'));
    if (!currentUser) {
        showCustomAlert("Чтобы использовать чат, необходимо войти в систему.");
        return;
    }

    if (!currentActiveCenter) {
        showCustomAlert("Ошибка: центр не выбран.");
        return;
    }

    const centerId = currentActiveCenter.centerId || currentActiveCenter.CenterId || currentActiveCenter.id;
    if (!centerId) {
        showCustomAlert("Ошибка: не удалось определить ID центра.");
        return;
    }

    currentChatCenterId = centerId;

    showCustomModal(chatModal);
    loadChatHistory(centerId);

    initChatConnection().then(() => {
        if (chatConnection && chatConnection.state === 'Connected') {
            chatConnection.invoke("JoinCenterChat", centerId.toString())
                .catch(err => console.error("Ошибка входа в комнату чата:", err));
        }
    });
}

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!currentChatCenterId) {
        showCustomAlert("Ошибка: чат не инициализирован.");
        return;
    }

    if (!chatConnection || chatConnection.state !== 'Connected') {
        showCustomAlert("Ошибка: нет соединения с сервером. Попробуйте переоткрыть чат.");
        return;
    }

    chatSendBtn.disabled = true;
    chatSendBtn.textContent = 'Отправка...';

    chatConnection.invoke("SendMessageToCenter", currentChatCenterId.toString(), text)
        .then(() => {
            chatInput.value = '';
            chatInput.focus();
        })
        .catch(err => {
            console.error("Ошибка отправки сообщения:", err);
            showCustomAlert("Не удалось отправить сообщение. Проверьте соединение.");
        })
        .finally(() => {
            chatSendBtn.disabled = false;
            chatSendBtn.textContent = 'Отправить';
        });
}

if (openChatBtn) {
    openChatBtn.addEventListener('click', openCenterChat);
}

if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', function () {
        hideCustomModal(chatModal);
    });
}

if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendChatMessage);
}

if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendChatMessage();
        }
    });
}

if (chatModal) {
    chatModal.addEventListener('click', function (e) {
        if (e.target === chatModal) {
            hideCustomModal(chatModal);
        }
    });
}