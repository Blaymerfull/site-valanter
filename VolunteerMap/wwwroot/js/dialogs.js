// ==========================================
// КАСТОМНЫЕ ДИАЛОГИ (alert / confirm)
// ==========================================
const customAlertOverlay = document.getElementById('custom-alert-overlay');
const customAlertMessage = document.getElementById('custom-alert-message');
const customAlertOkBtn = document.getElementById('custom-alert-ok-btn');

const customConfirmOverlay = document.getElementById('custom-confirm-overlay');
const customConfirmMessage = document.getElementById('custom-confirm-message');
const customConfirmYesBtn = document.getElementById('custom-confirm-yes-btn');
const customConfirmNoBtn = document.getElementById('custom-confirm-no-btn');

function showCustomAlert(message) {
    return new Promise((resolve) => {
        customAlertMessage.textContent = message;
        customAlertOverlay.style.display = 'flex';
        setTimeout(() => customAlertOverlay.style.opacity = '1', 10);

        const handleOk = () => {
            customAlertOverlay.style.opacity = '0';
            setTimeout(() => {
                customAlertOverlay.style.display = 'none';
                customAlertOkBtn.removeEventListener('click', handleOk);
                resolve();
            }, 300);
        };

        customAlertOkBtn.addEventListener('click', handleOk);
    });
}

function showCustomConfirm(message) {
    return new Promise((resolve) => {
        customConfirmMessage.textContent = message;
        customConfirmOverlay.style.display = 'flex';
        setTimeout(() => customConfirmOverlay.style.opacity = '1', 10);

        const handleYes = () => {
            customConfirmOverlay.style.opacity = '0';
            setTimeout(() => {
                customConfirmOverlay.style.display = 'none';
                customConfirmYesBtn.removeEventListener('click', handleYes);
                customConfirmNoBtn.removeEventListener('click', handleNo);
                resolve(true);
            }, 300);
        };

        const handleNo = () => {
            customConfirmOverlay.style.opacity = '0';
            setTimeout(() => {
                customConfirmOverlay.style.display = 'none';
                customConfirmYesBtn.removeEventListener('click', handleYes);
                customConfirmNoBtn.removeEventListener('click', handleNo);
                resolve(false);
            }, 300);
        };

        customConfirmYesBtn.addEventListener('click', handleYes);
        customConfirmNoBtn.addEventListener('click', handleNo);
    });
}