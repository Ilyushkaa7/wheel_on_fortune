const hourglass =
    document.getElementById('hourglass');

const timerDisplay =
    document.getElementById('timerDisplay');

const startBtn =
    document.getElementById('startBtn');

const resetBtn =
    document.getElementById('resetBtn');

const autoFlipToggle =
    document.getElementById('autoFlipToggle');

const timeButtons =
    document.querySelectorAll(
        '.time-buttons button'
    );

let totalTime = 60;

let remainingTime = 60;

let intervalId = null;

let isRunning = false;

/* ========================= */

function updateTimerDisplay() {

    const mins =
        Math.floor(remainingTime / 60);

    const secs =
        remainingTime % 60;

    timerDisplay.textContent =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/* ========================= */

function setDuration() {

    hourglass.style.setProperty(
        '--duration',
        totalTime + 's'
    );
}

/* ========================= */

function setState(state) {

    hourglass.classList.remove(
        'idle',
        'running',
        'done'
    );

    hourglass.classList.add(state);
}

/* ========================= */

function startTimer() {

    if (isRunning) return;

    isRunning = true;

    startBtn.disabled = true;

    setDuration();

    setState('running');

    intervalId = setInterval(() => {

        remainingTime =
            Math.max(remainingTime - 1, 0);

        updateTimerDisplay();

        if (remainingTime === 0) {
            stopTimer(true);
        }

    }, 1000);
}

/* ========================= */

function stopTimer(finished = false) {

    isRunning = false;

    clearInterval(intervalId);

    intervalId = null;

    startBtn.disabled = false;

    if (finished) {

        setState('done');

        playSound();

        if (autoFlipToggle.checked) {

            setTimeout(() => {

                hourglass.style.transform =
                    'rotate(180deg)';

                setTimeout(() => {

                    hourglass.style.transform =
                        'rotate(0deg)';

                    remainingTime = totalTime;

                    updateTimerDisplay();

                    setState('idle');

                    startTimer();

                }, 600);

            }, 700);

        }

    } else {

        setState('idle');

    }
}

/* ========================= */

function resetTimer() {

    stopTimer(false);

    remainingTime = totalTime;

    updateTimerDisplay();

    setState('idle');
}

/* ========================= */

function playSound() {

    try {

        const audioCtx =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        const osc =
            audioCtx.createOscillator();

        const gain =
            audioCtx.createGain();

        osc.connect(gain);

        gain.connect(audioCtx.destination);

        osc.type = 'sine';

        osc.frequency.setValueAtTime(
            800,
            audioCtx.currentTime
        );

        osc.frequency.exponentialRampToValueAtTime(
            400,
            audioCtx.currentTime + 0.3
        );

        gain.gain.setValueAtTime(
            0.3,
            audioCtx.currentTime
        );

        gain.gain.exponentialRampToValueAtTime(
            0.01,
            audioCtx.currentTime + 0.5
        );

        osc.start(audioCtx.currentTime);

        osc.stop(audioCtx.currentTime + 0.5);

    } catch (e) {}
}

/* ========================= */

timeButtons.forEach(btn => {

    btn.addEventListener('click', () => {

        stopTimer(false);

        timeButtons.forEach(b => {
            b.classList.remove('active');
        });

        btn.classList.add('active');

        totalTime =
            parseInt(btn.dataset.time);

        remainingTime = totalTime;

        setDuration();

        updateTimerDisplay();

        setState('idle');
    });

});

/* ========================= */

startBtn.addEventListener(
    'click',
    startTimer
);

resetBtn.addEventListener(
    'click',
    resetTimer
);

/* ========================= */

setDuration();

setState('idle');

updateTimerDisplay();