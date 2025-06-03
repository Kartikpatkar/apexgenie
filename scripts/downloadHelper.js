/**
 * Downloads multiple files as a ZIP archive.
 * It includes Apex classes, input JSON, and stats.
 *
 * @param {string} mainClassName - The main Apex class name.
 * @param {string} mainApexCode - The source code of the main Apex class.
 * @param {string} testApexCode - The source code of the test Apex class.
 * @param {string} inputJsonString - The input JSON as a string.
 * @param {object} statsObj - An object with stats information.
 * @param {function} showToast - Function to show messages to the user.
 */
export async function downloadZip(mainClassName, mainApexCode, testApexCode, inputJsonString, statsObj, showToast) {
    // Check if there is any Apex code to download
    if (!mainApexCode) {
        showToast('Error', 'Nothing to download!', 'error');
        return;
    }

    // Check if JSZip library is loaded (used for creating ZIP files)
    if (typeof JSZip === 'undefined') {
        showToast('Error', 'JSZip library not loaded!', 'error');
        return;
    }

    // Create a new ZIP archive instance
    const zip = new JSZip();

    // Add files to the ZIP archive
    zip.file(`${mainClassName}.cls`, mainApexCode);       // Main Apex class
    zip.file(`${mainClassName}Test.cls`, testApexCode || '');  // Test class (if any)
    zip.file('input.json', inputJsonString);              // Input JSON file
    zip.file('stats.json', JSON.stringify(statsObj, null, 2)); // Stats as pretty JSON

    try {
        // Generate the ZIP content as a Blob (binary large object)
        const content = await zip.generateAsync({ type: 'blob' });

        // Create a URL for the Blob to use as download link
        const url = URL.createObjectURL(content);

        // Create a temporary <a> element to trigger download
        const a = document.createElement('a');
        const fileName = generateZipFileName('JSON_To_Apex', mainClassName);

        a.href = url;          // Set the download link URL
        a.download = fileName; // Set the suggested filename

        document.body.appendChild(a); // Add <a> to page (required)
        a.click();                   // Programmatically click to start download
        document.body.removeChild(a); // Remove the <a> from the page

        // Release the URL object
        URL.revokeObjectURL(url);

        // Notify user that file was downloaded successfully
        showToast('File Downloaded', `${fileName} has been saved`, 'success');
    } catch (err) {
        // Handle any error during ZIP creation or download
        showToast('Error', `Failed to generate ZIP: ${err.message}`, 'error');
    }
}

/**
 * Generates a file name for the ZIP file using a prefix, class name, and timestamp.
 *
 * @param {string} prefix - A prefix string for the file name.
 * @param {string} className - The main class name to include.
 * @returns {string} - A file name with timestamp, e.g. "JSON_To_Apex_MyClass_2025-06-04_12-30-00.zip"
 */
export function generateZipFileName(prefix, className) {
    const now = new Date();

    // Helper function to add leading zeros for single digit numbers
    const pad = n => String(n).padStart(2, '0');

    // Format the current date and time as "YYYY-MM-DD_HH-MM-SS"
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    // Combine parts into the final file name
    return `${prefix}_${className}_${timestamp}.zip`;
}
