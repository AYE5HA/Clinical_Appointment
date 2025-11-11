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
                // This is a simple, plausible rule based on your project.
                // It's not your model, but it looks like it!
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
                // --- Fake Overbooking Logic ---
                // We just return the *best* result from your notebook's simulation.
                // This is the "Dynamic DQN Policy" result.
                resolve({
                    chosen_level: '20% (Dynamic)', // From your "best_params"
                    multiplier: 1.20,
                    available_slots: 40,
                    appointments_to_book: 48, // 40 * 1.2
                    expected_attendance_proxy: 34.6, // From your best_params run
                    levelClass: 'overbook-high'
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
        // Call the *simulator* function instead of fetch()
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
        // Call the *simulator* function
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

function displayOverbookingResult(data) {
    const html = `
        <h3>Recommendation:</h3>
        <div class="result-main ${data.levelClass}">${data.appointments_to_book} Appts</div>
        <div class="result-details">
            <div>
                <span>${data.available_slots}</span>
                Available Slots
            </div>
            <div>
                <span>${data.chosen_level}</span>
                Overbooking Level
            </div>
            <div>
                <span>${data.expected_attendance_proxy.toFixed(1)}</span>
                Est. Daily Load
            </div>
        </div>
    `;
    overbookResult.innerHTML = html;
}
