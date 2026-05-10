const PASSWORD = 'ittop2026';

export function requestPassword() {
  return new Promise(resolve => {
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

    confirm.onclick = () => {
      if (input.value === PASSWORD) close(true);
      else {
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