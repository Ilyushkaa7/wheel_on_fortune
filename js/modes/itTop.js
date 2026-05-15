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
    const checkbox = document.getElementById('consentCheckboxIT');

    function close(val) {
      modal.classList.add('hidden');
      resolve(val);
    }

    modal.classList.remove('hidden');
    input.value = '';
    input.focus();
    error.classList.add('hidden');
    checkbox.checked = false;

    confirm.onclick = async () => {
      if (!checkbox.checked) return;

      const enteredHash = await sha256(input.value);
      if (enteredHash === PASSWORD_HASH) {
        close(true);
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

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close(false);
    });
  });
}