import { setupThemeToggle } from './scripts/theme-toggle.js';
import { analyzeJsonStats } from './scripts/jsonStats.js';
import { downloadZip } from './scripts/downloadHelper.js';
import { showToast } from './scripts/toast.js';
import { validateJson } from './scripts/validateJson.js';
import * as CONSTANTS from './config/constants.js';

require.config({ paths: { vs: 'libs/monaco/vs' } });

require(['vs/editor/editor.main'], function () {

    let mainApexCode = '';
    let testApexCode = '';
    let mainClassName = CONSTANTS.DEFAULT_CLASS_NAME;
    let authorName = CONSTANTS.DEFAULT_AUTHOR_NAME;

    // Create JSON input Monaco editor
    window.jsonInput = monaco.editor.create(document.getElementById('jsonEditor'), CONSTANTS.JSON_INPUT_CONFIG);

    // Create Apex output Monaco editor (readonly)
    window.apexOutput = monaco.editor.create(document.getElementById('apexEditor'), CONSTANTS.APEX_OUTPUT_CONFIG);

    // Create Test Apex Monaco editor (readonly), initially empty
    window.testApexOutput = monaco.editor.create(document.getElementById('testApexEditor'), CONSTANTS.TEST_APEX_OUTPUT_CONFIG);

    setupThemeToggle(monaco.editor);

    // Show error messages
    const errorElem = document.getElementById('error');
    function showError(msg) {
        if (errorElem) {
            errorElem.textContent = msg;
            errorElem.classList.add('visible'); // Show error
        }
    }

    function clearError() {
        if (errorElem) {
            errorElem.textContent = '';
            errorElem.classList.remove('visible'); // Hide error
        }
    }

    const apexClassNameInput = document.getElementById('classNameInput');
    apexClassNameInput.setAttribute('value', mainClassName);

    // Trigger convert when class name changes and JSON is valid
    apexClassNameInput.addEventListener('input', () => {
        if (validateJson()) {
            convertJsonToApex(true);
        }
    });

    const authorNameInput = document.getElementById('authorName');
    authorNameInput.setAttribute('value', authorName);

    authorNameInput.addEventListener('input', () => {
        if (validateJson()) {
            convertJsonToApex(true);
        }
    });


    // Function to convert JSON input to Apex classes and update output editor
    function convertJsonToApex(auto = false) {
        clearError();
        const jsonText = window.jsonInput.getValue();

        if (!jsonText.trim()) {
            showError('Input JSON is empty');
            showToast('No JSON Found', 'Input JSON is empty.', 'error');
            window.apexOutput.setValue('');
            window.testApexOutput.setValue('');
            mainApexCode = '';
            testApexCode = '';
            return;
        }

        const className = document.getElementById('classNameInput').value.trim() || mainClassName;
        const authorName = document.getElementById('authorName').value.trim() || authorName;

        try {
            const json = JSON.parse(jsonText);
            mainApexCode = window.jsonToApex(json, className, authorName);
            testApexCode = window.generateTestClass(className, jsonText, authorName);

            window.apexOutput.setValue(mainApexCode);
            window.testApexOutput.setValue(testApexCode);
            clearError();

            if (!auto) {
                showToast('Conversion Complete', 'Your JSON has been converted to Apex code', 'success');
            }
        } catch (e) {
            showToast('Invalid JSON', e.message, 'error');
            showError('Invalid JSON: ' + e.message);
            window.apexOutput.setValue('');
            window.testApexOutput.setValue('');
            mainApexCode = '';
            testApexCode = '';
        }
    }

    // 🔁 Re-trigger conversion on setting changes
    [
        'addToString',
        'addClone',
        'addIsEmpty',
        'addEquals',
        'addAuraEnabled',
        'addComments',
        'authorName'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                if (validateJson()) {
                    convertJsonToApex(true);
                }
            });
        }
    });

    // Wire convert button click to conversion function
    document.getElementById('convertBtn').addEventListener('click', convertJsonToApex);

    // Wire copy button
    document.getElementById('copyBtn').addEventListener('click', () => {
        if (!mainApexCode) {
            showToast('Nothing to Copy', 'Please generate some Apex class first', 'error');
            return;
        }
        navigator.clipboard.writeText(mainApexCode + '\n\n' + testApexCode).then(() => {
            showToast('Apex Code Copied', 'Main and Test Class copied to clipboard', 'success');
        }).catch((err) => {
            showToast('Copy failed', err.message, 'error');
        });
    });

    // Wire download button
    document.getElementById('downloadBtn').addEventListener('click', async () => {
        const inputJsonString = window.jsonInput.getValue();
        const stats = analyzeJsonStats(JSON.parse(inputJsonString));

        downloadZip(mainClassName, mainApexCode, testApexCode, inputJsonString, stats, showToast);
    });

    // Auto convert sample JSON once editors are ready
    convertJsonToApex(true);

    // Validate when user edits the JSON
    window.jsonInput.onDidChangeModelContent(() => {
        validateJson(window.jsonInput);
    });

    // Validate once on page load (for default JSON)
    validateJson(window.jsonInput);

    // jsonInput.addEventListener('input', validateJson);

    document.getElementById('formatJsonBtn').addEventListener('click', () => {
        try {
            const rawText = window.jsonInput.getValue();
            if (!rawText) {
                showToast('Nothing to Format', 'Please enter some JSON first', 'error');
                return;
            }
            const parsed = JSON.parse(rawText);
            const formatted = JSON.stringify(parsed, null, 2);
            window.jsonInput.setValue(formatted);
            showToast('JSON Formatted', 'Your JSON has been beautifully formatted', 'success');
        } catch (e) {
            showToast('Invalid JSON', e.message, 'error');
        }
    });

    // console.log(document.getElementById('copyJsonBtn'));
    document.getElementById('copyJsonBtn').addEventListener('click', () => {
        // console.log('copyJsonBtn');
        const jsonText = window.jsonInput.getValue();
        if (!jsonText.trim()) {
            showToast('Nothing to Copy', 'Please enter some JSON first', 'error');
            return;
        }

        navigator.clipboard.writeText(jsonText).then(() => {
            showToast('JSON Copied', 'JSON copied to clipboard', 'success');
        }).catch((err) => {
            showToast('Copy failed', err.message, 'error');
        });
    });

    // Copy main Apex class only
    document.getElementById('copyMainApexBtn').addEventListener('click', () => {
        if (!mainApexCode) {
            showToast('Nothing to Copy', 'Please generate some Apex class first', 'error');
            return;
        }
        navigator.clipboard.writeText(mainApexCode).then(() => {
            showToast('Apex Code Copied', 'Main class copied to clipboard', 'success');
        }).catch((err) => {
            showToast('Copy failed', err.message, 'error');
        });
    });

    // Copy test class only
    document.getElementById('copyTestClassBtn').addEventListener('click', () => {
        if (!testApexCode) {
            showToast('Nothing to Copy', 'Please generate some Test class first', 'error');
            return;
        }
        navigator.clipboard.writeText(testApexCode).then(() => {
            showToast('Test Code Copied', 'Test class copied to clipboard', 'success');
        }).catch((err) => {
            showToast('Copy failed', err.message, 'error');
        });
    });

    // Tab switching functionality
    const tabs = document.querySelectorAll('.tab');
    const outputSections = document.querySelectorAll('.output-section');

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and sections
            tabs.forEach(t => t.classList.remove('active'));
            outputSections.forEach(s => s.classList.remove('active'));

            // Add active class to clicked tab and corresponding section
            tab.classList.add('active');
            outputSections[index].classList.add('active');
        });
    });

    const clearJsonBtn = document.getElementById('clearJsonBtn');
    clearJsonBtn.addEventListener('click', () => {
        const jsonText = window.jsonInput.getValue();
        if (!jsonText) {
            showToast('Already Empty', 'Nothing to clear', 'info');
            return;
        }
        window.jsonInput.setValue('');
        validateJson();

        // Add a small animation to indicate clearing
        clearJsonBtn.classList.add('active');
        setTimeout(() => {
            clearJsonBtn.classList.remove('active');
        }, 300);
        showToast('Cleared', 'JSON input has been cleared', 'info');
    });

    const minifyJsonBtn = document.getElementById('minifyJsonBtn');
    // Minify JSON button
    minifyJsonBtn.addEventListener('click', () => {
        const json = jsonInput.getValue();
        if (!json) {
            showToast('Nothing to Minify', 'Please enter some JSON first', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(json);
            const jsonMinify = JSON.stringify(parsed);
            window.jsonInput.setValue(jsonMinify);
            validateJson();

            // Add a small animation to indicate minifying
            const originalIcon = minifyJsonBtn.innerHTML;
            minifyJsonBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                minifyJsonBtn.innerHTML = originalIcon;
            }, 1000);

            showToast('JSON Minified', 'Your JSON is now compact and ready to go', 'success');
        } catch (e) {
            // If JSON is invalid, validation will show the error
            validateJson();
            showToast('Invalid JSON', e.message, 'error');
        }
    });

    // Advanced Settings Toggle
    const advancedSettingsBtn = document.getElementById('advancedSettingsBtn');
    const advancedSettings = document.getElementById('advancedSettings');

    advancedSettingsBtn.addEventListener('click', () => {
        advancedSettings.classList.toggle('show');

        // Change button style when toggled
        if (advancedSettings.classList.contains('show')) {
            advancedSettingsBtn.classList.add('active');
            advancedSettingsBtn.innerHTML = '<i class="fas fa-times"></i> Hide Tools';
            // showToast('Power Tools Activated', 'Customize your code generation', 'info');
        } else {
            advancedSettingsBtn.classList.remove('active');
            advancedSettingsBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Power Tools';
        }
    });

    // Stats toggle functionality
    const statsToggleBtn = document.getElementById('statsToggleBtn');
    const jsonStatsSection = document.getElementById('jsonStatsSection');
    const statsToggleText = document.getElementById('statsToggleText');

    statsToggleBtn.addEventListener('click', () => {
        jsonStatsSection.classList.toggle('show');
        statsToggleBtn.classList.toggle('active');

        if (jsonStatsSection.classList.contains('show')) {
            statsToggleText.textContent = 'Hide Stats';
        } else {
            statsToggleText.textContent = 'Stats';
        }
    });

    
    document.getElementById('copyJsonStats').addEventListener('click', () => {
        const stats = {
            keyCount: document.getElementById('keyCount').textContent,
            depthCount: document.getElementById('depthCount').textContent,
            objectCount: document.getElementById('objectCount').textContent,
            arrayCount: document.getElementById('arrayCount').textContent,
            stringCount: document.getElementById('stringCount').textContent,
            numberCount: document.getElementById('numberCount').textContent,
            booleanCount: document.getElementById('booleanCount').textContent,
            nullCount: document.getElementById('nullCount').textContent,
            charCount: document.getElementById('charCount').textContent,
            byteSizeKB: document.getElementById('byteSize').textContent
        };

        navigator.clipboard.writeText(JSON.stringify(stats, null, 2))
            .then(() => showToast('JSON Stats Copied.', 'JSON Stats Copied to clipboard.', 'success'))
            .catch(err => showToast('Copy Failed', err.message, 'error'));
    });

});
