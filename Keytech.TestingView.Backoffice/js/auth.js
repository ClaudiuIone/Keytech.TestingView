// Authentication service for handling user login, registration, and session management

class AuthService {
    constructor() {
        this.currentUser = null;
        this.initAuth();
    }

    // Initialize authentication from local storage
    initAuth() {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUI(true);
            } catch (error) {
                console.error('Failed to parse user data:', error);
                this.logout();
            }
        } else {
            this.updateUI(false);
        }

        // Listen for auth events
        window.addEventListener('auth:logout', () => this.logout());
    }

    // Update UI based on authentication state
    updateUI(isAuthenticated) {
        const authContainer = document.getElementById('auth-container');
        const welcomeView = document.getElementById('welcome-view');
        
        if (isAuthenticated && this.currentUser) {
            // User is logged in
            authContainer.innerHTML = `
                <span class="text-light me-2">Welcome, ${this.currentUser.name || this.currentUser.email}</span>
                <button class="btn btn-outline-light" id="logout-btn">Logout</button>
            `;
            
            // Add logout event listener
            document.getElementById('logout-btn').addEventListener('click', () => this.logout());
            
            // Hide welcome view if it's visible
            if (welcomeView) {
                welcomeView.style.display = 'none';
            }
        } else {
            // User is not logged in
            authContainer.innerHTML = `
                <button class="btn btn-outline-light me-2" id="login-btn">Login</button>
                <button class="btn btn-primary" id="register-btn">Register</button>
            `;
            
            // Add login/register event listeners
            document.getElementById('login-btn').addEventListener('click', () => this.showLoginModal());
            document.getElementById('register-btn').addEventListener('click', () => this.showRegisterModal());
            
            // Show welcome view if it exists
            if (welcomeView) {
                welcomeView.style.display = 'block';
            }
        }
    }

    // Show login modal with form
    showLoginModal() {
        const loginModal = new bootstrap.Modal(document.getElementById('login-modal'));
        const modalBody = document.querySelector('#login-modal .modal-body');
        
        modalBody.innerHTML = `
            <form id="login-form">
                <div class="mb-3">
                    <label for="login-email" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="login-email" required>
                </div>
                <div class="mb-3">
                    <label for="login-password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="login-password" required>
                </div>
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="remember-me">
                    <label class="form-check-label" for="remember-me">Remember me</label>
                </div>
                <div class="d-grid">
                    <button type="submit" class="btn btn-primary">Login</button>
                </div>
                <div class="text-center mt-3">
                    <a href="#" id="forgot-password-link">Forgot Password?</a>
                </div>
                <hr>
                <p class="text-center">Or login with:</p>
                <div class="d-grid gap-2">
                    <button type="button" class="btn social-login-btn google-btn" id="google-login">
                        <i class="bi bi-google me-2"></i> Continue with Google
                    </button>
                    <button type="button" class="btn social-login-btn facebook-btn" id="facebook-login">
                        <i class="bi bi-facebook me-2"></i> Continue with Facebook
                    </button>
                    <button type="button" class="btn social-login-btn twitter-btn" id="twitter-login">
                        <i class="bi bi-twitter me-2"></i> Continue with Twitter
                    </button>
                </div>
            </form>
        `;
        
        // Add event listeners for login form
        document.getElementById('login-form').addEventListener('submit', (event) => {
            event.preventDefault();
            this.processLogin();
        });
        
        // Social login event listeners
        document.getElementById('google-login').addEventListener('click', () => this.socialLogin('google'));
        document.getElementById('facebook-login').addEventListener('click', () => this.socialLogin('facebook'));
        document.getElementById('twitter-login').addEventListener('click', () => this.socialLogin('twitter'));
        
        // Forgot password
        document.getElementById('forgot-password-link').addEventListener('click', (event) => {
            event.preventDefault();
            loginModal.hide();
            this.showForgotPasswordModal();
        });
        
        loginModal.show();
    }

    // Show registration modal with form
    showRegisterModal() {
        const registerModal = new bootstrap.Modal(document.getElementById('register-modal'));
        const modalBody = document.querySelector('#register-modal .modal-body');
        
        modalBody.innerHTML = `
            <form id="register-form">
                <div class="mb-3">
                    <label for="register-name" class="form-label">Full Name</label>
                    <input type="text" class="form-control" id="register-name" required>
                </div>
                <div class="mb-3">
                    <label for="register-email" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="register-email" required>
                    <div class="form-text">We'll send a confirmation email to this address.</div>
                </div>
                <div class="mb-3">
                    <label for="register-password" class="form-label">Password</label>
                    <input type="password" class="form-control" id="register-password" required>
                </div>
                <div class="mb-3">
                    <label for="register-confirm-password" class="form-label">Confirm Password</label>
                    <input type="password" class="form-control" id="register-confirm-password" required>
                </div>
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="terms-agree" required>
                    <label class="form-check-label" for="terms-agree">I agree to the Terms of Service and Privacy Policy</label>
                </div>
                <div class="d-grid">
                    <button type="submit" class="btn btn-primary">Register</button>
                </div>
                <hr>
                <p class="text-center">Or register with:</p>
                <div class="d-grid gap-2">
                    <button type="button" class="btn social-login-btn google-btn" id="google-register">
                        <i class="bi bi-google me-2"></i> Continue with Google
                    </button>
                    <button type="button" class="btn social-login-btn facebook-btn" id="facebook-register">
                        <i class="bi bi-facebook me-2"></i> Continue with Facebook
                    </button>
                    <button type="button" class="btn social-login-btn twitter-btn" id="twitter-register">
                        <i class="bi bi-twitter me-2"></i> Continue with Twitter
                    </button>
                </div>
            </form>
        `;
        
        // Add event listeners for registration form
        document.getElementById('register-form').addEventListener('submit', (event) => {
            event.preventDefault();
            this.processRegistration();
        });
        
        // Social registration event listeners
        document.getElementById('google-register').addEventListener('click', () => this.socialLogin('google'));
        document.getElementById('facebook-register').addEventListener('click', () => this.socialLogin('facebook'));
        document.getElementById('twitter-register').addEventListener('click', () => this.socialLogin('twitter'));
        
        registerModal.show();
    }

    // Process login form submission
    async processLogin() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        try {
            const response = await apiService.login(email, password);
            this.handleAuthSuccess(response.user, rememberMe);
            
            // Close the modal
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('login-modal'));
            loginModal.hide();
            
            // Show success message
            this.showNotification('Login successful!', 'success');
        } catch (error) {
            this.showNotification('Login failed: ' + error.message, 'danger');
        }
    }

    // Process registration form submission
    async processRegistration() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match!', 'danger');
            return;
        }
        
        try {
            const userData = { name, email, password };
            await apiService.register(userData);
            
            // Close the modal
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('register-modal'));
            registerModal.hide();
            
            // Show success message
            this.showNotification('Registration successful! Please check your email to confirm your account.', 'success');
        } catch (error) {
            this.showNotification('Registration failed: ' + error.message, 'danger');
        }
    }

    // Handle social login/registration
    async socialLogin(provider) {
        try {
            // In a real implementation, you'd integrate with the social provider's SDK
            // For this example, we'll simulate a successful authentication with a mock token
            const mockToken = 'mock_social_auth_token';
            const response = await apiService.socialLogin(provider, mockToken);
            
            this.handleAuthSuccess(response.user, true);
            
            // Close any open modals
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('login-modal'));
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('register-modal'));
            
            if (loginModal) loginModal.hide();
            if (registerModal) registerModal.hide();
            
            // Show success message
            this.showNotification(`Successfully logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`, 'success');
        } catch (error) {
            this.showNotification(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed: ` + error.message, 'danger');
        }
    }

    // Handle successful authentication
    handleAuthSuccess(user, rememberMe) {
        this.currentUser = user;
        
        if (rememberMe) {
            localStorage.setItem('user_data', JSON.stringify(user));
        } else {
            sessionStorage.setItem('user_data', JSON.stringify(user));
        }
        
        this.updateUI(true);
        
        // Dispatch event for other components to respond to login
        window.dispatchEvent(new CustomEvent('auth:login', { detail: { user } }));
    }

    // Log out the current user
    logout() {
        this.currentUser = null;
        apiService.clearToken();
        localStorage.removeItem('user_data');
        sessionStorage.removeItem('user_data');
        
        this.updateUI(false);
        
        // Dispatch event for other components to respond to logout
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        // Show notification
        this.showNotification('You have been logged out.', 'info');
    }

    // Show notification message
    showNotification(message, type = 'info') {
        // You can implement a more sophisticated notification system here
        alert(message);
    }

    // Display forgot password modal
    showForgotPasswordModal() {
        // Implementation for forgot password functionality
        alert('Forgot password functionality will be implemented here');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Get current user data
    getCurrentUser() {
        return this.currentUser;
    }
}

// Create and export a singleton instance
const authService = new AuthService();