export function setupThemeToggle(monacoEditor) {
    const html = document.documentElement;
    const toggle = document.getElementById('themeToggle');

    if (!toggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
        monacoEditor.setTheme(savedTheme === 'light' ? 'vs-light' : 'vs-dark');
    }

    // Toggle click handler
    toggle.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        monacoEditor.setTheme(current === 'light' ? 'vs-dark' : 'vs-light');
    });
}
