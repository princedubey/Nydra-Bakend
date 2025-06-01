"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const apiError_1 = require("../utils/apiError");
// Validation middleware
const validateRequest = (validationRules) => {
    return (req, res, next) => {
        const errors = [];
        // Check each field
        validationRules.forEach((validation) => {
            const { field, rules } = validation;
            const value = req.body[field];
            // Check each rule
            rules.forEach((rule) => {
                // Required rule
                if (rule === 'required' && (value === undefined || value === '')) {
                    errors.push(`${field} is required`);
                }
                // Email validation
                if (rule === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
                    errors.push(`${field} must be a valid email`);
                }
                // Min length validation
                if (rule.startsWith('min:') && value) {
                    const minLength = parseInt(rule.split(':')[1]);
                    if (value.length < minLength) {
                        errors.push(`${field} must be at least ${minLength} characters long`);
                    }
                }
                // Boolean validation
                if (rule === 'boolean' && value !== undefined) {
                    if (typeof value !== 'boolean') {
                        errors.push(`${field} must be a boolean`);
                    }
                }
                // Enum validation
                if (rule.startsWith('in:') && value) {
                    const allowedValues = rule.split(':')[1].split(',');
                    if (!allowedValues.includes(value)) {
                        errors.push(`${field} must be one of: ${allowedValues.join(', ')}`);
                    }
                }
            });
        });
        // If there are errors, return 400 with errors
        if (errors.length > 0) {
            return next(new apiError_1.ApiError(errors.join(', '), 400));
        }
        next();
    };
};
exports.validateRequest = validateRequest;
