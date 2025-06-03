/**
 * Analyzes a JSON object and counts different types of data inside it.
 * It also measures how deep the JSON structure goes and how big the JSON is.
 *
 * @param {any} json - The JSON object to analyze.
 * @returns {object} - An object with counts of keys, objects, arrays, and value types, plus size info.
 */
export function analyzeJsonStats(json) {
    // Initialize all counts to zero
    let keyCount = 0;       // Number of keys in all objects
    let depthCount = 0;     // Maximum depth (levels) in the JSON structure
    let objectCount = 0;    // Number of objects found
    let arrayCount = 0;     // Number of arrays found
    let stringCount = 0;    // Number of string values found
    let numberCount = 0;    // Number of number values found
    let booleanCount = 0;   // Number of boolean values found
    let nullCount = 0;      // Number of null values found

    /**
     * Recursively goes through the JSON structure to count keys, types, and depth.
     *
     * @param {any} node - Current part of the JSON being inspected.
     * @param {number} depth - Current depth level (starts from 0).
     */
    function traverse(node, depth = 0) {
        // Update max depth if this is deeper
        if (depth > depthCount) depthCount = depth;

        // If the current node is an array
        if (Array.isArray(node)) {
            arrayCount++;   // Count this array
            // Go through each item in the array recursively, increasing depth by 1
            for (const item of node) {
                traverse(item, depth + 1);
            }

        // If the current node is an object (and not null)
        } else if (node !== null && typeof node === 'object') {
            objectCount++;  // Count this object
            // Go through each key-value pair in the object
            for (const key in node) {
                keyCount++;            // Count this key
                traverse(node[key], depth + 1);  // Recursively check the value
            }

        // If the node is a value (string, number, boolean, or null)
        } else {
            // Increase the count depending on the type of value
            switch (typeof node) {
                case 'string': stringCount++; break;
                case 'number': numberCount++; break;
                case 'boolean': booleanCount++; break;
                case 'object': 
                    if (node === null) nullCount++; 
                    break;
            }
        }
    }

    // Try to start traversing the JSON input
    try {
        traverse(json);
    } catch (e) {
        // If something goes wrong, return zeros and empty stats
        return {
            keyCount: 0, depthCount: 0, objectCount: 0, arrayCount: 0,
            stringCount: 0, numberCount: 0, booleanCount: 0, nullCount: 0,
            charCount: 0, byteSizeKB: "0.00"
        };
    }

    // Convert JSON to string to measure characters and size in bytes
    const jsonString = JSON.stringify(json);

    // Calculate the size in bytes using Blob and convert to KB
    const byteSize = new Blob([jsonString]).size;

    // Return all the collected stats
    return {
        keyCount,
        depthCount,
        objectCount,
        arrayCount,
        stringCount,
        numberCount,
        booleanCount,
        nullCount,
        charCount: jsonString.length,          // Number of characters in JSON string
        byteSizeKB: (byteSize / 1024).toFixed(2)  // Size in kilobytes (2 decimal places)
    };
}
