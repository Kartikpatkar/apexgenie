import { jsonToApex } from '../scripts/converter.js';

export function setupEditor() {
    const convertBtn = document.getElementById('convertBtn');

    convertBtn.addEventListener('click', () => {
        const jsonInput = document.getElementById('jsonInput').value.trim();
        if (!jsonInput) {
            alert('Please enter JSON');
            return;
        }

        let json;
        try {
            json = JSON.parse(jsonInput);
        } catch (e) {
            alert('Invalid JSON:\n' + e.message);
            return;
        }

        const mode = document.querySelector('input[name="mode"]:checked').value;
        const result = jsonToApex(json, 'GeneratedClass', mode === 'enhanced');

        if (window.editor) {
            window.editor.setValue(result);
        } else {
            alert('Editor not initialized yet.');
        }
    });
}
