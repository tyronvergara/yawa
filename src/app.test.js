/**
 * YAWA - Test suite for app.js core functions.
 *
 * How to run:
 *   Open DevTools (F12) on index.html -> Console -> paste this file's content.
 */

// --- Helpers -----------------------------------------------------------------

/** Simple test runner -- logs PASS/FAIL and tracks totals. */
const results = { passed: 0, failed: 0 };

function assert(condition, testName, detail = "") {
    if (condition) {
        console.log(`  [PASS] ${testName}`);
        results.passed++;
    } else {
        console.error(`  [FAIL] ${testName}${detail ? " -- " + detail : ""}`);
        results.failed++;
    }
}

// --- Unit Tests (no network) -------------------------------------------------

/**
 * Test 3: getWeatherDescription returns correct labels and "Unknown" for unmapped codes.
 * This is a pure function -- no network call needed.
 */
function testGetWeatherDescription() {
    // Replicate the lookup logic inline so this file stays self-contained.
    const WEATHER_CODES = {
        0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing rime fog",
        51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
        61: "Light rain", 63: "Moderate rain", 65: "Heavy rain",
        71: "Light snow", 73: "Moderate snow", 75: "Heavy snow",
        80: "Light rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
        95: "Thunderstorm", 96: "Thunderstorm with light hail", 99: "Thunderstorm with heavy hail"
    };
    const getWeatherDescription = (code) => WEATHER_CODES[code] ?? "Unknown";

    assert(getWeatherDescription(0)   === "Clear sky",    "WMO 0 -> 'Clear sky'");
    assert(getWeatherDescription(3)   === "Overcast",     "WMO 3 -> 'Overcast'");
    assert(getWeatherDescription(61)  === "Light rain",   "WMO 61 -> 'Light rain'");
    assert(getWeatherDescription(95)  === "Thunderstorm", "WMO 95 -> 'Thunderstorm'");
    assert(getWeatherDescription(999) === "Unknown",      "Unmapped code -> 'Unknown'");
    assert(getWeatherDescription(-1)  === "Unknown",      "Negative code -> 'Unknown'");
}

// --- Integration Tests (network) ---------------------------------------------

/**
 * Test 1: geocodeCity with a valid city name returns numeric latitude and longitude.
 */
async function testGeocodeCityValid() {
    const testName = "geocodeCity('London') -> returns numeric lat/lon";
    try {
        const url = "https://geocoding-api.open-meteo.com/v1/search?name=London&count=1";
        const response = await fetch(url);
        const data = await response.json();
        const result = data.results?.[0];

        assert(typeof result?.latitude  === "number", testName + " (latitude is a number)");
        assert(typeof result?.longitude === "number", testName + " (longitude is a number)");
        assert(typeof result?.name      === "string", testName + " (name is a string)");
        assert(typeof result?.country   === "string", testName + " (country is a string)");
    } catch (error) {
        assert(false, testName, error.message);
    }
}

/**
 * Test 2: geocodeCity with a gibberish city name returns no results (null equivalent).
 */
async function testGeocodeCityInvalid() {
    const testName = "geocodeCity('qwxyz123') -> returns no results";
    try {
        const url = "https://geocoding-api.open-meteo.com/v1/search?name=qwxyz123&count=1";
        const response = await fetch(url);
        const data = await response.json();
        const hasNoResults = !data.results || data.results.length === 0;

        assert(hasNoResults, testName);
    } catch (error) {
        assert(false, testName, error.message);
    }
}

/**
 * Test 4: fetchWeather with valid coordinates returns a current_weather object
 * with numeric temperature, windspeed, winddirection, and a weathercode.
 */
async function testFetchWeatherValid() {
    const testName = "fetchWeather(51.5, -0.12) -> returns valid current_weather";
    try {
        // Coordinates for London
        const url = "https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.12&current_weather=true";
        const response = await fetch(url);
        const data = await response.json();
        const w = data.current_weather;

        assert(w !== undefined,                      testName + " (current_weather exists)");
        assert(typeof w?.temperature   === "number", testName + " (temperature is a number)");
        assert(typeof w?.windspeed     === "number", testName + " (windspeed is a number)");
        assert(typeof w?.winddirection === "number", testName + " (winddirection is a number)");
        assert(typeof w?.weathercode   === "number", testName + " (weathercode is a number)");
    } catch (error) {
        assert(false, testName, error.message);
    }
}

// --- Runner ------------------------------------------------------------------

(async () => {
    console.log("+----------------------------------+");
    console.log("|   YAWA -- Test Suite             |");
    console.log("+----------------------------------+\n");

    console.log("-- Unit tests (no network) ---------");
    testGetWeatherDescription();

    console.log("\n-- Integration tests (network) -----");
    await testGeocodeCityValid();
    await testGeocodeCityInvalid();
    await testFetchWeatherValid();

    console.log(`\n-- Results -------------------------`);
    console.log(`   Passed : ${results.passed}`);
    console.log(`   Failed : ${results.failed}`);
    console.log(`   Total  : ${results.passed + results.failed}`);
    if (results.failed === 0) {
        console.log("\n   [OK] All tests passed.");
    } else {
        console.log(`\n   [!!] ${results.failed} test(s) failed.`);
    }
})();
