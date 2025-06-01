
import { analyzeJsonStats } from './jsonStats.js';
import * as CONSTANTS from '/config/constants.js'

// Constants for DOM elements
const validationIcon = jsonValidation.querySelector('i');
const validationText = jsonValidation.querySelector('span');

export function validateJson(jsonInput) {
    const json = jsonInput.getValue();

    jsonValidation.classList.remove(CONSTANTS.CLASS_VALID, CONSTANTS.CLASS_INVALID, CONSTANTS.CLASS_EMPTY);

    if (!json) {
        jsonValidation.classList.add(CONSTANTS.CLASS_EMPTY);
        validationIcon.className = CONSTANTS.ICON_INFO;
        validationText.textContent = 'Enter JSON to validate';
        return false;
    }

    try {
        JSON.parse(json);
        updateStatsUI(json);
        jsonValidation.classList.add(CONSTANTS.CLASS_VALID);
        validationIcon.className = CONSTANTS.ICON_VALID;
        validationText.textContent = 'Valid JSON';
        return true;
    } catch (e) {
        jsonValidation.classList.add(CONSTANTS.CLASS_INVALID);
        validationIcon.className = CONSTANTS.ICON_INVALID;
        validationText.textContent = 'Invalid JSON: ' + e.message;
        return false;
    }
}

function updateStatsUI(rawJson) {
    const json = JSON.parse(rawJson);
    const stats = analyzeJsonStats(json);
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

    for (const [id, value] of Object.entries(statsMap)) {
        document.getElementById(id).textContent = value;
    }

}
