// Enhanced JSON to Apex Generator with better type inference
function jsonToApex(json, rootClassName = 'MyCustomClass', authorName = 'Your Name') {
    // UI option toggles with default fallback to false
    const addAuraEnabled = document.getElementById('addAuraEnabled')?.checked || false;
    const addToString = document.getElementById('addToString')?.checked || false;
    const addClone = document.getElementById('addClone')?.checked || false;
    const addIsEmpty = document.getElementById('addIsEmpty')?.checked || false;
    const addEquals = document.getElementById('addEquals')?.checked || false;
    const addComments = document.getElementById('addComments')?.checked || false;

    // Capitalize first letter for class names
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Detect ISO 8601 date string (very common format)
    function isIsoDateString(value) {
        return typeof value === 'string' &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value);
    }

    // Infer Apex type from JS value and key context
    function inferApexType(val, key) {
        if (val === null) return 'Object';

        if (isIsoDateString(val)) return 'DateTime';

        if (Array.isArray(val)) {
            if (val.length === 0) {
                // Empty array - fallback to List<Object> with comment in generated code
                return 'List<Object>';
            }

            const firstType = inferApexType(val[0], key);

            // Array of primitives
            if (['String', 'Integer', 'Decimal', 'Boolean', 'DateTime'].includes(firstType)) {
                return `List<${firstType}>`;
            }

            // Array of complex objects → List<NestedClass>
            return `List<${capitalize(key)}>`;
        }

        switch (typeof val) {
            case 'string': return 'String';
            case 'number':
                // Distinguish Integer vs Decimal
                return Number.isInteger(val) ? 'Integer' : 'Decimal';
            case 'boolean': return 'Boolean';
            case 'object': return capitalize(key);
            default: return 'Object';
        }
    }

    // Store nested classes with structure signature to avoid duplicates
    const nestedClasses = [];

    /**
     * Generates a unique signature for object structure to detect duplicates
     * Signature = sorted keys joined by comma, helps to detect if two nested classes have same shape
     */
    function getObjectSignature(obj) {
        if (typeof obj !== 'object' || obj === null) return '';
        return Object.keys(obj).sort().join(',');
    }

    /**
     * Recursively generates nested classes from JSON object.
     * Uses signatures to avoid duplicate nested classes of same structure.
     */
    function generateNestedClasses(obj) {
        for (const key in obj) {
            const val = obj[key];
            if (val === null) continue;

            if (Array.isArray(val) && val.length > 0) {
                const firstType = inferApexType(val[0], key);

                if (firstType === capitalize(key)) {
                    const sig = getObjectSignature(val[0]);
                    if (!nestedClasses.some(c => c.name === capitalize(key) && c.signature === sig)) {
                        generateNestedClasses(val[0]);
                        const body = generateFields(val[0], true);
                        nestedClasses.push({ name: capitalize(key), body, signature: sig });
                    }
                }
            } else if (typeof val === 'object') {
                const className = capitalize(key);
                const sig = getObjectSignature(val);
                if (!nestedClasses.some(c => c.name === className && c.signature === sig)) {
                    generateNestedClasses(val);
                    const body = generateFields(val, true);
                    nestedClasses.push({ name: className, body, signature: sig });
                }
            }
        }
    }

    /**
     * Generate Apex fields for a given object.
     * Also triggers nested class generation for nested objects and arrays of objects.
     */
    function generateFields(obj, isNested = false) {
        return Object.entries(obj).map(([key, val]) => {
            const type = inferApexType(val, key);

            // For nested class types, ensure the nested class is generated
            if (type === capitalize(key)) {
                // Nested class already generated in generateNestedClasses, no duplicate here
            } else if (type.startsWith('List<') && val.length > 0 && typeof val[0] === 'object') {
                // Nested class inside list
                // Already handled in generateNestedClasses
            }

            const aura = addAuraEnabled ? '@AuraEnabled ' : '';

            // Add comment for empty list fields to clarify fallback type
            if (type === 'List<Object>') {
                const comment = addComments ? ' // WARNING: empty list - defaulted to List<Object>' : '';
                return `${aura}public ${type} ${key} { get; set; }${comment}`;
            }

            return `${aura}public ${type} ${key} { get; set; }`;
        }).join('\n        ');
    }

    /**
     * Generate fields for root class without nested class generation,
     * since nested classes are generated separately.
     */
    function generateRootFields(obj) {
        return Object.entries(obj).map(([key, val]) => {
            const type = inferApexType(val, key);
            const aura = addAuraEnabled ? '@AuraEnabled ' : '';

            if (type === 'List<Object>') {
                const comment = addComments ? ' // WARNING: empty list - defaulted to List<Object>' : '';
                return `${aura}public ${type} ${key} { get; set; }${comment}`;
            }

            return `${aura}public ${type} ${key} { get; set; }`;
        }).join('\n    ');
    }

    // Generate nested classes first (populates nestedClasses array)
    generateNestedClasses(json);

    // Compose nested classes code
    const nestedClassCode = nestedClasses.map(cls =>
        `    public class ${cls.name} {\n        ${cls.body}\n    }`
    ).join('\n\n');

    // Generate root fields
    const rootFields = generateRootFields(json);

    // Helper to generate comment blocks
    function generateComment(text) {
        return addComments ? `/**\n * ${text}\n */` : '';
    }

    // Add hashCode method (compatible with equals using JSON serialization)
    const hashCodeMethod = `
${generateComment('Generates hash code from JSON serialization')}
public Integer hashCode() {
    return serialize() != null ? serialize().hashCode() : 0;
}
`;

    // Compose utility methods with conditional generation
    const utilityMethodsParts = [
        `${generateComment('Parses JSON string to this class')}
public static ${rootClassName} parse(String json) {
    try {
        return (${rootClassName}) System.JSON.deserialize(json, ${rootClassName}.class);
    } catch (Exception e) {
        System.debug('JSON parsing error: ' + e.getMessage());
        throw new JSONException('Invalid JSON format for ${rootClassName}');
    }
}

${generateComment('Serializes this instance to JSON string')}
public String serialize() {
    try {
        return System.JSON.serialize(this);
    } catch (Exception e) {
        System.debug('JSON serialization error: ' + e.getMessage());
        return null;
    }
}

public class JSONException extends Exception {}`,
        addEquals ? `
${generateComment('Compares equality by JSON serialization')}
public Boolean equals(Object obj) {
    return obj != null && obj instanceof ${rootClassName} &&
        this.serialize() == ((${rootClassName})obj).serialize();
}

${hashCodeMethod}
` : '',
        addClone ? `
${generateComment('Creates deep clone of this instance')}
public ${rootClassName} clone() {
    return parse(serialize());
}` : '',
        addIsEmpty ? `
${generateComment('Checks if JSON serialization is empty')}
public Boolean isEmpty() {
    return serialize() == '{}' || serialize() == null;
}` : '',
        addToString ? `
${generateComment('Returns JSON string representation')}
public String toString() {
    return serialize();
}` : '',
    ];

    const utilityMethods = utilityMethodsParts.filter(Boolean).join('\n\n');

    // Header comment block for the class
    const commentHeader = addComments
        ? `/**
 * This class is auto-generated from JSON
${authorName ? ` * Author: ${authorName}` : ''}
 */
`
        : '';

    // Compose full class source code
    const rootClass = `${commentHeader}public class ${rootClassName} {

${nestedClassCode}

    ${rootFields}

${utilityMethods.replace(/^/gm, '    ')}
}`;

    return rootClass;
}

function generateTestClass(mainClassName = 'GeneratedClass', originalJson = '{}', authorName = '', options = {}) {
    const addAuraEnabled = document.getElementById('addAuraEnabled')?.checked;
    const addToString = document.getElementById('addToString')?.checked;
    const addClone = document.getElementById('addClone')?.checked;
    const addIsEmpty = document.getElementById('addIsEmpty')?.checked;
    const addEquals = document.getElementById('addEquals')?.checked;
    const addComments = document.getElementById('addComments')?.checked;

    const rawJson = typeof originalJson === 'string' ? originalJson.trim() : JSON.stringify(originalJson, null, 2);

    // Escape JSON string for use in Apex test class
    const escapedJson = rawJson
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r?\n/g, '\\n');

    const classComment = addComments
        ? `/**
 * Test class for ${mainClassName}
${authorName ? ` * Author: ${authorName}\n` : ''} * Auto-generated by JSON-to-Apex tool
 */\n`
        : '';

    const methodComment = (text) =>
        addComments ? `    /**\n     * ${text}\n     */\n` : '';

    let methods = `
${methodComment('Test JSON deserialization')}    @isTest
    static void testFromJson() {
        String jsonInput = "${escapedJson}";
        ${mainClassName} obj = (${mainClassName})JSON.deserialize(jsonInput, ${mainClassName}.class);
        System.assertNotEquals(null, obj);
    }
`;

    if (addToString) {
        methods += `
${methodComment('Test toString method')}    @isTest
    static void testToString() {
        ${mainClassName} obj = new ${mainClassName}();
        System.assertNotEquals(null, obj.toString());
    }
`;
    }

    if (addClone) {
        methods += `
${methodComment('Test clone method')}    @isTest
    static void testClone() {
        ${mainClassName} obj = new ${mainClassName}();
        ${mainClassName} clone = obj.clone();
        System.assertNotEquals(null, clone);
        System.assertNotEquals(obj, clone);
    }
`;
    }

    if (addIsEmpty) {
        methods += `
${methodComment('Test isEmpty method')}    @isTest
    static void testIsEmpty() {
        ${mainClassName} obj = new ${mainClassName}();
        System.assertEquals(true, obj.isEmpty());
    }
`;
    }

    if (addEquals) {
        methods += `
${methodComment('Test equals/hashCode')}    @isTest
    static void testEqualsAndHashCode() {
        ${mainClassName} a = new ${mainClassName}();
        ${mainClassName} b = new ${mainClassName}();
        System.assertEquals(true, a.equals(b));
        System.assertEquals(a.hashCode(), b.hashCode());
    }
`;
    }

    if (addAuraEnabled) {
        methods += `
${methodComment('Test Aura-safe serialization')}    @isTest
    static void testAuraSerialization() {
        ${mainClassName} obj = new ${mainClassName}();
        String serialized = JSON.serialize(obj);
        System.assertNotEquals(null, serialized);
    }
`;
    }

    return `${classComment}@isTest
public class ${mainClassName}Test {${methods}
}`;
}

// Expose globally
window.jsonToApex = jsonToApex;
window.generateTestClass = generateTestClass;
