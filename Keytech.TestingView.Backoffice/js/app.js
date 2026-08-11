// Main application script that initializes the Backoffice application

document.addEventListener('DOMContentLoaded', () => {
    // Initialize components when the DOM is fully loaded
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Check if we need to handle any URL parameters (like email confirmation tokens)
    handleUrlParameters();
    
    // Initialize Bootstrap components
    initializeBootstrapComponents();
    
    // Add event listeners for Bootstrap icons (requires Bootstrap Icons to be loaded)
    loadBootstrapIcons();
    
    console.log('TestingView Backoffice application initialized');
}

// Handle any URL parameters, such as email confirmation tokens
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle email confirmation
    const confirmToken = urlParams.get('confirm');
    if (confirmToken) {
        handleEmailConfirmation(confirmToken);
    }
    
    // Handle password reset
    const resetToken = urlParams.get('reset');
    if (resetToken) {
        handlePasswordReset(resetToken);
    }
}

// Handle email confirmation process
async function handleEmailConfirmation(token) {
    try {
        await apiService.confirmEmail(token);
        alert('Email confirmed successfully! You can now log in.');
    } catch (error) {
        console.error('Email confirmation failed:', error);
        alert('Email confirmation failed: ' + error.message);
    }
}

// Handle password reset process
function handlePasswordReset(token) {
    // Implementation for password reset
    alert('Password reset functionality would be implemented here');
}

// Initialize Bootstrap components like tooltips, popovers, etc.
function initializeBootstrapComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Load Bootstrap Icons if they're not already loaded
function loadBootstrapIcons() {
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
        const iconLink = document.createElement('link');
        iconLink.rel = 'stylesheet';
        iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css';
        document.head.appendChild(iconLink);
    }
}