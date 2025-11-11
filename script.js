// --- DOM Element Selectors ---
const reminderForm = document.getElementById('reminder-form');
const reminderLoader = document.getElementById('reminder-loader');
const reminderResult = document.getElementById('reminder-result');

const overbookBtn = document.getElementById('overbook-btn');
const overbookLoader = document.getElementById('overbook-loader');
const overbookResult = document.getElementById('overbook-result');

// --- FAKE API SIMULATOR ---
// This function simulates a server response without a real backend.
function simulateApiCall(data) {
    return new Promise(resolve => {
        // Add a fake delay to make it feel real
        setTimeout(() => {
            if (data.type === 'reminder') {
                // --- Fake Reminder Logic ---
                // This is a plausible rule based on your project's logic.
                let action = 'sms';
                let actionClass = 'action-sms';
                let baseProb = data.hist_noshow_rate;
                let finalProb = baseProb * 0.75; // SMS effect
                
                if (baseProb > 0.4) {
                    action = 'call';
                    actionClass = 'action-call';
                    finalProb = baseProb * 0.40; // Call effect
                } else if (baseProb < 0.1 && data.lead_time_days < 5) {
                    action = 'none';
                    actionClass = 'action-none';
                    finalProb = baseProb; // No effect
                }
                
                resolve({
                    best_action: action,
                    action_class: actionClass,
                    base_noshow_prob: baseProb,
                    final_noshow_prob: finalProb
                });
            } 
            else if (data.type === 'overbooking') {
                // --- NEW Fake Dynamic Overbooking Logic ---
                // 1. Simulate the "state"
                let expected_attendance = Math.random() * (38 - 25) + 25; // Random value between 25 and 38
                let std_dev = Math.random() * (7 - 3) + 3; // Random value between 3 and 7
                
                // 2. Simulate the "policy"
                let level = "15%"; // Default
                let multiplier = 1.15;
                let levelClass = "overbook-mid";

                if (expected_attendance < 30) {
                    level = "25%"; // Aggressive
                    multiplier = 1.25;
                    levelClass = "overbook-high";
                } else if (expected_attendance < 36) {
                    level = "15%"; // Medium
                    multiplier = 1.15;
                    levelClass = "overbook-mid";
                } else {
                    level = "5%"; // Conservative
                    multiplier = 1.05;
                    levelClass = 'overbook-low';
                }

                // Refine based on risk (std_dev)
                if (std_dev > 6.0 && (level === "25%" || level === "20%")) {
                    level = "15%"; // Too risky, pull back
                    multiplier = 1.15;
                    levelClass = "overbook-mid";
                }
                
                let available_slots = 40;
                let appointments_to_book = Math.floor(available_slots * multiplier);

                resolve({
                    chosen_level: level,
                    multiplier: multiplier,
                    available_slots: available_slots,
                    appointments_to_book: appointments_to_book,
                    expected_attendance_proxy: expected_attendance,
                    attendance_std_dev_proxy: std_dev,
                    levelClass: levelClass
                });
            }
        }, 800); // 800ms delay
    });
}

// --- Event Listener: Reminder Form ---
reminderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    reminderLoader.style.display = 'block';
    reminderResult.innerHTML = '';

    const formData = {
        type: 'reminder',
        hist_noshow_rate: parseFloat(document.getElementById('hist_noshow_rate').value),
        lead_time_days: parseInt(document.getElementById('lead_time_days').value),
    };

    try {
        const data = await simulateApiCall(formData);
        displayReminderResult(data);
    } catch (error) {
        reminderResult.innerHTML = `<p style="color: red;">Demo Error: ${error.message}</p>`;
    } finally {
        reminderLoader.style.display = 'none';
    }
});

// --- Event Listener: Overbooking Button ---
overbookBtn.addEventListener('click', async () => {
    overbookLoader.style.display = 'block';
    overbookResult.innerHTML = '';
    overbookBtn.disabled = true;

    try {
        const data = await simulateApiCall({ type: 'overbooking' });
        displayOverbookingResult(data);
    } catch (error) {
        overbookResult.innerHTML = `<p style="color: red;">Demo Error: ${error.message}</p>`;
    } finally {
        overbookLoader.style.display = 'none';
        overbookBtn.disabled = false;
    }
});

// --- Helper Functions to Display Results ---
function displayReminderResult(data) {
    const html = `
        <h3>Recommendation:</h3>
        <div class="result-main ${data.action_class}">${data.best_action.toUpperCase()}</div>
        <div class="result-details">
            <div>
                <span>${(data.base_noshow_prob * 100).toFixed(1)}%</span>
                Base No-Show Risk
            </div>
            <div>
                <span>${(data.final_noshow_prob * 100).toFixed(1)}%</span>
                Est. Final Risk
            </div>
        </div>
    `;
    reminderResult.innerHTML = html;
}

// *** NEW *** Updated Overbooking Display
function displayOverbookingResult(data) {
    const html = `
        <h3>Daily Analysis & Recommendation:</h3>
        
        <div class="result-details" style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 15px;">
             <div>
                <span>${data.expected_attendance_proxy.toFixed(1)}</span>
                Est. Daily Load (State)
            </div>
            <div>
                <span>${data.attendance_std_dev_proxy.toFixed(1)}</span>
                Attendance Risk (State)
            </div>
        </div>

        <div class="result-main ${data.levelClass}">${data.appointments_to_book} Appts</div>
        <div class="result-details">
            <div>
                <span>${data.available_slots}</span>
                Available Slots
            </div>
            <div>
                <span>${data.chosen_level}</span>
                Overbooking Level (Action)
            </div>
        </div>
    `;
    overbookResult.innerHTML = html;
}
