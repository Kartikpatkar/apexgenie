/**
 * Shows a temporary notification (toast) message on the screen.
 * @param {string} title - The title text of the toast.
 * @param {string} message - The detailed message inside the toast.
 * @param {string} type - The type of toast: 'success' (default), 'error', or 'info'.
 */
export function showToast(title, message, type = 'success') {
    // Find the container where toasts will be shown
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        console.warn('Toast container element with id "toastContainer" not found.');
        return;  // If container is missing, stop the function
    }

    // Create a new div element for the toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // Add CSS classes based on toast type

    // Choose icon based on the toast type
    let iconClass = 'fa-check-circle';  // Default success icon
    if (type === 'error') iconClass = 'fa-exclamation-circle';
    if (type === 'info') iconClass = 'fa-info-circle';

    // Set the inner HTML of the toast with icon, title, message, and close button
    toast.innerHTML = `
        <i class="fas ${iconClass} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add the toast element to the container so it becomes visible
    toastContainer.appendChild(toast);

    // Find the close button inside the toast
    const closeBtn = toast.querySelector('.toast-close');
    // When user clicks the close button, fade out and remove the toast
    closeBtn.addEventListener('click', () => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';  // start fade out animation
        setTimeout(() => {
            toastContainer.removeChild(toast);  // remove toast from DOM after animation
        }, 300); // wait for animation to finish before removing
    });

    // Automatically remove the toast after 3 seconds if not closed already
    setTimeout(() => {
        if (toast.parentNode === toastContainer) {  // check if toast is still visible
            toast.style.animation = 'fadeOut 0.3s ease forwards';  // fade out animation
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toastContainer.removeChild(toast);  // remove after animation
                }
            }, 300);
        }
    }, 3000);
}
