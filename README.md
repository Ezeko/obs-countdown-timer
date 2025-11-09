# EzekoConcept Timer

[![GitHub stars](https://img.shields.io/github/stars/ezeko/obs-countdown-timer?style=social)](https://github.com/ezeko/obs-countdown-timer/stargazers)
[![GitHub license](https://img.shields.io/github/license/ezeko/obs-countdown-timer)](https://github.com/ezeko/obs-countdown-timer/blob/main/LICENSE)


![Timer Display](/screenshots/Screenshot 2025-11-09 at 16.52.20.png)

A professional OBS timer plugin by EzekoConcept - perfect for streamers, content creators, and presenters.

## Overview

This is a simple two-page static timer:
- `index.html` — large timer display intended for use as an OBS Browser Source (overlay).
- `settings/index.html` — settings/control panel used to configure and control the timer (Start / Pause / Reset / Save / font size / theme).

Design notes

- The two pages communicate through `localStorage`. When you Start the timer from the settings page it writes keys into localStorage (timerMinutes, timerSeconds, timerState, stateTimestamp, pausedElapsed, indexFontSize, etc.). The display page watches storage events and updates immediately.
- Save does NOT start the timer. Start must be clicked to begin the countdown on the display.
- Reset on the settings page: persists a saved timer of 01:00 (so the next Start will use 01:00), sets the inputs to 01:00 and sets the settings preview to 00:00 (locked). Reset does not change the index display.
- The settings preview is "locked" after Save/Reset (it will not mirror the running countdown). Clicking Start unlocks the settings preview and both pages will countdown together.
- Pause in settings toggles the global timer state (`timerState` in localStorage) and pauses/resumes the index display.

Quick start

1. In OBS add the index page as a Browser Source (overlay):

- Scene -> + -> Browser
- Name it e.g. "Timer Display"
- Select "Local file" and browse to the `index.html` file in your timer folder
  - Or enter the full file path, e.g. `file:///path/to/your/timer/index.html`
- Set a width/height that matches your canvas (e.g. 1920x200) or experiment — the timer is responsive
- Uncheck "Shutdown source when not visible" if you want it to keep running

2. Add the settings page as a Dock (so you can control it inside OBS):

- In OBS: View -> Docks -> Custom Browser Docks (or Tools -> Browser Docks depending on OBS version)
- Click the + (Add) button
- Give it a name like "Timer Controls"
- Enter the full path to the settings page:
  - `file:///path/to/your/timer/settings/index.html`
- Choose a width/height for the dock (e.g. 420 x 680). Click Apply

Now you can control the timer from inside OBS.

Alternative: You can also open both pages directly in your browser:
- Timer display: Open `index.html` in your browser
- Settings panel: Open `settings/index.html` in your browser

## Screenshots

### Examples
![Timer Screenshot 1](screenshots/Screenshot%202025-11-09%20at%2016.52.20.png)
*Timer display / settings example (screenshot 1)*

![Timer Screenshot 2](screenshots/Screenshot%202025-11-09%20at%2016.55.18.png)
*Timer display / settings example (screenshot 2)*

How to use the controls

- Minutes / Seconds inputs + Save
  - Enter MM and SS in the inputs and press Save. This updates the saved start time in the settings UI and localStorage but does NOT start the countdown.
  - The settings preview will display the saved time and is locked (it will not count down) until you click Start.

- Start
  - Uses the Minutes/Seconds currently in the input to set the timer and immediately starts countdown on both the settings preview (unlocked) and the index display.

- Pause / Continue
  - Toggles the global timer. Pause stops the countdown and stores elapsed seconds so Continue resumes from where it left off.

- Reset (settings page)
  - Persists a saved timer of 01:00 (so the next Start will use 01:00).
  - Sets the settings inputs to 01:00 but sets the preview to 00:00 and locks it so the preview stops counting down. It does NOT affect the index page or running timer.

- Font size buttons (A+/A-)
  - Increase/decrease the index display font size. This writes `indexFontSize` to localStorage and the index page applies it immediately.

- Theme / Colors
  - You can choose dark mode and custom colors in the settings. The index page applies these theme variables. However, the settings page timer and inputs are intentionally forced to be black text on white background for clarity.

Troubleshooting

- If you have issues with file:// URLs in OBS, make sure to use the "Local file" option in the Browser Source settings
- Ensure both pages have permissions to access localStorage in your browser
- If the settings panel can't control the display, make sure both pages are from the same folder

## Support and Sponsorship

If you find this timer useful, consider supporting its development:

- 💖 [Sponsor on GitHub](https://github.com/sponsors/ezeko)

### Premium Features (Coming Soon)

- ⭐ Custom animations and transitions
- ⭐ Additional timer styles and themes
- ⭐ Multi-timer support
- ⭐ Advanced OBS integration
- ⭐ Priority support

Stay tuned for premium features and updates!
- If the index or settings pages aren't updating, open the browser developer console (press F12 in a browser) and check for errors.
- To clear timer state between tests, open the browser console (on either page) and run:

```js
localStorage.clear();
```

Then refresh both pages.

- If the settings preview is not counting down after clicking Start, ensure Save was not left locked (click Start again — Start unlocks the preview and begins countdown).

Notes for OBS users

- Make the Timer Display source transparent if you want only the numbers on top of video: in the Browser Source settings, set the background color and page CSS or set capture to use transparent background (in OBS use browser source properties with CSS: `body { background: transparent; }`). You may need to enable "Use custom CSS" in the Browser Source properties.
- For best results set the Browser Source size to match the visual area you want to cover. The timer scales with viewport.

Developer / Debug hints

- Key localStorage keys used by the app (for reference):
  - `timerMinutes`, `timerSeconds` — saved start duration
  - `timerState` — 'running'|'paused'|'stopped'
  - `stateTimestamp` — epoch ms when the run started (used to compute elapsed)
  - `pausedElapsed` — elapsed seconds saved at pause
  - `indexDisplay` — current display string published by index page
  - `indexFontSize` — font size (vw) for the index display

License / Credits

This is a small local utility. No external dependencies. Use and adapt freely.

---

