/**
 * Downloads Apex classes, input JSON, and stats as a zip file.
 */
export async function downloadZip(mainClassName, mainApexCode, testApexCode, inputJsonString, statsObj, showToast) {
    if (!mainApexCode) {
        showToast('Error', 'Nothing to download!', 'error');
        return;
    }

    if (typeof JSZip === 'undefined') {
        showToast('Error', 'JSZip library not loaded!', 'error');
        return;
    }

    const zip = new JSZip();

    zip.file(`${mainClassName}.cls`, mainApexCode);
    zip.file(`${mainClassName}Test.cls`, testApexCode || '');
    zip.file('input.json', inputJsonString);
    zip.file('stats.json', JSON.stringify(statsObj, null, 2));

    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        const fileName = generateZipFileName('JSON_To_Apex', mainClassName);
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('File Downloaded', `${fileName} has been saved`, 'success');
    } catch (err) {
        showToast('Error', `Failed to generate ZIP: ${err.message}`, 'error');
    }
}

export function generateZipFileName(prefix, className) {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `${prefix}_${className}_${timestamp}.zip`;
}