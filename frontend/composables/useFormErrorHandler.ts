/**
 * Form Error Handler Composable
 * Specialized error handling for forms and validation
 */

interface FormError {
    field: string
    message: string
    code?: string
    value?: any
}

interface FormErrorState {
    errors: Record<string, FormError[]>
    hasErrors: boolean
    errorCount: number
    touchedFields: Set<string>
    showErrors: boolean
}

interface FormErrorOptions {
    showOnTouch?: boolean
    showOnSubmit?: boolean
    clearOnInput?: boolean
    scrollToError?: boolean
    focusOnError?: boolean
    fieldLabels?: Record<string, string>
}

export const useFormErrorHandler = (options: FormErrorOptions = {}) => {
    const {
        showOnTouch = true,
        showOnSubmit = true,
        clearOnInput = true,
        scrollToError = true,
        focusOnError = true,
        fieldLabels = {}
    } = options

    // Error handlers imported from utils to avoid circular dependencies

    // State
    const formErrorState = ref<FormErrorState>({
        errors: {},
        hasErrors: false,
        errorCount: 0,
        touchedFields: new Set(),
        showErrors: false
    })

    // Computed
    const errors = computed(() => formErrorState.value.errors)
    const hasErrors = computed(() => formErrorState.value.hasErrors)
    const errorCount = computed(() => formErrorState.value.errorCount)
    const showErrors = computed(() => formErrorState.value.showErrors)

    // Get errors for a specific field
    const getFieldErrors = (field: string): FormError[] => {
        return formErrorState.value.errors[field] || []
    }

    // Check if a field has errors
    const hasFieldError = (field: string): boolean => {
        return getFieldErrors(field).length > 0
    }

    // Get the first error message for a field
    const getFieldError = (field: string): string | null => {
        const fieldErrors = getFieldErrors(field)
        return fieldErrors.length > 0 ? fieldErrors[0].message : null
    }

    // Set errors for a specific field
    const setFieldError = (field: string, message: string, code?: string, value?: any) => {
        const error: FormError = { field, message, code, value }

        if (!formErrorState.value.errors[field]) {
            formErrorState.value.errors[field] = []
        }

        formErrorState.value.errors[field] = [error]
        updateErrorState()
    }

    // Set multiple errors for a field
    const setFieldErrors = (field: string, errors: FormError[]) => {
        formErrorState.value.errors[field] = errors
        updateErrorState()
    }

    // Add an error to a field (without replacing existing ones)
    const addFieldError = (field: string, message: string, code?: string, value?: any) => {
        const error: FormError = { field, message, code, value }

        if (!formErrorState.value.errors[field]) {
            formErrorState.value.errors[field] = []
        }

        formErrorState.value.errors[field].push(error)
        updateErrorState()
    }

    // Clear errors for a specific field
    const clearFieldError = (field: string) => {
        delete formErrorState.value.errors[field]
        updateErrorState()
    }

    // Clear all errors
    const clearAllErrors = () => {
        formErrorState.value.errors = {}
        updateErrorState()
    }

    // Update error state counters
    const updateErrorState = () => {
        const errorEntries = Object.entries(formErrorState.value.errors)
        formErrorState.value.hasErrors = errorEntries.length > 0
        formErrorState.value.errorCount = errorEntries.reduce(
            (count, [, fieldErrors]) => count + fieldErrors.length,
            0
        )
    }

    // Handle API validation errors
    const handleApiValidationErrors = (error: any) => {
        const validationResult = handleValidationError(error, 'Form Validation')

        if (validationResult?.validationErrors) {
            // Clear existing errors
            clearAllErrors()

            // Set new errors
            validationResult.validationErrors.forEach((validationError: any) => {
                addFieldError(
                    validationError.field,
                    validationError.message,
                    validationError.code,
                    validationError.value
                )
            })

            // Show errors
            showFormErrors()

            // Scroll to first error if enabled
            if (scrollToError) {
                scrollToFirstError()
            }

            // Focus first error field if enabled
            if (focusOnError) {
                focusFirstErrorField()
            }
        }

        return validationResult
    }

    // Handle field touch (when user interacts with field)
    const touchField = (field: string) => {
        formErrorState.value.touchedFields.add(field)

        if (showOnTouch && hasFieldError(field)) {
            formErrorState.value.showErrors = true
        }
    }

    // Handle field input (when user types in field)
    const handleFieldInput = (field: string, value: any) => {
        if (clearOnInput && hasFieldError(field)) {
            clearFieldError(field)
        }

        // Mark field as touched
        touchField(field)
    }

    // Show form errors (usually on submit)
    const showFormErrors = () => {
        formErrorState.value.showErrors = true
    }

    // Hide form errors
    const hideFormErrors = () => {
        formErrorState.value.showErrors = false
    }

    // Check if field should show errors
    const shouldShowFieldError = (field: string): boolean => {
        if (!hasFieldError(field)) return false

        if (!formErrorState.value.showErrors) return false

        if (showOnTouch && formErrorState.value.touchedFields.has(field)) {
            return true
        }

        if (showOnSubmit && formErrorState.value.showErrors) {
            return true
        }

        return false
    }

    // Scroll to first error field
    const scrollToFirstError = () => {
        if (!import.meta.client) return

        const firstErrorField = Object.keys(formErrorState.value.errors)[0]
        if (!firstErrorField) return

        // Try to find the field element
        const fieldElement = document.querySelector(`[name="${firstErrorField}"]`) ||
            document.querySelector(`#${firstErrorField}`) ||
            document.querySelector(`[data-field="${firstErrorField}"]`)

        if (fieldElement) {
            fieldElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }

    // Focus first error field
    const focusFirstErrorField = () => {
        if (!import.meta.client) return

        const firstErrorField = Object.keys(formErrorState.value.errors)[0]
        if (!firstErrorField) return

        // Try to find the field element
        const fieldElement = document.querySelector(`[name="${firstErrorField}"]`) ||
            document.querySelector(`#${firstErrorField}`) as HTMLElement

        if (fieldElement && 'focus' in fieldElement) {
            setTimeout(() => {
                fieldElement.focus()
            }, 100)
        }
    }

    // Get formatted field name
    const getFieldLabel = (field: string): string => {
        if (fieldLabels[field]) {
            return fieldLabels[field]
        }

        // Convert snake_case to readable format
        return field
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
    }

    // Validate a single field
    const validateField = (field: string, value: any, rules: any[] = []): boolean => {
        clearFieldError(field)

        for (const rule of rules) {
            const result = rule(value)
            if (result !== true) {
                setFieldError(field, result)
                return false
            }
        }

        return true
    }

    // Validate multiple fields
    const validateFields = (fieldsData: Record<string, { value: any; rules?: any[] }>): boolean => {
        let isValid = true

        Object.entries(fieldsData).forEach(([field, { value, rules = [] }]) => {
            const fieldValid = validateField(field, value, rules)
            if (!fieldValid) {
                isValid = false
            }
        })

        if (!isValid) {
            showFormErrors()
            if (scrollToError) scrollToFirstError()
            if (focusOnError) focusFirstErrorField()
        }

        return isValid
    }

    // Get error summary for display
    const getErrorSummary = () => {
        const summary = {
            totalErrors: formErrorState.value.errorCount,
            fieldsWithErrors: Object.keys(formErrorState.value.errors).length,
            errorsByField: {} as Record<string, number>
        }

        Object.entries(formErrorState.value.errors).forEach(([field, fieldErrors]) => {
            summary.errorsByField[field] = fieldErrors.length
        })

        return summary
    }

    // Get all errors as a flat array
    const getAllErrors = (): FormError[] => {
        return Object.values(formErrorState.value.errors).flat()
    }

    // Get errors formatted for display
    const getFormattedErrors = (): Array<{ field: string; label: string; message: string }> => {
        return getAllErrors().map(error => ({
            field: error.field,
            label: getFieldLabel(error.field),
            message: error.message
        }))
    }

    // Reset form error state
    const reset = () => {
        formErrorState.value = {
            errors: {},
            hasErrors: false,
            errorCount: 0,
            touchedFields: new Set(),
            showErrors: false
        }
    }

    // Common validation rules
    const validationRules = {
        required: (message = 'Este campo es requerido') => (value: any) => {
            if (value === null || value === undefined || value === '') {
                return message
            }
            return true
        },

        minLength: (min: number, message?: string) => (value: string) => {
            if (value && value.length < min) {
                return message || `Debe tener al menos ${min} caracteres`
            }
            return true
        },

        maxLength: (max: number, message?: string) => (value: string) => {
            if (value && value.length > max) {
                return message || `No debe exceder ${max} caracteres`
            }
            return true
        },

        email: (message = 'Debe ser un email válido') => (value: string) => {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return message
            }
            return true
        },

        pattern: (regex: RegExp, message = 'Formato inválido') => (value: string) => {
            if (value && !regex.test(value)) {
                return message
            }
            return true
        },

        numeric: (message = 'Debe ser un número') => (value: any) => {
            if (value && isNaN(Number(value))) {
                return message
            }
            return true
        },

        min: (min: number, message?: string) => (value: number) => {
            if (value !== null && value !== undefined && Number(value) < min) {
                return message || `Debe ser mayor o igual a ${min}`
            }
            return true
        },

        max: (max: number, message?: string) => (value: number) => {
            if (value !== null && value !== undefined && Number(value) > max) {
                return message || `Debe ser menor o igual a ${max}`
            }
            return true
        }
    }

    return {
        // State
        errors,
        hasErrors,
        errorCount,
        showErrors,

        // Field error methods
        getFieldErrors,
        hasFieldError,
        getFieldError,
        setFieldError,
        setFieldErrors,
        addFieldError,
        clearFieldError,
        clearAllErrors,

        // API error handling
        handleApiValidationErrors,

        // Field interaction
        touchField,
        handleFieldInput,
        shouldShowFieldError,

        // Form error display
        showFormErrors,
        hideFormErrors,
        scrollToFirstError,
        focusFirstErrorField,

        // Validation
        validateField,
        validateFields,
        validationRules,

        // Utilities
        getFieldLabel,
        getErrorSummary,
        getAllErrors,
        getFormattedErrors,
        reset
    }
}