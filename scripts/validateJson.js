import { analyzeJsonStats } from './jsonStats.js';
import * as CONSTANTS from '/config/constants.js'

// Constants for UI elements related to JSON validation display
const validationIcon = jsonValidation.querySelector('i');
const validationText = jsonValidation.querySelector('span');

/**
 * Validates the JSON string from the input editor.
 * Updates UI elements based on whether JSON is valid, invalid, or empty.
 * @param {object} jsonInput - The editor instance containing JSON text.
 * @returns {boolean} - True if JSON is valid, false otherwise.
 */
export function validateJson(jsonInput) {
    // Get the JSON string from the editor
    const json = jsonInput.getValue();

    // Reset validation UI classes
    jsonValidation.classList.remove(CONSTANTS.CLASS_VALID, CONSTANTS.CLASS_INVALID, CONSTANTS.CLASS_EMPTY);

    // Handle empty input case
    if (!json) {
        jsonValidation.classList.add(CONSTANTS.CLASS_EMPTY); // Show empty state style
        validationIcon.className = CONSTANTS.ICON_INFO;     // Info icon
        validationText.textContent = 'Enter JSON to validate'; // Prompt user
        return false;
    }

    try {
        JSON.parse(json);      // Try to parse JSON to check validity
        updateStatsUI(json);   // If valid, update statistics display
        jsonValidation.classList.add(CONSTANTS.CLASS_VALID);   // Show valid state style
        validationIcon.className = CONSTANTS.ICON_VALID;       // Success icon
        validationText.textContent = 'Valid JSON';             // Confirmation message
        return true;
    } catch (e) {
        // If JSON parsing fails, show error UI and message
        jsonValidation.classList.add(CONSTANTS.CLASS_INVALID); // Show invalid state style
        validationIcon.className = CONSTANTS.ICON_INVALID;     // Error icon
        validationText.textContent = 'Invalid JSON: ' + e.message; // Show error details
        return false;
    }
}

/**
 * Updates the UI with statistics about the JSON input.
 * @param {string} rawJson - The JSON string to analyze.
 */
function updateStatsUI(rawJson) {
    const json = JSON.parse(rawJson);           // Parse the JSON string into an object
    const stats = analyzeJsonStats(json);       // Get stats from helper function

    // Map stats to their corresponding element IDs in the DOM
    const statsMap = {
        keyCount: stats.keyCount,
        depthCount: stats.depthCount,
        objectCount: stats.objectCount,
        arrayCount: stats.arrayCount,
        stringCount: stats.stringCount,
        numberCount: stats.numberCount,
        booleanCount: stats.booleanCount,
        nullCount: stats.nullCount,
        charCount: stats.charCount,
        byteSize: stats.byteSizeKB
    };

    // Update each stats display element's text with the new value
    for (const [id, value] of Object.entries(statsMap)) {
        document.getElementById(id).textContent = value;
    }
}
