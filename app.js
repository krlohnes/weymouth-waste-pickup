// Global variables
let streetData = [];
let holidayData = {};
let yardWasteWeeks = {};
let currentHighlight = -1;
let deferredPrompt;
let selectedDate = new Date(); // Current selected date for calculations

// Yard waste season constants
const YARD_WASTE_START_DATE = new Date('2025-04-07');
const YARD_WASTE_END_DATE = new Date('2025-12-08');
const YARD_WASTE_START_TEXT = 'April 7th';
const YARD_WASTE_END_TEXT = 'December 8th';
const YARD_WASTE_YEAR = '2025';

// Load data from JSON files
async function loadData() {
    try {
        // Load holidays data
        const holidaysResponse = await fetch('data/2025/holidays.json');
        const holidaysData = await holidaysResponse.json();
        holidayData = holidaysData.holidays;

        // Load yard waste data
        const yardWasteResponse = await fetch('data/2025/yardwaste.json');
        const yardWasteData = await yardWasteResponse.json();
        yardWasteWeeks = yardWasteData.yardWasteWeeks;

        // Load street data from all files
        const streetFiles = [
            'streets-a-c.json',
            'streets-d-g.json', 
            'streets-h-m.json',
            'streets-n-s.json',
            'streets-t-z.json'
        ];

        streetData = [];
        for (const file of streetFiles) {
            const response = await fetch(`data/2025/${file}`);
            const data = await response.json();
            streetData = streetData.concat(data.streets);
        }

        console.log('Data loaded from JSON files');
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load pickup data. Please try refreshing the page.');
        return false;
    }
}

// Initialize the application
async function init() {
    const dataLoaded = await loadData();
    if (dataLoaded) {
        // Hide loading indicator and show the form
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('inputGroup').style.display = 'block';
        
        setupEventListeners();
        initializeDatePicker();
        updateYardWasteSubtitle();
        loadSavedAddress();
        checkPWASupport();
    }
}

function setupEventListeners() {
    const addressInput = document.getElementById('address');
    const suggestionsDiv = document.getElementById('suggestions');

    addressInput.addEventListener('input', handleAddressInput);
    addressInput.addEventListener('keydown', handleKeyDown);
    addressInput.addEventListener('focus', handleAddressFocus);
    
    document.addEventListener('click', function(e) {
        if (!addressInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            hideSuggestions();
        }
    });
}

function handleAddressFocus(e) {
    // Clear the address field when user clicks into it
    e.target.value = '';
    hideSuggestions();
    updateCheckButtonVisibility();
}

function handleAddressInput(e) {
    const input = e.target.value.trim();
    if (input.length < 2) {
        hideSuggestions();
    } else {
        showSuggestions(input);
    }
    // Only update check button visibility as user types, not the save button
    updateCheckButtonVisibility();
}

function handleKeyDown(e) {
    const suggestions = document.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentHighlight = Math.min(currentHighlight + 1, suggestions.length - 1);
        updateHighlight(suggestions);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentHighlight = Math.max(currentHighlight - 1, -1);
        updateHighlight(suggestions);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentHighlight >= 0 && suggestions[currentHighlight]) {
            selectSuggestion(suggestions[currentHighlight].textContent);
        } else {
            checkPickup();
        }
    } else if (e.key === 'Escape') {
        hideSuggestions();
    }
}

function showSuggestions(input) {
    const suggestionsDiv = document.getElementById('suggestions');
    const matches = findMatches(input);
    
    if (matches.length === 0) {
        hideSuggestions();
        return;
    }

    suggestionsDiv.innerHTML = '';
    currentHighlight = -1;

    matches.forEach((match) => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.textContent = match;
        div.addEventListener('click', () => selectSuggestion(match));
        suggestionsDiv.appendChild(div);
    });

    suggestionsDiv.style.display = 'block';
}

function findMatches(input) {
    const streetPart = input.replace(/^\d+\s*/, '').toUpperCase();
    if (streetPart.length < 2) return [];

    const matches = new Set();
    streetData.forEach(street => {
        if (street.street.includes(streetPart)) {
            matches.add(street.street);
        }
    });

    return Array.from(matches).sort().slice(0, 10);
}

function updateHighlight(suggestions) {
    suggestions.forEach((item, index) => {
        if (index === currentHighlight) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function selectSuggestion(suggestion) {
    const addressInput = document.getElementById('address');
    const currentValue = addressInput.value;
    
    const numberMatch = currentValue.match(/^(\d+\s*)/);
    if (numberMatch) {
        addressInput.value = numberMatch[1] + suggestion;
    } else {
        addressInput.value = suggestion;
    }
    
    hideSuggestions();
}

function hideSuggestions() {
    document.getElementById('suggestions').style.display = 'none';
    currentHighlight = -1;
}

function loadSavedAddress() {
    const savedAddr = localStorage.getItem('weymouth_address');
    if (savedAddr) {
        const savedAddressElement = document.getElementById('savedAddress');
        savedAddressElement.textContent = `Saved: ${savedAddr}`;
        // Make the saved address clickable
        savedAddressElement.style.cursor = 'pointer';
        savedAddressElement.onclick = function() {
            reloadSavedAddress();
        };
        // Auto-fill the saved address for convenience, but don't auto-save changes
        document.getElementById('address').value = savedAddr;
        // Hide the check button since we're showing the saved address
        document.getElementById('checkButton').style.display = 'none';
        // Automatically load results for saved address
        checkPickup();
    } else {
        // Show the check button for first-time users
        document.getElementById('checkButton').style.display = 'block';
    }
}

function reloadSavedAddress() {
    const savedAddr = localStorage.getItem('weymouth_address');
    if (savedAddr) {
        document.getElementById('address').value = savedAddr;
        document.getElementById('checkButton').style.display = 'none';
        checkPickup();
    }
}

function updateCheckButtonVisibility() {
    const currentAddress = document.getElementById('address').value.trim();
    const savedAddress = localStorage.getItem('weymouth_address');
    const checkButton = document.getElementById('checkButton');
    
    // Show "Check Pickup Schedule" button only if:
    // 1. No saved address exists, OR
    // 2. Current address is different from saved address AND user is actively typing
    if (!savedAddress) {
        checkButton.style.display = 'block';
    } else if (currentAddress && currentAddress !== savedAddress) {
        checkButton.style.display = 'block';
    } else {
        checkButton.style.display = 'none';
    }
}

function updateSaveButtonVisibility() {
    const currentAddress = document.getElementById('address').value.trim();
    const savedAddress = localStorage.getItem('weymouth_address');
    const updateButton = document.getElementById('updateAddressButton');
    const results = document.getElementById('results');
    
    // Show "Save as My Address" button only if:
    // 1. There's a saved address AND
    // 2. Current address is different from saved address AND
    // 3. Results are currently visible (meaning successful lookup) AND
    // 4. Results are NOT an error (meaning it was a successful lookup)
    if (savedAddress && 
        currentAddress && 
        currentAddress !== savedAddress && 
        !results.classList.contains('hidden') && 
        !results.classList.contains('error')) {
        updateButton.style.display = 'block';
        updateButton.textContent = 'Save as My Address';
    } else {
        updateButton.style.display = 'none';
    }
}

function updateButtonVisibility() {
    updateCheckButtonVisibility();
    updateSaveButtonVisibility();
}

function parseAddress(address) {
    const match = address.match(/^(\d+)\s+(.+)$/);
    if (match) {
        return {
            number: parseInt(match[1]),
            street: match[2].toUpperCase().trim()
        };
    }
    return null;
}

function findStreetInfo(streetName, houseNumber) {
    const matchingStreets = streetData.filter(street => {
        const streetUpper = street.street.toUpperCase();
        const searchUpper = streetName.toUpperCase();
        return streetUpper.includes(searchUpper) || searchUpper.includes(streetUpper);
    });
    
    return matchingStreets.find(street => 
        houseNumber >= street.low && houseNumber <= street.high
    ) || null;
}

function checkPickup() {
    const address = document.getElementById('address').value.trim();
    
    if (!address) {
        showError('Please enter your address');
        return;
    }

    const parsed = parseAddress(address);
    if (!parsed) {
        showError('Please enter address in format: "123 Main Street"');
        return;
    }

    const streetInfo = findStreetInfo(parsed.street, parsed.number);
    if (!streetInfo) {
        const similarStreets = streetData.filter(street => {
            const streetUpper = street.street.toUpperCase();
            const searchUpper = parsed.street.toUpperCase();
            return streetUpper.includes(searchUpper) || searchUpper.includes(streetUpper);
        });
        
        if (similarStreets.length > 0) {
            const ranges = similarStreets.map(s => `${s.low}-${s.high}`).join(', ');
            showError(`House number ${parsed.number} not found for ${parsed.street}. Valid ranges: ${ranges}`);
        } else {
            showError(`Street "${parsed.street}" not found in Weymouth pickup database`);
        }
        return;
    }

    // If no saved address exists, save this as the default
    const savedAddress = localStorage.getItem('weymouth_address');
    if (!savedAddress) {
        localStorage.setItem('weymouth_address', address);
        document.getElementById('savedAddress').textContent = `Saved: ${address}`;
    }

    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results').classList.remove('error');
    
    // Check for holiday delays first to get delay info
    const holidayInfo = checkHolidayDelay(streetInfo.day);
    updatePickupDay(streetInfo, holidayInfo);
    checkYardWastePickup(streetInfo.zone);
    
    // Update button visibility after successful lookup
    updateSaveButtonVisibility();
}

function updateMyAddress() {
    const address = document.getElementById('address').value.trim();
    
    if (!address) {
        showError('Please enter your address');
        return;
    }
    
    // Validate the address first
    const parsed = parseAddress(address);
    if (!parsed) {
        showError('Please enter address in format: "123 Main Street"');
        return;
    }
    
    const streetInfo = findStreetInfo(parsed.street, parsed.number);
    if (!streetInfo) {
        showError('Please enter a valid Weymouth address');
        return;
    }
    
    // Save the address
    localStorage.setItem('weymouth_address', address);
    document.getElementById('savedAddress').textContent = `Saved: ${address}`;
    updateSaveButtonVisibility();
}

function updatePickupDay(streetInfo, holidayInfo) {
    const pickupDayIcon = document.getElementById('pickupDayIcon');
    const pickupDayText = document.getElementById('pickupDayText');
    
    if (holidayInfo && holidayInfo.isDelayed) {
        const delayedDay = getShiftedPickupDay(streetInfo.day);
        
        pickupDayIcon.textContent = '⚠️';
        pickupDayText.textContent = `Pickup day: ${delayedDay} due to holiday (normally ${streetInfo.day})`;
        pickupDayText.className = 'status-text warning';
    } else {
        pickupDayIcon.textContent = '📅';
        pickupDayText.textContent = `Pickup day: ${streetInfo.day}`;
        pickupDayText.className = 'status-text info';
    }
}

function updateYardWasteSubtitle() {
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
        subtitle.textContent = `🍃 Yard Waste Season: ${YARD_WASTE_START_TEXT} - ${YARD_WASTE_END_TEXT}, ${YARD_WASTE_YEAR}`;
    }
}

function initializeDatePicker() {
    const datePicker = document.getElementById('datePicker');
    
    // Set bounds based on data year
    const dataYear = parseInt(YARD_WASTE_YEAR);
    datePicker.min = `${dataYear}-01-01`;
    datePicker.max = `${dataYear}-12-31`;
    
    // Set to current date if within bounds, otherwise set to start of data year
    const today = new Date();
    if (today.getFullYear() === dataYear) {
        datePicker.value = formatDate(selectedDate);
    } else if (today.getFullYear() < dataYear) {
        // If current date is before data year, set to start of data year
        selectedDate = new Date(dataYear, 0, 1); // January 1st of data year
        datePicker.value = formatDate(selectedDate);
    } else {
        // If current date is after data year, set to end of data year
        selectedDate = new Date(dataYear, 11, 31); // December 31st of data year
        datePicker.value = formatDate(selectedDate);
    }
}

function handleDateChange() {
    const datePicker = document.getElementById('datePicker');
    
    // If date picker is cleared/reset, set to current date
    if (!datePicker.value) {
        const today = new Date();
        const dataYear = parseInt(YARD_WASTE_YEAR);
        
        // Set to current date if within bounds, otherwise set to appropriate boundary
        if (today.getFullYear() === dataYear) {
            selectedDate = today;
        } else if (today.getFullYear() < dataYear) {
            selectedDate = new Date(dataYear, 0, 1);
        } else {
            selectedDate = new Date(dataYear, 11, 31);
        }
        
        // Use setTimeout to ensure the browser updates the display properly on mobile
        setTimeout(() => {
            datePicker.value = formatDate(selectedDate);
        }, 10);
        
        return; // Exit early since we're handling the reset
    } else {
        const newDate = new Date(datePicker.value + 'T12:00:00'); // Add time to avoid timezone issues
        
        // Validate the date is within our data bounds
        const dataYear = parseInt(YARD_WASTE_YEAR);
        if (newDate.getFullYear() !== dataYear) {
            // Reset to a valid date if somehow an invalid date was selected
            if (newDate.getFullYear() < dataYear) {
                selectedDate = new Date(dataYear, 0, 1);
            } else {
                selectedDate = new Date(dataYear, 11, 31);
            }
            datePicker.value = formatDate(selectedDate);
            return;
        }
        
        selectedDate = newDate;
    }
    
    // If results are visible, refresh them with the new date
    const results = document.getElementById('results');
    if (!results.classList.contains('hidden')) {
        checkPickup();
    }
}

function checkHolidayDelay(pickupDay) {
    const today = selectedDate; // Use selected date instead of current date
    const thisWeek = getWeekDates(today);
    
    let holidayInfo = null;
    
    // Check only this week for holidays
    for (const [date, holiday] of Object.entries(holidayData)) {
        const holidayDate = new Date(date);
        const dayOfWeek = holidayDate.getDay();
        
        // Only weekday holidays (Mon-Fri) affect pickup
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            if (isDateInWeek(holidayDate, thisWeek)) {
                // Determine pickup day number (1=Monday, 5=Friday)
                const pickupDayNum = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(pickupDay) + 1;
                
                // Holiday affects pickup if pickup is on or after the holiday
                if (pickupDayNum >= dayOfWeek) {
                    holidayInfo = {
                        holiday: holiday,
                        date: holidayDate,
                        isDelayed: true
                    };
                } else {
                    holidayInfo = {
                        holiday: holiday,
                        date: holidayDate,
                        isDelayed: false
                    };
                }
                break;
            }
        }
    }
    
    const trashIcon = document.getElementById('trashIcon');
    const trashText = document.getElementById('trashText');
    
    if (holidayInfo) {
        if (holidayInfo.isDelayed) {
            trashIcon.textContent = '⚠️';
            trashText.textContent = `Trash pickup delayed by one day this week due to ${holidayInfo.holiday}`;
            trashText.className = 'status-text warning';
        } else {
            trashIcon.textContent = '✅';
            trashText.textContent = `No delays this week - ${holidayInfo.holiday} is after your pickup day`;
            trashText.className = 'status-text yes';
        }
    } else {
        trashIcon.textContent = '✅';
        trashText.textContent = 'No trash pickup delays this week';
        trashText.className = 'status-text yes';
    }
    
    // Return the holiday info for use in pickup day display
    return holidayInfo;
}

// Core yard waste calculation functions (exported for testing)
function getYardWasteMonday(date) {
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    
    // If it's Sunday, we want tomorrow's Monday
    // If it's Mon-Sat, we want this week's Monday
    if (dayOfWeek === 0) {
        monday.setDate(date.getDate() + 1);
    } else {
        monday.setDate(date.getDate() - (dayOfWeek - 1));
    }
    
    return monday;
}

function checkYardWastePickup(zone) {
    const today = selectedDate; // Use selected date instead of current date
    
    const yardIcon = document.getElementById('yardIcon');
    const yardText = document.getElementById('yardText');
    
    // If outside yard waste season, show appropriate message
    if (today < YARD_WASTE_START_DATE) {
        yardIcon.textContent = '❄️';
        yardText.textContent = `Yard waste season starts ${YARD_WASTE_START_TEXT} (Zone ${zone})`;
        yardText.className = 'status-text info';
        return;
    } else if (today > YARD_WASTE_END_DATE) {
        yardIcon.textContent = '❄️';
        yardText.textContent = `Yard waste season ended ${YARD_WASTE_END_TEXT} (Zone ${zone})`;
        yardText.className = 'status-text info';
        return;
    }
    
    // Within season - check for pickup
    const monday = getYardWasteMonday(today);
    const mondayStr = formatDate(monday);
    
    const zoneWeeks = yardWasteWeeks[zone] || [];
    const hasYardWaste = zoneWeeks.includes(mondayStr);
    
    if (hasYardWaste) {
        yardIcon.textContent = '🍃';
        yardText.textContent = `Yes! Yard waste pickup this week (Zone ${zone})`;
        yardText.className = 'status-text yes';
    } else {
        yardIcon.textContent = '❌';
        yardText.textContent = `No yard waste pickup this week (Zone ${zone})`;
        yardText.className = 'status-text no';
    }
}

function getWeekDates(date) {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        week.push(day);
    }
    return week;
}

function isDateInWeek(date, weekDates) {
    return weekDates.some(weekDate => 
        weekDate.toDateString() === date.toDateString()
    );
}

function getWeekStart(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek;
}

function formatDate(date) {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showError(message) {
    const results = document.getElementById('results');
    results.classList.remove('hidden');
    results.className = 'results error';
    results.innerHTML = `
        <div class="result-item">
            <span class="status-icon">⚠️</span>
            <span class="status-text">${message}</span>
        </div>
    `;
}

// PWA Install functionality
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isInstalledPWA() {
    // Check if running as installed PWA
    return (window.matchMedia('(display-mode: standalone)').matches) || 
           (window.navigator.standalone) || 
           document.referrer.includes('android-app://');
}

function checkPWASupport() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Don't show install button if already installed
    if (isInstalledPWA()) {
        return;
    }
    
    if (isMobileDevice()) {
        if (isIOS) {
            // Show iOS-specific install button
            const installButton = document.getElementById('installButton');
            installButton.style.display = 'block';
            installButton.innerHTML = '📱 Add to Home Screen';
        }
    }
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Only show the install button on mobile devices that haven't installed it
    if (isMobileDevice() && !isInstalledPWA()) {
        document.getElementById('installButton').style.display = 'block';
    }
});

function showIOSInstallModal() {
    // Create iOS share icon as inline SVG
    const shareIconSVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="6" width="12" height="9" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8 1v9.5M5.5 3.5L8 1l2.5 2.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal-overlay" id="iosInstallModal">
            <div class="modal">
                <h3>Add to Home Screen</h3>
                <div class="modal-step">
                    <div class="modal-step-number">1</div>
                    <div class="modal-step-text">
                        Tap the Share button <span class="share-icon">${shareIconSVG}</span> at the bottom of your screen
                    </div>
                </div>
                <div class="modal-step">
                    <div class="modal-step-number">2</div>
                    <div class="modal-step-text">
                        Scroll down and tap "Add to Home Screen"
                    </div>
                </div>
                <div class="modal-step">
                    <div class="modal-step-number">3</div>
                    <div class="modal-step-text">
                        Tap "Add" in the top right corner
                    </div>
                </div>
                <button class="modal-close" onclick="closeIOSInstallModal()">Got it!</button>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeIOSInstallModal() {
    const modal = document.getElementById('iosInstallModal');
    if (modal) {
        modal.remove();
    }
}

function installPWA() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
        showIOSInstallModal();
    } else if (deferredPrompt) {
        // Show the install prompt for Android/Desktop
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
            // Hide the install button
            document.getElementById('installButton').style.display = 'none';
        });
    }
}

// Check if already installed
window.addEventListener('appinstalled', () => {
    // Hide the install button
    document.getElementById('installButton').style.display = 'none';
    console.log('PWA was installed');
});

// Initialize when page loads
window.addEventListener('load', init);

// Helper function to determine if a holiday affects a specific pickup day
function isPickupDelayedByHoliday(pickupDay, holidayDate) {
    const holidayDayOfWeek = holidayDate.getDay();
    
    // Only weekday holidays (Mon-Fri) affect pickup
    if (holidayDayOfWeek === 0 || holidayDayOfWeek === 6) {
        return false;
    }
    
    // Get pickup day number (1=Monday, 5=Friday)
    const pickupDayNum = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(pickupDay) + 1;
    
    // Holiday affects pickup if pickup is on or after the holiday
    return pickupDayNum >= holidayDayOfWeek;
}

// Helper function to get the shifted pickup day
function getShiftedPickupDay(normalDay) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const normalDayIndex = days.indexOf(normalDay);
    return days[(normalDayIndex + 1) % 7];
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parseAddress,
        formatDate,
        getWeekStart,
        getYardWasteMonday,
        findStreetInfo,
        getWeekDates,
        isDateInWeek,
        isPickupDelayedByHoliday,
        getShiftedPickupDay
    };
}