// Add this function inside your component or in a utils file
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (password.length < 12) {
        errors.push('At least 12 characters')
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('At least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
        errors.push('At least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
        errors.push('At least one number')
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('At least one special character')
    }
    
    return { isValid: errors.length === 0, errors }
}