(function () {
  // SettingsApp: separates concerns and centralizes localStorage interactions
  const els = {
    minInput: document.getElementById('minutes'),
    secInput: document.getElementById('seconds'),
    saveBtn: document.getElementById('saveSettings'),
    startBtn: document.getElementById('startTimer'),
    pauseBtn: document.getElementById('pauseTimer'),
    resetBtn: document.getElementById('resetTimer'),
    display: document.getElementById('display'),
    incBtn: document.getElementById('increaseFont'),
    decBtn: document.getElementById('decreaseFont'),
    darkMode: document.getElementById('darkMode'),
    colorNormal: document.getElementById('timerColorNormal'),
    colorOvertime: document.getElementById('timerColorOvertime'),
    status: document.getElementById('status')
  };

  let statusTimer = null;
  // When true settings preview will not mirror the global running timer.
  // Save/Reset set this to true; Start clears it so settings shows live countdown.
  let previewLocked = true;
  // If a Reset was pressed we want the preview to show 00:00 (even though saved timer is 01:00)
  let resetPreviewZero = false;
  function setStatus(msg, ms = 2000) {
    try {
      if (!els.status) return;
      els.status.textContent = msg;
      if (statusTimer) clearTimeout(statusTimer);
      if (ms > 0) statusTimer = setTimeout(() => { els.status.textContent = ''; }, ms);
    } catch (e) { /* ignore */ }
  }

  function formatMMSS(totalSeconds) {
    const abs = Math.abs(Math.floor(totalSeconds));
    const m = Math.floor(abs / 60).toString().padStart(2, '0');
    const s = (abs % 60).toString().padStart(2, '0');
    return (totalSeconds < 0 ? '-' : '') + `${m}:${s}`;
  }

  function readSavedTime() {
    const mins = parseInt(localStorage.getItem('timerMinutes')) || 0;
    const secs = parseInt(localStorage.getItem('timerSeconds')) || 0;
    return mins * 60 + secs;
  }

  function applyTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');

    // Map the normal timer color to --fg so timer text is black on light, white on dark
    const normal = localStorage.getItem('timerColorNormal') || localStorage.getItem('timerColor') || '#111111';
    const overtime = localStorage.getItem('timerColorOvertime') || '#ff4c4c';
    document.documentElement.style.setProperty('--fg', normal);
    document.documentElement.style.setProperty('--timer-overtime', overtime);
    // ensure pickers show saved values
    try { if (els.colorNormal) els.colorNormal.value = normal; } catch (e) {}
    try { if (els.colorOvertime) els.colorOvertime.value = overtime; } catch (e) {}
    try { if (els.darkMode) els.darkMode.checked = theme === 'dark'; } catch (e) {}
  }

  function updateSettingsDisplayToSaved() {
    // Read saved minutes/seconds and update the settings preview.
    // Default to 00:00 when not set.
    const mins = localStorage.getItem('timerMinutes') || '0';
    const secs = localStorage.getItem('timerSeconds') || '0';
    els.display.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    els.display.classList.remove('overtime');
  }

  function updateDisplayLoop() {
    const timerState = localStorage.getItem('timerState');
    const stateTimestamp = parseInt(localStorage.getItem('stateTimestamp')) || 0;
    const duration = readSavedTime();
    // If preview is locked (user saved or reset), do not mirror the global timer.
    if (previewLocked) {
      if (resetPreviewZero) {
        els.display.textContent = '00:00';
        els.display.classList.remove('overtime');
      } else {
        updateSettingsDisplayToSaved();
      }
      return;
    }

    // When not locked, mirror the global timer state (running/paused/not-running)
    if (timerState === 'running') {
      const elapsed = Math.floor((Date.now() - stateTimestamp) / 1000);
      const diff = duration - elapsed;
      els.display.textContent = formatMMSS(diff);
      els.display.classList.toggle('overtime', diff < 0);
    } else if (timerState === 'paused') {
      const paused = parseInt(localStorage.getItem('pausedElapsed')) || 0;
      const diff = duration - paused;
      els.display.textContent = formatMMSS(diff);
      els.display.classList.toggle('overtime', diff < 0);
    } else {
      updateSettingsDisplayToSaved();
    }
  }

  function saveSettings() {
    const mins = els.minInput.value || '0';
    const secs = els.secInput.value || '0';
    localStorage.setItem('timerMinutes', mins);
    localStorage.setItem('timerSeconds', secs);
    // Update settings preview only. Do NOT start the timer here — Start must be explicit.
    // Show the exact new saved time (no subtraction/addition) and lock the preview so it
    // doesn't mirror any running timer until Start is pressed.
    const duration = parseInt(mins, 10) * 60 + parseInt(secs, 10);
    els.display.textContent = formatMMSS(duration);
    els.display.classList.remove('overtime');
    previewLocked = true;
    resetPreviewZero = false;
    setStatus('Settings saved (timer not started)');
  }

  function startFromSettingsDisplay() {
    // Start using the explicit input values (don't rely on the live preview which may be a remaining time)
    const minsRaw = els.minInput.value || '0';
    const secsRaw = els.secInput.value || '0';
    const mins = String(Math.max(0, parseInt(minsRaw) || 0));
    const secs = String(Math.max(0, Math.min(59, parseInt(secsRaw) || 0)));

  // Persist the chosen start time
    localStorage.setItem('timerMinutes', mins);
    localStorage.setItem('timerSeconds', secs);

    // Clear any paused state and set the timer to start now
    localStorage.removeItem('pausedElapsed');
    localStorage.setItem('timerState', 'running');
    localStorage.setItem('stateTimestamp', Date.now().toString());

    // Ensure settings preview mirrors the live timer (unlocked)
    previewLocked = false;
    resetPreviewZero = false;

    // ensure pause button reset
    try { if (els.pauseBtn) els.pauseBtn.textContent = 'Pause Timer'; } catch (e) {}
    setStatus('Timer started');
  }

  function togglePauseControl() {
    // Toggle pause/continue for the global timer. Always apply to index via localStorage.
    const timerState = localStorage.getItem('timerState');
    if (timerState === 'running') {
      // pause: compute elapsed from the shared stateTimestamp
      const stateTimestamp = parseInt(localStorage.getItem('stateTimestamp')) || Date.now();
      const pausedElapsedLocal = Math.floor((Date.now() - stateTimestamp) / 1000);
      localStorage.setItem('pausedElapsed', pausedElapsedLocal);
      localStorage.setItem('timerState', 'paused');
      try { els.pauseBtn.textContent = 'Continue Timer'; } catch (e) {}
      setStatus('Timer paused');
    } else if (timerState === 'paused') {
      // continue: set stateTimestamp back so running resumes from pausedElapsed
      const pausedElapsedLocal = parseInt(localStorage.getItem('pausedElapsed')) || 0;
      const now = Date.now();
      localStorage.setItem('stateTimestamp', (now - pausedElapsedLocal * 1000).toString());
      localStorage.setItem('timerState', 'running');
      try { els.pauseBtn.textContent = 'Pause Timer'; } catch (e) {}
      setStatus('Timer continued');
    } else {
      // nothing running — provide feedback
      try { els.pauseBtn.classList.add('pulse'); setTimeout(() => els.pauseBtn.classList.remove('pulse'), 300); } catch (e) {}
      setStatus('No active timer to pause/continue', 1800);
    }
  }

  function resetSettingsDisplay() {
    // Reset saved timer to 01:00 (so Start will use 01:00), but show the preview as 00:00
    // This clears any running preview without affecting the index page.
    const defaultMin = '1';
    const defaultSec = '0';
    // persist the saved timer to 01:00
    try {
      localStorage.setItem('timerMinutes', defaultMin);
      localStorage.setItem('timerSeconds', defaultSec);
    } catch (e) { /* ignore */ }
    // update inputs to show saved default
    els.minInput.value = defaultMin;
    els.secInput.value = defaultSec;
    // but display the preview as 00:00 and lock the preview so it doesn't mirror a running timer
    els.display.textContent = '00:00';
    els.display.classList.remove('overtime');
    previewLocked = true;
    resetPreviewZero = true;
    setStatus('Settings saved to 01:00; preview cleared to 00:00');
  }

  function changeIndexFont(by) {
    let size = parseFloat(localStorage.getItem('indexFontSize')) || 60;
    size = Math.min(200, Math.max(20, size + by));
    localStorage.setItem('indexFontSize', size);
    try { localStorage.setItem('indexFontSizeUpdatedAt', Date.now().toString()); } catch (e) {}
    setStatus('Index font size updated');
  }

  function bind() {
    els.saveBtn.addEventListener('click', () => { saveSettings(); setStatus('Settings saved'); });
    els.startBtn.addEventListener('click', startFromSettingsDisplay);
    els.pauseBtn.addEventListener('click', togglePauseControl);
    els.resetBtn.addEventListener('click', resetSettingsDisplay);
    els.incBtn.addEventListener('click', () => changeIndexFont(10));
    els.decBtn.addEventListener('click', () => changeIndexFont(-10));

    // Theme controls
    if (els.darkMode) {
      els.darkMode.addEventListener('change', () => {
        localStorage.setItem('theme', els.darkMode.checked ? 'dark' : 'light');
        applyTheme();
      });
    }
    if (els.colorNormal) {
      els.colorNormal.addEventListener('input', () => {
        localStorage.setItem('timerColorNormal', els.colorNormal.value);
        applyTheme();
      });
    }
    if (els.colorOvertime) {
      els.colorOvertime.addEventListener('input', () => {
        localStorage.setItem('timerColorOvertime', els.colorOvertime.value);
        applyTheme();
      });
    }

    // allow Enter to save from inputs
    [els.minInput, els.secInput].forEach(input => {
      input.addEventListener('keypress', e => { if (e.key === 'Enter') saveSettings(); });
    });
  }

  function init() {
    applyTheme();
    updateSettingsDisplayToSaved();
    bind();
    // start display loop
    setInterval(updateDisplayLoop, 100);
  }

  // Start app
  init();
})();
