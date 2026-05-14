import { PASSWORD_HASH } from '../utils/constants.js';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function requestPassword() {
  return new Promise(async (resolve) => {
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('passwordInput');
    const confirm = document.getElementById('confirmPassword');
    const cancel = document.getElementById('cancelPassword');
    const error = document.getElementById('passwordError');

    function close(val) {
      modal.classList.add('hidden');
      resolve(val);
    }

    modal.classList.remove('hidden');
    input.value = '';
    input.focus();
    error.classList.add('hidden');

    confirm.onclick = async () => {
      const enteredHash = await sha256(input.value);
      if (enteredHash === PASSWORD_HASH) {
        // Проверка согласия
        if (localStorage.getItem('itop_consent') === 'true') {
          close(true);
        } else {
          // Показать окно согласия
          const consentModal = document.getElementById('legalConsentModal');
          const consentCheckbox = document.getElementById('consentCheckbox');
          const consentConfirm = document.getElementById('consentConfirm');
          consentCheckbox.checked = false;
          consentModal.classList.remove('hidden');
          consentConfirm.onclick = () => {
            if (consentCheckbox.checked) {
              localStorage.setItem('itop_consent', 'true');
              consentModal.classList.add('hidden');
              close(true);
            } else {
              alert('Необходимо подтвердить согласие');
            }
          };
          // отмена согласия – вернуться к паролю
          const consentCancel = document.getElementById('consentCancel');
          consentCancel.onclick = () => {
            consentModal.classList.add('hidden');
            close(false);
          };
        }
      } else {
        error.classList.remove('hidden');
        input.value = '';
        input.focus();
      }
    };

    cancel.onclick = () => close(false);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') confirm.onclick();
      if (e.key === 'Escape') close(false);
    };
  });
}