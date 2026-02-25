/**
 * Environment Variable Validator
 * Ensures that the application has all necessary configuration to run safely.
 */

const REQUIRED_VARS = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

export const validateEnv = () => {
    const missing = REQUIRED_VARS.filter(key => !import.meta.env[key] || import.meta.env[key].includes('your_'));

    if (missing.length > 0) {
        console.error('CRITICAL: Missing or invalid environment variables:', missing.join(', '));

        if (import.meta.env.PROD) {
            // In production, we might want to show a non-functional state or a fatal error UI
            // For now, we log and proceed, but this could be expanded to a "Maintenance" or "Setup required" view.
        }
        return false;
    }

    console.log(`[EnvValidator] Environment check passed (${import.meta.env.MODE})`);
    return true;
};
