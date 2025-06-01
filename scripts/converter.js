function jsonToApex(json, rootClassName = 'MyCustomClass', authorName = 'Your Name') {
    const addAuraEnabled = document.getElementById('addAuraEnabled')?.checked;
    const addToString = document.getElementById('addToString')?.checked;
    const addClone = document.getElementById('addClone')?.checked;
    const addIsEmpty = document.getElementById('addIsEmpty')?.checked;
    const addEquals = document.getElementById('addEquals')?.checked;
    const addComments = document.getElementById('addComments')?.checked;

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Holds nested classes: {name: string, body: string}
    const nestedClasses = [];

    // Generate fields string for a given object
    // if isNested=true, include @AuraEnabled for fields only if selected,
    // otherwise also include @AuraEnabled on nested class declarations and root class fields
    function generateFields(obj, isNested = false) {
        return Object.entries(obj).map(([key, val]) => {
            let type;
            if (val === null) {
                type = 'Object';
            } else if (Array.isArray(val)) {
                if (val.length > 0 && typeof val[0] === 'object') {
                    type = `List<${capitalize(key)}>`;
                } else {
                    type = 'List<Object>';
                }
            } else {
                switch (typeof val) {
                    case 'string': type = 'String'; break;
                    case 'number': type = 'Decimal'; break;
                    case 'boolean': type = 'Boolean'; break;
                    case 'object': type = capitalize(key); break;
                    default: type = 'Object';
                }
            }

            // Field-level @AuraEnabled if selected
            const aura = addAuraEnabled ? '@AuraEnabled ' : '';
            return `${aura}public ${type} ${key} { get; set; }`;
        }).join('\n        ');
    }

    // Recursively generate nested classes from JSON object
    function generateNestedClasses(obj) {
        for (const key in obj) {
            const val = obj[key];
            if (val === null) continue;

            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
                const className = capitalize(key);
                if (!nestedClasses.find(c => c.name === className)) {
                    generateNestedClasses(val[0]);
                    const body = generateFields(val[0], true);
                    nestedClasses.push({
                        name: className,
                        body,
                    });
                }
            } else if (typeof val === 'object') {
                const className = capitalize(key);
                if (!nestedClasses.find(c => c.name === className)) {
                    generateNestedClasses(val);
                    const body = generateFields(val, true);
                    nestedClasses.push({
                        name: className,
                        body,
                    });
                }
            }
        }
    }

    generateNestedClasses(json);

    // Generate root class fields: primitive types + nested object fields with nested class types
    // For nested object fields, use the nested class name as type, include @AuraEnabled if selected
    function generateRootFields(obj) {
        return Object.entries(obj).map(([key, val]) => {
            let type;
            if (val === null) {
                type = 'Object';
            } else if (Array.isArray(val)) {
                if (val.length > 0 && typeof val[0] === 'object') {
                    type = `List<${capitalize(key)}>`;
                } else {
                    type = 'List<Object>';
                }
            } else {
                switch (typeof val) {
                    case 'string': type = 'String'; break;
                    case 'number': type = 'Decimal'; break;
                    case 'boolean': type = 'Boolean'; break;
                    case 'object': type = capitalize(key); break;
                    default: type = 'Object';
                }
            }
            const aura = addAuraEnabled ? '@AuraEnabled ' : '';
            return `${aura}public ${type} ${key} { get; set; }`;
        }).join('\n    ');
    }

    const nestedClassCode = nestedClasses.map(cls =>
        `    public class ${cls.name} {\n        ${cls.body}\n    }`
    ).join('\n');

    const rootFields = generateRootFields(json);

    function generateComment(description) {
        return addComments ? `/**\n * ${description}\n */` : '';
    }

    const utilityMethodsParts = [
        `${generateComment('Parses the JSON string and returns an instance of the class')}
public static ${rootClassName} parse(String json) {
    try {
        return (${rootClassName}) System.JSON.deserialize(json, ${rootClassName}.class);
    } catch (Exception e) {
        System.debug('JSON parsing error: ' + e.getMessage());
        throw new JSONException('Invalid JSON format for ${rootClassName}');
    }
}

${generateComment('Serializes the current instance to a JSON string')}
public String serialize() {
    try {
        return System.JSON.serialize(this);
    } catch (Exception e) {
        System.debug('JSON serialization error: ' + e.getMessage());
        return null;
    }
}

public class JSONException extends Exception {}`,

        addEquals ? `${generateComment('Checks equality by comparing JSON serialization')}
public Boolean equals(Object obj) {
    return obj != null && obj instanceof ${rootClassName} &&
        this.serialize() == ((${rootClassName})obj).serialize();
}` : '',

        addClone ? `${generateComment('Creates a deep clone of the current instance')}
public ${rootClassName} clone() {
    return parse(serialize());
}` : '',

        addIsEmpty ? `${generateComment('Checks if the serialized JSON is empty')}
public Boolean isEmpty() {
    return serialize() == '{}' || serialize() == null;
}` : '',

        addToString ? `${generateComment('Returns the JSON serialization as a string representation')}
public String toString() {
    return serialize();
}` : '',
    ];

    const utilityMethods = utilityMethodsParts
        .map(part => part.trim())
        .filter(Boolean)
        .join('\n\n');


    const commentHeader = addComments
        ? `/**
 * This class is auto-generated from JSON
${authorName ? ` * Author: ${authorName}` : ''}
 */\n`
        : '';


    const rootClass = `${commentHeader}public class ${rootClassName} {\n\n${nestedClassCode}\n\n    ${rootFields}\n\n${utilityMethods.trim().replace(/^/gm, '    ')}\n}`;

    return rootClass;
}

function generateTestClass(mainClassName = 'GeneratedClass', originalJson = '{}') {
    const rawJson = typeof originalJson === 'string' ? originalJson.trim() : JSON.stringify(originalJson);

    const escapedJson = rawJson
        .replace(/\\/g, '\\\\')   // escape backslashes
        .replace(/"/g, '\\"')     // escape double quotes
        .replace(/\r?\n/g, '\\n'); // escape newlines

    return `@isTest
public class ${mainClassName}Test {
    @isTest
    static void testFromJson() {
        String jsonInput = "${escapedJson}";
        ${mainClassName} obj = (${mainClassName})JSON.deserialize(jsonInput, ${mainClassName}.class);
        System.assertNotEquals(null, obj);
    }
}`;
}

function generateTestClass(mainClassName = 'GeneratedClass', originalJson = '{}', authorName = '', options = {}) {
    const addAuraEnabled = document.getElementById('addAuraEnabled')?.checked;
    const addToString = document.getElementById('addToString')?.checked;
    const addClone = document.getElementById('addClone')?.checked;
    const addIsEmpty = document.getElementById('addIsEmpty')?.checked;
    const addEquals = document.getElementById('addEquals')?.checked;
    const addComments = document.getElementById('addComments')?.checked;

    const rawJson = typeof originalJson === 'string' ? originalJson.trim() : JSON.stringify(originalJson, null, 2);

    const escapedJson = rawJson
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\r?\n/g, '\\n');

    const classComment = addComments
        ? `/**
 * This is a test class for ${mainClassName}
${authorName ? ` * Author: ${authorName}\n` : ''} * Auto-generated by the JSON to Apex tool
 */\n`
        : '';

    function methodComment(text) {
        return addComments ? `    /**
     * ${text}
     */\n` : '';
    }

    let methods = `
${methodComment(`Tests deserialization from JSON to ${mainClassName}`)}    @isTest
    static void testFromJson() {
        String jsonInput = "${escapedJson}";
        ${mainClassName} obj = (${mainClassName})JSON.deserialize(jsonInput, ${mainClassName}.class);
        System.assertNotEquals(null, obj);
    }
`;

    if (addToString) {
        methods += `
${methodComment(`Tests the toString method of ${mainClassName}`)}    @isTest
    static void testToString() {
        ${mainClassName} obj = new ${mainClassName}();
        System.assertNotEquals(null, obj.toString());
    }
`;
    }

    if (addClone) {
        methods += `
${methodComment(`Tests the clone method of ${mainClassName}`)}    @isTest
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
${methodComment(`Tests the isEmpty method of ${mainClassName}`)}    @isTest
    static void testIsEmpty() {
        ${mainClassName} obj = new ${mainClassName}();
        System.assertEquals(true, obj.isEmpty());
    }
`;
    }

    if (addEquals) {
    methods += `
${methodComment(`Tests the equals and hashCode methods of ${mainClassName}`)}    @isTest
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
${methodComment(`Tests serialization of ${mainClassName} using JSON for Aura compatibility`)}    @isTest
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
