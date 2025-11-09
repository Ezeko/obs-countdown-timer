/* index.js
   Controls the index timer display. Extracted from inline HTML and refactored.
*/

// Cache DOM
const display = document.getElementById('display');

// Timer state
let timer = null;
let isRunning = false;
let startTime = 0;
let elapsed = 0;
let targetDuration = 0;
let pausedElapsed = 0;
let wasOvertime = false; // track transition to overtime for blink

/**
 * write the current index display into localStorage so other tabs (settings) can compare
 */
function publishIndexDisplay(text) {
  try { localStorage.setItem('indexDisplay', text); } catch (e) { /* ignore */ }
}

/**
 * Update the visible display when running.
 * Shows negative sign when time goes below zero and toggles overtime class.
 */
function updateDisplay() {
  if (!isRunning) return;
  const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
  const diff = targetDuration - totalSeconds;
  const absDiff = Math.abs(diff);
  const mins = Math.floor(absDiff / 60).toString().padStart(2, '0');
  const secs = (absDiff % 60).toString().padStart(2, '0');
  const timeStr = `${diff < 0 ? '-' : ''}${mins}:${secs}`;
  display.textContent = timeStr;

  // Overtime handling: add .overtime and blink once when we first cross into overtime
  const nowOver = diff < 0;
  display.classList.toggle('overtime', nowOver);
  if (nowOver && !wasOvertime) {
    // add blink class to animate once, then remove after animation
    display.classList.add('blink');
    setTimeout(() => display.classList.remove('blink'), 900);
  }
  wasOvertime = nowOver;

  // publish for settings to read
  publishIndexDisplay(display.textContent);
}

/**
 * Start the timer using values from localStorage (timerMinutes/timerSeconds) or resume pausedElapsed.
 */
function startTimer() {
  // Start or restart timer using current stored values. Allow restarting even if already running.
  const mins = parseInt(localStorage.getItem('timerMinutes')) || 0;
  const secs = parseInt(localStorage.getItem('timerSeconds')) || 0;
  targetDuration = mins * 60 + secs;
  pausedElapsed = parseInt(localStorage.getItem('pausedElapsed')) || 0;
  // prefer explicit stateTimestamp if provided (settings may have set it)
  const storedTs = parseInt(localStorage.getItem('stateTimestamp')) || 0;
  if (pausedElapsed > 0) {
    startTime = Date.now() - pausedElapsed * 1000;
    localStorage.removeItem('pausedElapsed');
  } else if (storedTs > 0) {
    startTime = storedTs;
  } else {
    startTime = Date.now() - elapsed * 1000;
  }
  // ensure single interval
  if (timer) clearInterval(timer);
  isRunning = true;
  timer = setInterval(updateDisplay, 100);
  localStorage.setItem('timerState', 'running');
  localStorage.setItem('stateTimestamp', startTime.toString());
}

/**
 * Pause the timer and store elapsed so it can be continued.
 */
function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timer);
  elapsed = Math.floor((Date.now() - startTime) / 1000);
  isRunning = false;
  localStorage.setItem('timerState', 'paused');
  localStorage.setItem('pausedElapsed', elapsed);
}

/**
 * Reset the index timer display to 00:00 and stop running.
 */
function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  elapsed = 0;
  display.textContent = '00:00';
  display.classList.remove('overtime');
  wasOvertime = false;
  targetDuration = 0;
  localStorage.setItem('timerState', 'stopped');
  publishIndexDisplay(display.textContent);
}

/**
 * Apply theme colors and font size read from localStorage.
 * Settings no longer exposes color pickers; defaults used if keys missing.
 */
function applyThemeAndFont() {
  const theme = localStorage.getItem('theme') || 'light';
  if (theme === 'dark') document.body.classList.add('dark'); else document.body.classList.remove('dark');
  // normal color now maps to --fg so the timer text is black on light and white on dark
  const normal = localStorage.getItem('timerColorNormal') || '#111111';
  const overtime = localStorage.getItem('timerColorOvertime') || '#ff1f1f';
  document.documentElement.style.setProperty('--fg', normal);
  document.documentElement.style.setProperty('--timer-overtime', overtime);
  let size = parseFloat(localStorage.getItem('indexFontSize')) || 60;
  if (size < 20) size = 20; if (size > 200) size = 200;
  display.style.fontSize = size + 'vw';
}

// Listen to storage events so changes from settings apply immediately
window.addEventListener('storage', (e) => {
  // When shared state changes, reconcile local runtime so settings can restart/update the index at any time.
  try {
    if (e.key === 'timerState') {
      const state = localStorage.getItem('timerState');
      if (state === 'running') {
        // always restart from provided stateTimestamp/values
        startTimer();
      } else if (state === 'paused') {
        pauseTimer();
      } else if (state === 'stopped') {
        resetTimer();
      }
    }

    // If timing parameters change (minutes/seconds/stateTimestamp) we should apply them immediately.
    if (e.key === 'stateTimestamp' || e.key === 'timerMinutes' || e.key === 'timerSeconds') {
      const running = localStorage.getItem('timerState') === 'running';
      if (running) startTimer();
      else {
        // update displayed preview when not running
        const mins = parseInt(localStorage.getItem('timerMinutes')) || 0;
        const secs = parseInt(localStorage.getItem('timerSeconds')) || 0;
        const text = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        display.textContent = text;
        publishIndexDisplay(display.textContent);
      }
    }

    // theme or font changes
    if (e.key && (e.key.startsWith('timerColor') || e.key.startsWith('indexFontSize') || e.key === 'theme')) applyThemeAndFont();
  } catch (err) {
    // ignore storage-handling errors
  }
});

// Initialize display and behavior
// Initialize by applying theme and loading any saved display state (but don't start running automatically)
applyThemeAndFont();
// If saved state is running, start it
const initialState = localStorage.getItem('timerState');
if (initialState === 'running') {
  startTimer();
} else if (initialState === 'paused') {
  // show paused preview
  const mins = parseInt(localStorage.getItem('timerMinutes')) || 0;
  const secs = parseInt(localStorage.getItem('timerSeconds')) || 0;
  const paused = parseInt(localStorage.getItem('pausedElapsed')) || 0;
  const diff = mins * 60 + secs - paused;
  display.textContent = `${diff < 0 ? '-' : ''}${String(Math.abs(Math.floor(diff / 60))).padStart(2,'0')}:${String(Math.abs(Math.floor(diff % 60))).padStart(2,'0')}`;
  publishIndexDisplay(display.textContent);
} else {
  // default to saved minutes/seconds or 00:00
  const mins = parseInt(localStorage.getItem('timerMinutes')) || 0;
  const secs = parseInt(localStorage.getItem('timerSeconds')) || 0;
  display.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  publishIndexDisplay(display.textContent);
}

// Expose functions for debugging (optional)
window.__timer = { startTimer, pauseTimer, resetTimer, updateDisplay };
