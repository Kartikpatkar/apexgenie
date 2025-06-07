// constants.js
export const DEFAULT_CLASS_NAME = 'MyCustomClass';
export const DEFAULT_AUTHOR_NAME = 'Your Name';

export const SAMPLE_JSON_INPUT = '{\n  "account": {\n    "id": "001xx000003DGbZAAW",\n    "name": "Acme Corp"\n  }\n}';
export const MONACO_LIGHT_THEME = 'vs-light';
export const MONACO_DARK_THEME = 'vs-dark';

export const JSON_INPUT_CONFIG = {
    value: SAMPLE_JSON_INPUT,
    language: 'json',
    automaticLayout: true,
    theme: MONACO_LIGHT_THEME,
    scrollBeyondLastLine: false, 
}
export const APEX_OUTPUT_CONFIG = {
    value: '',
    language: 'apex',
    readOnly: true,
    automaticLayout: true,
    theme: MONACO_LIGHT_THEME,
    lineNumbers: 'off',
    scrollBeyondLastLine: false, 
}
export const TEST_APEX_OUTPUT_CONFIG = {
    value: '',
    language: 'apex',
    readOnly: true,
    automaticLayout: true,
    theme: MONACO_LIGHT_THEME,
    lineNumbers: 'off',
    scrollBeyondLastLine: false, 
}

// CSS class constants
export const CLASS_VALID = 'valid';
export const CLASS_INVALID = 'invalid';
export const CLASS_EMPTY = 'empty';

// Icon class constants
export const ICON_INFO = 'fas fa-info-circle';
export const ICON_VALID = 'fas fa-check-circle';
export const ICON_INVALID = 'fas fa-exclamation-circle';

export const TOAST_DURATION = 3000;

export const UI_TEXTS = {
    successTitle: 'Success!',
    errorTitle: 'Error!',
    convertSuccess: 'Apex classes generated successfully.',
    zipReady: 'ZIP file is ready for download.',
    invalidJson: 'The JSON provided is not valid.',
};

export const AUTHOR = {
    name: "Kartik Patkar",
    github: "https://github.com/Kartikpatkar/apexgenie",
    linkedin: "https://www.linkedin.com/in/kartik-patkar",
    trailhead: "https://www.salesforce.com/trailblazer/kpatkar1",
    email: "kartikkp.assets@gmail.com",
};

export const TITLE = 'ApexGenie - JSON to Apex Converter';
export const SUBTITLE = 'Convert JSON to Apex classes and test classes with ease';
export const TAGLINE = 'A powerful tool to convert JSON to Salesforce Apex classes with ease. Save time and focus on building amazing applications.';
export const COPYRIGHT = 'ApexGenie - JSON to Apex Converter for Salesforce Developers. All rights reserved.';