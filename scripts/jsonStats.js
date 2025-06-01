export function analyzeJsonStats(json) {
    let keyCount = 0;
    let depthCount = 0;
    let objectCount = 0;
    let arrayCount = 0;
    let stringCount = 0;
    let numberCount = 0;
    let booleanCount = 0;
    let nullCount = 0;

    function traverse(node, depth = 0) {
        if (depth > depthCount) depthCount = depth;

        if (Array.isArray(node)) {
            arrayCount++;
            for (const item of node) {
                traverse(item, depth + 1);
            }
        } else if (node !== null && typeof node === 'object') {
            objectCount++;
            for (const key in node) {
                keyCount++;
                traverse(node[key], depth + 1);
            }
        } else {
            switch (typeof node) {
                case 'string': stringCount++; break;
                case 'number': numberCount++; break;
                case 'boolean': booleanCount++; break;
                case 'object': if (node === null) nullCount++; break;
            }
        }
    }

    try {
        traverse(json);
    } catch (e) {
        return {
            keyCount: 0, depthCount: 0, objectCount: 0, arrayCount: 0,
            stringCount: 0, numberCount: 0, booleanCount: 0, nullCount: 0,
            charCount: 0, byteSizeKB: "0.00"
        };
    }

    const jsonString = JSON.stringify(json);
    const byteSize = new Blob([jsonString]).size;

    return {
        keyCount, depthCount, objectCount, arrayCount,
        stringCount, numberCount, booleanCount, nullCount,
        charCount: jsonString.length,
        byteSizeKB: (byteSize / 1024).toFixed(2)
    };
}
