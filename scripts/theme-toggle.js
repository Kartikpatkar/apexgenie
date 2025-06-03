/**
 * Sets up a button to toggle between light and dark themes.
 * Saves the chosen theme in localStorage to remember it on reload.
 * Updates the Monaco Editor theme accordingly.
 *
 * @param {object} monacoEditor - The Monaco Editor instance to update the theme for.
 */
export function setupThemeToggle(monacoEditor) {
    const html = document.documentElement;           // Get the <html> element
    const toggle = document.getElementById('themeToggle');  // Find the theme toggle button by its ID

    if (!toggle) return;  // If button not found, stop here

    // Check if a theme is saved from before
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        // Apply the saved theme as an attribute on <html> (used for CSS)
        html.setAttribute('data-theme', savedTheme);

        // Set Monaco Editor's theme to match saved theme
        monacoEditor.setTheme(savedTheme === 'light' ? 'vs-light' : 'vs-dark');
    }

    // When the toggle button is clicked...
    toggle.addEventListener('click', () => {
        // Get the current theme from <html> attribute
        const current = html.getAttribute('data-theme');

        // Decide the next theme: switch light to dark, or dark to light
        const next = current === 'light' ? 'dark' : 'light';

        // Update the <html> attribute to the new theme
        html.setAttribute('data-theme', next);

        // Save the new theme in localStorage so it persists on page reload
        localStorage.setItem('theme', next);

        // Update the Monaco Editor theme to match the new theme
        monacoEditor.setTheme(current === 'light' ? 'vs-dark' : 'vs-light');
    });
}
