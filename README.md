# YAWA — Yet Another Weather App

> Because every developer's portfolio needs at least one weather app.

**YAWA** is a frontend-only web app that shows real-time weather for any city in the world. Built with plain HTML, CSS, and JavaScript — no frameworks, no build tools, no server. Just open `index.html` and go.

Made by **Tyron Vergara** as a learning project for [Generation MX](https://mx.generation.org/).

---

## What it does

- Search any city by name and see its current temperature, wind speed, and weather condition
- Compare multiple cities side by side — cards stack up, nothing disappears until you clear it
- Switch between Light, Dark, and System themes
- Quick-search chips for London, Tokyo, New York, Buenos Aires, Sydney, and Nairobi
- Click **Details** on any card to open a full weather breakdown in a modal
- Remove individual cards or clear everything at once

---

## How to run it

No installation required.

1. Download or clone this repository
2. Open `src/index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
3. Done — no local server, no API key

### Run the tests

Open `src/index.html` in your browser, press F12, go to the Console tab, paste the contents of `src/app.test.js` and press Enter.

---

## How to navigate the code

```
generation-meteo-webapp/
│
├── src/
│   ├── index.html      ← All the markup: navbar, hero, cards container, modals, toasts
│   ├── app.js          ← All the logic (read this top to bottom — it's well commented)
│   └── app.test.js     ← Tests for the API and pure functions
│
├── data/
│   └── sample-response.json  ← Example API responses for reference / offline testing
│
├── images/             ← Reserved for screenshots and assets
├── WRITEUP.md          ← Full project reflection and technical deep-dive
└── README.md           ← You are here
```

### Reading `app.js`

The file is organized in four sections, separated by banner comments:

| Section | What's there |
|---|---|
| **Constants** | `WEATHER_CODES` and `WEATHER_ICONS` — WMO code lookup tables |
| **Theme Management** | `initTheme()`, `applyTheme()` — Bootstrap dark/light/auto theming |
| **API Functions** | `geocodeCity()`, `fetchWeather()` — all network calls live here |
| **UI Functions** | Everything that touches the DOM: cards, errors, modals, toasts |

The entry point is the `DOMContentLoaded` listener at the very bottom of the file.

---

## Tech stack

| Layer | Tool |
|---|---|
| Markup | HTML5 |
| Styles | Bootstrap 5.3 via CDN (no custom CSS file) |
| Icons | Bootstrap Icons 1.11 via CDN |
| Logic | Vanilla JavaScript (ES6+, async/await, Fetch API) |
| Weather data | [Open-Meteo](https://open-meteo.com/) — free, no API key required |

---

## Security & attribution

- **No API keys** — Open-Meteo is free and open
- **No data stored** — nothing is sent to any server other than the public Open-Meteo API
- **XSS protection** — all user input is sanitized with `encodeURIComponent` before hitting the API, and escaped with `escapeHTML()` before touching the DOM
- **Attribution** — weather data provided by [Open-Meteo](https://open-meteo.com/) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)