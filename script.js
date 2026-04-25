// --- Configuration ---
// IMPORTANT: Replace 'YOUR_OPENWEATHER_API_KEY' with your actual OpenWeatherMap API key.
// Get one for free from https://openweathermap.org/api
const OPENWEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY';
const OPENWEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// --- DOM Elements ---
const timeElement = document.getElementById('time');
const dateElement = document.getElementById('date');
const locationNameElement = document.getElementById('location-name');
const weatherIconElement = document.getElementById('weather-icon');
const temperatureElement = document.getElementById('temperature');
const conditionElement = document.getElementById('condition');
const weatherLoadingElement = document.getElementById('weather-loading');
const weatherErrorElement = document.getElementById('weather-error');
const weatherDataElement = document.getElementById('weather-data');

// --- Clock Functions ---
function updateClock() {
    const now = new Date();

    // Time (HH:MM:SS)
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;

    // Date (Day, Month, Year)
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

// Update clock every second
setInterval(updateClock, 1000);
// Initial call to display clock immediately on page load
updateClock();

// --- Weather UI State Management Functions ---
function showWeatherLoading() {
    weatherLoadingElement.classList.add('active');
    weatherErrorElement.classList.remove('active');
    weatherDataElement.classList.remove('active');
    weatherDataElement.classList.add('hidden'); // Hide actual data
    weatherErrorElement.textContent = ''; // Clear previous errors
}

function showWeatherError(message = "Could not fetch weather. Please enable location or try again.") {
    weatherLoadingElement.classList.remove('active');
    weatherErrorElement.textContent = message;
    weatherErrorElement.classList.add('active');
    weatherDataElement.classList.remove('active');
    weatherDataElement.classList.add('hidden'); // Keep actual data hidden
}

function showWeatherData() {
    weatherLoadingElement.classList.remove('active');
    weatherErrorElement.classList.remove('active');
    weatherDataElement.classList.remove('hidden'); // Make sure it's display block/flex
    // A small delay to allow the browser to render 'display: block' before applying the opacity/transform transition
    setTimeout(() => {
        weatherDataElement.classList.add('active');
    }, 50);
}

// --- Fetch Weather Function ---
async function fetchWeather(latitude, longitude) {
    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
        showWeatherError("Please replace 'YOUR_OPENWEATHER_API_KEY' in script.js with your actual OpenWeatherMap API key.");
        console.error("OpenWeatherMap API Key is missing or invalid. Get one from https://openweathermap.org/api");
        return;
    }

    showWeatherLoading(); // Show loading message before fetching

    try {
        // Fetch weather data using metric units (Celsius)
        const response = await fetch(`${OPENWEATHER_API_URL}?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`);

        if (!response.ok) {
            // Handle specific API errors
            if (response.status === 401) {
                throw new Error("Invalid API Key. Please check your OpenWeatherMap API key.");
            } else if (response.status === 404) {
                 throw new Error("City data not found for your location. Please try again.");
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        }

        const data = await response.json();
        console.log("Weather data received:", data); // For debugging

        // Update DOM with weather information
        locationNameElement.textContent = data.name;
        temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;

        // Capitalize each word in the weather description
        const capitalizedCondition = data.weather[0].description
                                        .split(' ')
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                        .join(' ');
        conditionElement.textContent = capitalizedCondition;

        // Set weather icon
        const iconCode = data.weather[0].icon;
        weatherIconElement.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIconElement.alt = data.weather[0].description;

        showWeatherData(); // Display weather data with fade-in effect

    } catch (error) {
        console.error("Error fetching weather:", error);
        showWeatherError(error.message || "Failed to fetch weather data. Please check your internet connection.");
    }
}

// --- Geolocation Function ---
function getUserLocation() {
    showWeatherLoading(); // Show loading message while trying to get location

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeather(latitude, longitude); // Fetch weather once location is obtained
            },
            (error) => {
                console.error("Geolocation error:", error);
                let errorMessage = "Geolocation denied or unavailable.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Please allow location access to get local weather.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get user location timed out.";
                        break;
                }
                showWeatherError(errorMessage); // Display specific geolocation error
            },
            {
                enableHighAccuracy: true, // Request more precise location
                timeout: 10000,           // 10 seconds timeout
                maximumAge: 0             // Don't use a cached position
            }
        );
    } else {
        showWeatherError("Geolocation is not supported by your browser.");
        console.error("Geolocation is not supported by this browser.");
    }
}

// --- Initialize on Page Load ---
document.addEventListener('DOMContentLoaded', getUserLocation);

// Optional: Automatically refresh weather data every 10 minutes (600,000 milliseconds)
// Be mindful of API call limits with free tiers if enabling this.
// setInterval(getUserLocation, 600000);