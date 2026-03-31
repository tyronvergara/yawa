/** WMO weather code → human-readable description. @see https://open-meteo.com/en/docs */
const WEATHER_CODES = {
    0: "Clear sky",      1: "Mainly clear",   2: "Partly cloudy",  3: "Overcast",
    45: "Fog",           48: "Depositing rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    61: "Light rain",    63: "Moderate rain",    65: "Heavy rain",
    71: "Light snow",    73: "Moderate snow",    75: "Heavy snow",
    80: "Light rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
    95: "Thunderstorm",  96: "Thunderstorm with light hail", 99: "Thunderstorm with heavy hail"
};

/** WMO weather code → representative emoji. */
const WEATHER_ICONS = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌊",
    71: "🌨️", 73: "❄️", 75: "❄️",
    80: "🌦️", 81: "🌧️", 82: "⛈️",
    95: "⚡",  96: "⚡",  99: "⚡"
};

/** Number of city cards currently displayed. */
let cityCount = 0;

/**
 * Returns a readable weather description for a WMO code.
 * @param {number} weathercode
 * @returns {string} Description, or "Unknown" if code is not mapped.
 */
function getWeatherDescription(weathercode) {
    return WEATHER_CODES[weathercode] ?? "Unknown";
}

/**
 * Returns a weather emoji for a WMO code.
 * @param {number} weathercode
 * @returns {string} Emoji character.
 */
function getWeatherIcon(weathercode) {
    return WEATHER_ICONS[weathercode] ?? "🌡️";
}

// ─── Theme Management ────────────────────────────────────────────────

/**
 * Applies a Bootstrap theme to the page and persists the choice.
 * Resolves "auto" against the OS preference via matchMedia.
 * @param {"light"|"dark"|"auto"} theme
 */
function applyTheme(theme) {
    const htmlEl = document.documentElement;
    const icon = document.getElementById("theme-icon");

    const resolved = theme === "auto"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
    htmlEl.setAttribute("data-bs-theme", resolved);

    const iconMap = { light: "bi-sun-fill", dark: "bi-moon-stars-fill", auto: "bi-circle-half" };
    icon.className = "bi " + (iconMap[theme] || "bi-circle-half");

    document.querySelectorAll(".theme-option").forEach((btn) => {
        btn.querySelector(".check-icon").classList.toggle("d-none", btn.dataset.theme !== theme);
    });

    localStorage.setItem("weather-app-theme", theme);
}

/**
 * Reads the saved theme preference (or defaults to "auto") and applies it.
 * Also listens for OS-level dark/light changes when in auto mode.
 */
function initTheme() {
    const saved = localStorage.getItem("weather-app-theme") || "auto";
    applyTheme(saved);

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if ((localStorage.getItem("weather-app-theme") || "auto") === "auto") {
            applyTheme("auto");
        }
    });
}

// ─── API Functions ───────────────────────────────────────────────────

/**
 * Geocodes a city name using the Open-Meteo Geocoding API.
 * @param {string} city - City name to look up.
 * @returns {Promise<{name:string, country:string, latitude:number, longitude:number}|null>}
 *   City data, or null if no results were found.
 */
async function geocodeCity(city) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Geocoding error: ${response.status} ${response.statusText}`);

        const data = await response.json();
        if (!data.results || data.results.length === 0) return null;

        const { name, country, latitude, longitude } = data.results[0];
        return { name, country, latitude, longitude };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") throw new Error("City search timed out (10s).");
        throw error;
    }
}

/**
 * Fetches current weather for a coordinate pair from the Open-Meteo Forecast API.
 * @param {number} lat - Latitude.
 * @param {number} lon - Longitude.
 * @returns {Promise<Object>} The `current_weather` object from the API response.
 */
async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Weather fetch error: ${response.status} ${response.statusText}`);

        const data = await response.json();
        return data.current_weather;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") throw new Error("Weather request timed out (10s).");
        throw error;
    }
}

// ─── UI Functions ────────────────────────────────────────────────────

/**
 * Builds and appends a Bootstrap card for a city's weather.
 * Cards accumulate — existing ones are never removed by this function.
 * @param {Object} weatherData - `current_weather` object from the API.
 * @param {{name:string, country:string}} cityInfo - Geocoded city data.
 */
function displayWeather(weatherData, cityInfo) {
    const container = document.getElementById("weather-container");
    const description = getWeatherDescription(weatherData.weathercode);
    const icon = getWeatherIcon(weatherData.weathercode);
    const cardId = `card-${Date.now()}`;

    const col = document.createElement("div");
    col.className = "col-md-4 col-lg-3";
    col.id = cardId;

    col.innerHTML = `
        <div class="card shadow-sm h-100 overflow-hidden">
            <div class="card-header bg-primary text-white py-3 border-0">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title mb-0 fw-bold">${escapeHTML(cityInfo.name)}</h6>
                        <small class="opacity-75">${escapeHTML(cityInfo.country)}</small>
                    </div>
                    <span class="fs-3">${icon}</span>
                </div>
            </div>
            <div class="card-body text-center py-4">
                <p class="display-5 fw-bold text-primary mb-1">${weatherData.temperature}°C</p>
                <span class="badge text-bg-info rounded-pill px-3">${escapeHTML(description)}</span>
            </div>
            <ul class="list-group list-group-flush">
                <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                    <span class="text-body-secondary"><i class="bi bi-wind text-primary"></i> Wind</span>
                    <span class="fw-semibold">${weatherData.windspeed} km/h</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                    <span class="text-body-secondary"><i class="bi bi-compass text-primary"></i> Direction</span>
                    <span class="fw-semibold">${weatherData.winddirection}°</span>
                </li>
            </ul>
            <div class="card-footer bg-body-tertiary border-0 d-flex gap-2 p-2">
                <button class="btn btn-sm btn-outline-primary flex-grow-1 detail-btn"
                    data-city="${escapeHTML(cityInfo.name)}, ${escapeHTML(cityInfo.country)}"
                    data-temp="${weatherData.temperature}"
                    data-desc="${escapeHTML(description)}"
                    data-icon="${icon}"
                    data-wind="${weatherData.windspeed}"
                    data-dir="${weatherData.winddirection}"
                    data-wmo="${weatherData.weathercode}"
                    data-time="${weatherData.time || "N/A"}">
                    <i class="bi bi-arrows-fullscreen"></i> Details
                </button>
                <button class="btn btn-sm btn-outline-danger remove-btn" data-card="${cardId}">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>
    `;

    container.appendChild(col);
    document.getElementById("results-toolbar").classList.remove("d-none");
    document.getElementById("empty-state").classList.add("d-none");

    cityCount++;
    updateCityCount();
    showToast(`${cityInfo.name} added!`);
}

/**
 * Shows a Bootstrap danger alert with the given message.
 * @param {string} message
 */
function displayError(message) {
    const el = document.getElementById("error-message");
    document.getElementById("error-text").textContent = message;
    el.classList.remove("d-none");
}

/** Hides the error alert and clears its text. */
function hideError() {
    const el = document.getElementById("error-message");
    el.classList.add("d-none");
    document.getElementById("error-text").textContent = "";
}

/** Shows the loading spinner and disables the search button. */
function showLoading() {
    document.getElementById("loading-container").classList.remove("d-none");
    document.getElementById("search-btn").disabled = true;
}

/** Hides the loading spinner and re-enables the search button. */
function hideLoading() {
    document.getElementById("loading-container").classList.add("d-none");
    document.getElementById("search-btn").disabled = false;
}

/** Removes all weather cards from the DOM and resets the city counter. */
function clearResults() {
    document.getElementById("weather-container").innerHTML = "";
    document.getElementById("results-toolbar").classList.add("d-none");
    document.getElementById("empty-state").classList.remove("d-none");
    cityCount = 0;
    updateCityCount();
}

/** Updates the city counter badge in the navbar. */
function updateCityCount() {
    const badge = document.getElementById("city-count-badge");
    document.getElementById("city-count").textContent = cityCount;
    badge.classList.toggle("d-none", cityCount === 0);
}

/**
 * Shows a Bootstrap success toast with the given message.
 * @param {string} message
 */
function showToast(message) {
    document.getElementById("toast-message").textContent = message;
    new bootstrap.Toast(document.getElementById("success-toast"), { delay: 2500 }).show();
}

/**
 * Populates and opens the weather detail modal for a card.
 * Reads weather values from the button's data-* attributes.
 * @param {HTMLElement} btn - The "Details" button element.
 */
function openDetailModal(btn) {
    document.getElementById("modal-city-name").textContent    = btn.dataset.city;
    document.getElementById("modal-temperature").textContent  = btn.dataset.temp + "°C";
    document.getElementById("modal-description").textContent  = btn.dataset.desc;
    document.getElementById("modal-weather-icon").textContent = btn.dataset.icon;
    document.getElementById("modal-wind").textContent         = btn.dataset.wind + " km/h";
    document.getElementById("modal-direction").textContent    = btn.dataset.dir + "°";
    document.getElementById("modal-wmo").textContent          = btn.dataset.wmo;
    document.getElementById("modal-time").textContent         = btn.dataset.time;
    new bootstrap.Modal(document.getElementById("detailModal")).show();
}

/**
 * Removes a single weather card from the DOM.
 * @param {string} cardId - The id of the column element wrapping the card.
 */
function removeCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.remove();
    cityCount--;
    updateCityCount();
    if (cityCount === 0) {
        document.getElementById("results-toolbar").classList.add("d-none");
        document.getElementById("empty-state").classList.remove("d-none");
    }
}

/**
 * Escapes a string for safe insertion into HTML, preventing XSS.
 * @param {string} str
 * @returns {string} HTML-escaped string.
 */
function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Orchestrates a full city weather search: geocode → fetch weather → display card.
 * Handles loading state and error display internally.
 * @param {string} cityName
 */
async function searchCity(cityName) {
    hideError();
    showLoading();
    try {
        const cityInfo = await geocodeCity(cityName);
        if (!cityInfo) { displayError("City not found."); return; }
        const weatherData = await fetchWeather(cityInfo.latitude, cityInfo.longitude);
        displayWeather(weatherData, cityInfo);
    } catch (error) {
        displayError(error.message || "An unexpected error occurred.");
    } finally {
        hideLoading();
    }
}

/**
 * Form submit handler — validates the input field then delegates to searchCity.
 * @param {Event} event - The form submit event.
 */
async function handleSearch(event) {
    event.preventDefault();
    const input = document.getElementById("city-input");
    const city = input.value.trim();
    if (!city) { displayError("Please enter a city name."); return; }
    await searchCity(city);
    input.value = "";
}

// ─── Initialization ──────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    document.querySelectorAll(".theme-option").forEach((btn) => {
        btn.addEventListener("click", () => applyTheme(btn.dataset.theme));
    });

    document.getElementById("search-form").addEventListener("submit", handleSearch);
    document.getElementById("clear-btn").addEventListener("click", clearResults);

    // Delegated click handler for suggestion chips
    document.getElementById("suggestions").addEventListener("click", (e) => {
        const btn = e.target.closest(".suggestion-btn");
        if (btn) searchCity(btn.dataset.city);
    });

    // Delegated click handler for dynamic card buttons (Details / Remove)
    document.getElementById("weather-container").addEventListener("click", (e) => {
        const detailBtn = e.target.closest(".detail-btn");
        if (detailBtn) { openDetailModal(detailBtn); return; }
        const removeBtn = e.target.closest(".remove-btn");
        if (removeBtn) removeCard(removeBtn.dataset.card);
    });
});
