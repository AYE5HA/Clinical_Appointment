// --- DOM Element Selectors ---
const reminderBtn = document.getElementById('start-feed-btn');
const reminderLoader = document.getElementById('reminder-loader');
const reminderFeed = document.getElementById('reminder-feed');

const overbookBtn = document.getElementById('overbook-btn');
const overbookLoader = document.getElementById('overbook-loader');
const overbookResults = document.getElementById('overbooking-results');
const overbookRecommendation = document.getElementById('overbook-recommendation');
const statLoad = document.getElementById('stat-load');
const statRisk = document.getElementById('stat-risk');

// --- FAKE API SIMULATOR ---
// This function simulates a server response without a real backend.
function simulateApiCall(data) {
    return new Promise(resolve => {
        // Add a fake delay to make it feel real
        setTimeout(() => {
            if (data.type === 'reminder') {
                // --- Fake Reminder Logic (Simulates LinUCB) ---
                // This is a plausible rule based on your project's logic.
                let action = 'sms';
                let actionClass = 'tag-sms';
                let baseProb = data.hist_noshow_rate;
                let finalProb = baseProb * 0.75; // SMS effect
                
                if (baseProb > 0.45) {
                    action = 'call';
                    actionClass = 'tag-call';
                    finalProb = baseProb * 0.40; // Call effect
                } else if (baseProb < 0.1 && data.lead_time_days < 5) {
                    action = 'none';
                    actionClass = 'tag-none';
                    finalProb = baseProb; // No effect
                }
                
                resolve({
                    patientId: data.patientId,
                    best_action: action,
                    action_class: actionClass,
                });

            } else if (data.type === 'overbooking') {
                // --- Fake Dynamic Overbooking Logic (Simulates DQN) ---
                // 1. Simulate the "state" (randomly generated for the demo)
                let expected_attendance = Math.random() * (38 - 25) + 25; // Random value between 25 and 38
                let std_dev = Math.random() * (7 - 3) + 3; // Random value between 3 and 7
                
                // 2. Simulate the "policy" (a simplified version of your DQN's logic)
                let level = "15%"; // Default
                let multiplier = 1.15;
                let levelClass = "overbook-mid";

                if (expected_attendance < 30) {
                    level = "25%"; // Aggressive if load is low
                    multiplier = 1.25;
                    levelClass = "overbook-high";
                } else if (expected_attendance < 36) {
                    level = "15%"; // Medium
                    multiplier = 1.15;
                    levelClass = "overbook-mid";
                } else {
                    level = "5%"; // Conservative if load is high
                    multiplier = 1.05;
                    levelClass = 'overbook-low';
                }

                // Refine based on risk (std_dev)
                if (std_dev > 6.0 && (level === "25%" || level === "20%")) {
                    level = "15%"; // Too risky, pull back to medium
                    multiplier = 1.15;
                    levelClass = "overbook-mid";
                }
                
                let available_slots = 40;
                let appointments_to_book = Math.floor(available_slots * multiplier);

                resolve({
                    chosen_level: level,
                    appointments_to_book: appointments_to_book,
                    expected_attendance_proxy: expected_attendance,
                    attendance_std_dev_proxy: std_dev,
                    levelClass: levelClass
                });
            }
        }, 800); // 800ms delay
    });
}

// --- Event Listener: Reminder Button ---
let feedInterval;
reminderBtn.addEventListener('click', () => {
    reminderLoader.style.display = 'block';
    reminderFeed.innerHTML = ''; // Clear the log
    reminderBtn.disabled = true;

    // Simulate a 1-second process to "start the feed"
    setTimeout(() => {
        reminderLoader.style.display = 'none';
        let patientCounter = 0;
        
        // Start a "live feed" of new appointments
        feedInterval = setInterval(async () => {
            if (patientCounter >= 5) {
                clearInterval(feedInterval);
                reminderBtn.disabled = false;
                return;
            }
            
            // 1. Create a fake patient
            const fakePatient = {
                type: 'reminder',
                patientId: `P${Math.floor(Math.random() * (99999 - 10000) + 10000)}`,
                hist_noshow_rate: Math.random() * 0.6, // Random no-show rate
                lead_time_days: Math.floor(Math.random() * 30) + 1
            };
            
            // 2. Get the simulated action
            const data = await simulateApiCall(fakePatient);
            
            // 3. Display it
            displayNewReminder(data);
            patientCounter++;

        }, 1200); // New patient every 1.2 seconds
    }, 1000);
});


// --- Event Listener: Overbooking Button ---
overbookBtn.addEventListener('click', async () => {
    overbookLoader.style.display = 'block';
    overbookResults.style.display = 'none'; // Hide old results
    overbookBtn.disabled = true;

    try {
        const data = await simulateApiCall({ type: 'overbooking' });
        displayOverbookingResult(data);
    } catch (error) {
        overbookRecommendation.innerHTML = `<h2 style="color: red;">Error: ${error.message}</h2>`;
    } finally {
        overbookLoader.style.display = 'none';
        overbookResults.style.display = 'block';
        overbookBtn.disabled = false;
    }
});

// --- Helper Functions to Display Results ---

function displayNewReminder(data) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>Patient ${data.patientId} (Risk: ${(data.base_noshow_prob * 100).toFixed(0)}%)</span>
        <span class="tag ${data.action_class}">${data.best_action.toUpperCase()}</span>
    `;
    reminderFeed.prepend(li); // Add new items to the top
}

function displayOverbookingResult(data) {
    // Update the stats (the "inputs")
    statLoad.textContent = data.expected_attendance_proxy.toFixed(1);
    statRisk.textContent = data.attendance_std_dev_proxy.toFixed(1);

    // Update the recommendation (the "output")
    overbookRecommendation.innerHTML = `
        <h2 class="${data.levelClass}">
            Book ${data.appointments_to_book} Appts
            <span style="font-size: 1.2rem; display: block; color: var(--secondary-color); font-weight: 400;">
                (${data.chosen_level} Overbook)
            </span>
        </h2>
    `;
}
