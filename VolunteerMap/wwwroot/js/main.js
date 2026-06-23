// ==========================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И ТОЧКА ВХОДА
// ==========================================

const wrapper = document.getElementById('map-wrapper');
const tooltip = document.getElementById('tooltip');
const backBtn = document.getElementById('back-button');
const titleDisplay = document.getElementById('region-title-display');
const regionalContainer = document.getElementById('regional-map-container');

// Элементы управления авторизацией и заявками
const accountBtn = document.getElementById('account-btn');
const authModal = document.getElementById('auth-modal');
const closeAuthBtn = document.getElementById('close-auth-btn');

const addCenterBtn = document.getElementById('add-center-btn');
const addCenterModal = document.getElementById('add-center-modal');
const closeAddModalBtn = document.getElementById('close-add-modal-btn');

const logoutBtn = document.getElementById('logout-btn');
const userEmailDisplay = document.getElementById('user-email-display');

// Переключение Вход/Регистрация
const toRegisterBtn = document.getElementById('to-register-btn');
const toLoginBtn = document.getElementById('to-login-btn');
const loginBlock = document.getElementById('login-form-block');
const registerBlock = document.getElementById('register-form-block');

// Поиск
const searchInput = document.getElementById('search-input');
const searchFilter = document.getElementById('search-filter');
const searchResults = document.getElementById('search-results');

// Формы
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const appRegionSelect = document.getElementById('app-region');
const appDistrictSelect = document.getElementById('app-district');
const appForm = document.getElementById('center-application-form');
const viewAppsBtn = document.getElementById('view-apps-btn');
const viewAppsModal = document.getElementById('view-apps-modal');
const closeAppsModalBtn = document.getElementById('close-apps-modal-btn');
const appsListContainer = document.getElementById('apps-list-container');

// Глобальная переменная для хранения текущего открытого центра
let currentActiveCenter = null;

// Глобальная переменная для хранения заявок пользователя на центры
let currentUserCenterApps = [];

// Фильтр статусов
let currentFilterStatus = 'all';

// Флаг: открыта ли форма редактирования из личного кабинета
let editingFromPersonalAccount = false;

// Массив центров, отображаемых в боковой панели (для обновления после редактирования)
let currentDisplayedCenters = [];

// Название текущего района/области, отображаемое в заголовке списка центров
let currentDistrictName = '';

// ==========================================
// ФУНКЦИИ УПРАВЛЕНИЯ МОДАЛЬНЫМИ ОКНАМИ
// ==========================================
function showCustomModal(modal) {
    modal.style.display = 'flex';
    setTimeout(() => modal.style.opacity = '1', 10);
}

function hideCustomModal(modal) {
    modal.style.opacity = '0';
    setTimeout(() => modal.style.display = 'none', 400);
}