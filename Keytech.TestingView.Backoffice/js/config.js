// Configuration settings for the Backoffice application

const CONFIG = {
    // API endpoint configurations
    API: {
        BASE_URL: '/api', // Relative URL to your existing API
        ENDPOINTS: {
            // Authentication endpoints
            AUTH: {
                LOGIN: '/auth/login',
                REGISTER: '/auth/register',
                CONFIRM_EMAIL: '/auth/confirm-email',
                FORGOT_PASSWORD: '/auth/forgot-password',
                RESET_PASSWORD: '/auth/reset-password',
                SOCIAL_LOGIN: '/auth/social-login'
            },
            // Session management endpoints
            SESSIONS: {
                GET_ALL: '/backoffice/sessions',
                GET_BY_ID: '/backoffice/sessions/',
                CREATE: '/backoffice/sessions',
                UPDATE: '/backoffice/sessions/',
                DELETE: '/backoffice/sessions/'
            },
            // Journal (positions) endpoints
            JOURNAL: {
                GET_ALL: '/backoffice/journal',
                GET_BY_ID: '/backoffice/journal/',
                CREATE: '/backoffice/journal',
                UPDATE: '/backoffice/journal/',
                DELETE: '/backoffice/journal/'
            },
            // Analytics endpoints
            ANALYTICS: {
                SESSIONS: '/backoffice/analytics/sessions',
                POSITIONS: '/backoffice/analytics/positions',
                PERFORMANCE: '/backoffice/analytics/performance',
                SUMMARY: '/backoffice/analytics/summary'
            }
        }
    },
    // Social login configurations
    SOCIAL: {
        GOOGLE: {
            CLIENT_ID: 'your-google-client-id' // Replace with actual client ID
        },
        FACEBOOK: {
            APP_ID: 'your-facebook-app-id' // Replace with actual app ID
        },
        TWITTER: {
            API_KEY: 'your-twitter-api-key' // Replace with actual API key
        }
    }
};