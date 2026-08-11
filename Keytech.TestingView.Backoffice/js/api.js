// API service for communicating with the backend

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.endpoints = CONFIG.API.ENDPOINTS;
        this.token = localStorage.getItem('auth_token');
    }

    // Set the authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    // Clear the authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    // Helper method to build request options
    _getRequestOptions(method, body = null) {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        return options;
    }

    // Generic request method
    async _request(endpoint, method, body = null) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, this._getRequestOptions(method, body));
            
            // Check if the response is successful
            if (!response.ok) {
                // Handle unauthorized (token expired)
                if (response.status === 401) {
                    this.clearToken();
                    window.dispatchEvent(new CustomEvent('auth:logout'));
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || 'API request failed');
            }

            // Return the response data
            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(email, password) {
        const data = await this._request(this.endpoints.AUTH.LOGIN, 'POST', { email, password });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(userData) {
        return await this._request(this.endpoints.AUTH.REGISTER, 'POST', userData);
    }

    async confirmEmail(token) {
        return await this._request(`${this.endpoints.AUTH.CONFIRM_EMAIL}?token=${token}`, 'GET');
    }

    async socialLogin(provider, token) {
        const data = await this._request(this.endpoints.AUTH.SOCIAL_LOGIN, 'POST', { provider, token });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    // Session methods
    async getSessions() {
        return await this._request(this.endpoints.SESSIONS.GET_ALL, 'GET');
    }

    async getSession(id) {
        return await this._request(`${this.endpoints.SESSIONS.GET_BY_ID}${id}`, 'GET');
    }

    async createSession(sessionData) {
        return await this._request(this.endpoints.SESSIONS.CREATE, 'POST', sessionData);
    }

    async updateSession(id, sessionData) {
        return await this._request(`${this.endpoints.SESSIONS.UPDATE}${id}`, 'PUT', sessionData);
    }

    async deleteSession(id) {
        return await this._request(`${this.endpoints.SESSIONS.DELETE}${id}`, 'DELETE');
    }

    // Journal methods
    async getJournalEntries() {
        return await this._request(this.endpoints.JOURNAL.GET_ALL, 'GET');
    }

    async getJournalEntry(id) {
        return await this._request(`${this.endpoints.JOURNAL.GET_BY_ID}${id}`, 'GET');
    }

    async createJournalEntry(entryData) {
        return await this._request(this.endpoints.JOURNAL.CREATE, 'POST', entryData);
    }

    async updateJournalEntry(id, entryData) {
        return await this._request(`${this.endpoints.JOURNAL.UPDATE}${id}`, 'PUT', entryData);
    }

    async deleteJournalEntry(id) {
        return await this._request(`${this.endpoints.JOURNAL.DELETE}${id}`, 'DELETE');
    }

    // Analytics methods
    async getSessionAnalytics() {
        return await this._request(this.endpoints.ANALYTICS.SESSIONS, 'GET');
    }

    async getPositionAnalytics() {
        return await this._request(this.endpoints.ANALYTICS.POSITIONS, 'GET');
    }

    async getPerformanceAnalytics() {
        return await this._request(this.endpoints.ANALYTICS.PERFORMANCE, 'GET');
    }

    async getAnalyticsSummary() {
        return await this._request(this.endpoints.ANALYTICS.SUMMARY, 'GET');
    }
}

// Create and export a singleton instance
const apiService = new ApiService();