// Router for handling navigation between different views

class Router {
    constructor() {
        this.routes = {
            'sessions': {
                load: () => this.loadSessionsView(),
                navId: 'nav-sessions'
            },
            'journal': {
                load: () => this.loadJournalView(),
                navId: 'nav-journal'
            },
            'analytics': {
                load: () => this.loadAnalyticsView(),
                navId: 'nav-analytics'
            }
        };
        
        this.currentRoute = null;
        this.appContainer = document.getElementById('app-container');
        
        this.initRouter();
    }

    // Initialize router and event listeners
    initRouter() {
        // Set up navigation event listeners
        Object.entries(this.routes).forEach(([route, config]) => {
            const navElement = document.getElementById(config.navId);
            if (navElement) {
                navElement.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.navigateTo(route);
                });
            }
        });

        // Listen for authentication changes
        window.addEventListener('auth:login', () => {
            // Navigate to sessions view upon login
            this.navigateTo('sessions');
        });

        window.addEventListener('auth:logout', () => {
            // Show welcome view on logout
            this.showWelcomeView();
        });

        // Check if user is authenticated and load appropriate view
        if (authService.isAuthenticated()) {
            this.navigateTo('sessions');
        } else {
            this.showWelcomeView();
        }
    }

    // Navigate to a specific route
    navigateTo(route) {
        if (!authService.isAuthenticated()) {
            // Redirect to welcome view if not authenticated
            this.showWelcomeView();
            return;
        }

        if (this.routes[route]) {
            this.currentRoute = route;
            
            // Update navigation active states
            this.updateNavigation(route);
            
            // Load the route content
            this.routes[route].load();
        } else {
            console.error(`Route "${route}" not found`);
        }
    }

    // Update navigation active states
    updateNavigation(activeRoute) {
        Object.entries(this.routes).forEach(([route, config]) => {
            const navElement = document.getElementById(config.navId);
            if (navElement) {
                if (route === activeRoute) {
                    navElement.classList.add('active');
                } else {
                    navElement.classList.remove('active');
                }
            }
        });
    }

    // Show welcome view for unauthenticated users
    showWelcomeView() {
        this.currentRoute = null;
        
        // Reset navigation active states
        this.updateNavigation('');
        
        // Display welcome content
        this.appContainer.innerHTML = `
            <div id="welcome-view" class="text-center py-5">
                <h1>Welcome to TestingView Backoffice</h1>
                <p class="lead">Please log in to access your sessions, journal, and analytics.</p>
            </div>
        `;
    }

    // Load sessions view
    loadSessionsView() {
        this.appContainer.innerHTML = `
            <div id="sessions-view">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Trading Sessions</h2>
                    <button class="btn btn-primary" id="new-session-btn">
                        <i class="bi bi-plus-circle"></i> New Session
                    </button>
                </div>
                
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Filter Sessions</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label for="session-date-filter" class="form-label">Date Range</label>
                                <input type="date" class="form-control" id="session-date-filter">
                            </div>
                            <div class="col-md-4">
                                <label for="session-market-filter" class="form-label">Market</label>
                                <select class="form-select" id="session-market-filter">
                                    <option value="">All Markets</option>
                                    <option value="forex">Forex</option>
                                    <option value="stocks">Stocks</option>
                                    <option value="crypto">Crypto</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="session-status-filter" class="form-label">Status</label>
                                <select class="form-select" id="session-status-filter">
                                    <option value="">All Statuses</option>
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table data-table" id="sessions-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Market</th>
                                <th>Instrument</th>
                                <th>Duration</th>
                                <th>P/L</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="sessions-table-body">
                            <tr>
                                <td colspan="7" class="text-center">Loading sessions...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <nav aria-label="Sessions pagination" class="mt-4">
                    <ul class="pagination justify-content-center" id="sessions-pagination">
                        <!-- Pagination will be inserted here -->
                    </ul>
                </nav>
            </div>
        `;
        
        // Add event listener for new session button
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.showSessionFormModal();
        });
        
        // Load sessions data
        this.loadSessionsData();
    }
    
    // Load journal view
    loadJournalView() {
        this.appContainer.innerHTML = `
            <div id="journal-view">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Trading Journal</h2>
                    <button class="btn btn-primary" id="new-entry-btn">
                        <i class="bi bi-plus-circle"></i> New Entry
                    </button>
                </div>
                
                <div class="card mb-4">
                    <div class="card-header bg-light">
                        <h5 class="mb-0">Filter Journal Entries</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label for="journal-date-filter" class="form-label">Date Range</label>
                                <input type="date" class="form-control" id="journal-date-filter">
                            </div>
                            <div class="col-md-3">
                                <label for="journal-symbol-filter" class="form-label">Symbol</label>
                                <input type="text" class="form-control" id="journal-symbol-filter" placeholder="Enter symbol">
                            </div>
                            <div class="col-md-3">
                                <label for="journal-type-filter" class="form-label">Position Type</label>
                                <select class="form-select" id="journal-type-filter">
                                    <option value="">All Types</option>
                                    <option value="long">Long</option>
                                    <option value="short">Short</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label for="journal-result-filter" class="form-label">Result</label>
                                <select class="form-select" id="journal-result-filter">
                                    <option value="">All Results</option>
                                    <option value="win">Win</option>
                                    <option value="loss">Loss</option>
                                    <option value="breakeven">Breakeven</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table data-table" id="journal-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Symbol</th>
                                <th>Type</th>
                                <th>Entry Price</th>
                                <th>Exit Price</th>
                                <th>Size</th>
                                <th>P/L</th>
                                <th>Result</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="journal-table-body">
                            <tr>
                                <td colspan="9" class="text-center">Loading journal entries...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <nav aria-label="Journal pagination" class="mt-4">
                    <ul class="pagination justify-content-center" id="journal-pagination">
                        <!-- Pagination will be inserted here -->
                    </ul>
                </nav>
            </div>
        `;
        
        // Add event listener for new entry button
        document.getElementById('new-entry-btn').addEventListener('click', () => {
            this.showJournalEntryFormModal();
        });
        
        // Load journal data
        this.loadJournalData();
    }
    
    // Load analytics view
    loadAnalyticsView() {
        this.appContainer.innerHTML = `
            <div id="analytics-view">
                <h2 class="mb-4">Trading Analytics</h2>
                
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="analytics-card text-center">
                            <h3>Total P/L</h3>
                            <h2 class="text-primary mb-0" id="total-pl">$0.00</h2>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analytics-card text-center">
                            <h3>Win Rate</h3>
                            <h2 class="text-success mb-0" id="win-rate">0%</h2>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analytics-card text-center">
                            <h3>Avg. Win/Loss Ratio</h3>
                            <h2 class="text-info mb-0" id="win-loss-ratio">0:0</h2>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="analytics-card text-center">
                            <h3>Total Trades</h3>
                            <h2 class="text-secondary mb-0" id="total-trades">0</h2>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="analytics-card">
                            <h3>P/L Over Time</h3>
                            <div class="chart-container" id="pl-chart">
                                <!-- Chart will be rendered here -->
                                <p class="text-center pt-5">Loading chart...</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <div class="analytics-card">
                            <h3>Win/Loss Distribution</h3>
                            <div class="chart-container" id="win-loss-chart">
                                <!-- Chart will be rendered here -->
                                <p class="text-center pt-5">Loading chart...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-4">
                        <div class="analytics-card">
                            <h3>Performance by Trading Session</h3>
                            <div class="chart-container" id="session-performance-chart">
                                <!-- Chart will be rendered here -->
                                <p class="text-center pt-5">Loading chart...</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-4">
                        <div class="analytics-card">
                            <h3>Performance by Instrument</h3>
                            <div class="chart-container" id="instrument-performance-chart">
                                <!-- Chart will be rendered here -->
                                <p class="text-center pt-5">Loading chart...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load analytics data
        this.loadAnalyticsData();
    }
    
    // Load sessions data from API
    async loadSessionsData() {
        try {
            const tableBody = document.getElementById('sessions-table-body');
            
            // Show loading state
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Loading sessions...</td></tr>`;
            
            // Fetch sessions data from API
            const sessions = await apiService.getSessions();
            
            if (sessions.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No sessions found. Create your first session by clicking the "New Session" button.</td></tr>`;
                return;
            }
            
            // Render sessions data
            tableBody.innerHTML = sessions.map(session => `
                <tr>
                    <td>${new Date(session.date).toLocaleDateString()}</td>
                    <td>${session.market}</td>
                    <td>${session.instrument}</td>
                    <td>${session.duration}</td>
                    <td class="${parseFloat(session.profitLoss) >= 0 ? 'text-success' : 'text-danger'}">${session.profitLoss}</td>
                    <td><span class="badge ${session.status === 'open' ? 'bg-success' : 'bg-secondary'}">${session.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-session-btn" data-id="${session.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-session-btn" data-id="${session.id}">Delete</button>
                    </td>
                </tr>
            `).join('');
            
            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-session-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const sessionId = button.getAttribute('data-id');
                    this.showSessionFormModal(sessionId);
                });
            });
            
            document.querySelectorAll('.delete-session-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const sessionId = button.getAttribute('data-id');
                    this.confirmDeleteSession(sessionId);
                });
            });
            
        } catch (error) {
            console.error('Failed to load sessions:', error);
            const tableBody = document.getElementById('sessions-table-body');
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Failed to load sessions. Please try again later.</td></tr>`;
        }
    }
    
    // Load journal data from API
    async loadJournalData() {
        try {
            const tableBody = document.getElementById('journal-table-body');
            
            // Show loading state
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center">Loading journal entries...</td></tr>`;
            
            // Fetch journal data from API
            const entries = await apiService.getJournalEntries();
            
            if (entries.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="9" class="text-center">No journal entries found. Create your first entry by clicking the "New Entry" button.</td></tr>`;
                return;
            }
            
            // Render journal data
            tableBody.innerHTML = entries.map(entry => `
                <tr>
                    <td>${new Date(entry.date).toLocaleDateString()}</td>
                    <td>${entry.symbol}</td>
                    <td>${entry.type}</td>
                    <td>${entry.entryPrice}</td>
                    <td>${entry.exitPrice}</td>
                    <td>${entry.size}</td>
                    <td class="${parseFloat(entry.profitLoss) >= 0 ? 'text-success' : 'text-danger'}">${entry.profitLoss}</td>
                    <td>
                        <span class="badge ${
                            entry.result === 'win' ? 'bg-success' : 
                            entry.result === 'loss' ? 'bg-danger' : 'bg-secondary'
                        }">${entry.result}</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-entry-btn" data-id="${entry.id}">Edit</button>
                        <button class="btn btn-sm btn-outline-danger delete-entry-btn" data-id="${entry.id}">Delete</button>
                    </td>
                </tr>
            `).join('');
            
            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-entry-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const entryId = button.getAttribute('data-id');
                    this.showJournalEntryFormModal(entryId);
                });
            });
            
            document.querySelectorAll('.delete-entry-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const entryId = button.getAttribute('data-id');
                    this.confirmDeleteJournalEntry(entryId);
                });
            });
            
        } catch (error) {
            console.error('Failed to load journal entries:', error);
            const tableBody = document.getElementById('journal-table-body');
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">Failed to load journal entries. Please try again later.</td></tr>`;
        }
    }
    
    // Load analytics data from API
    async loadAnalyticsData() {
        try {
            // Fetch analytics data from API
            const summaryData = await apiService.getAnalyticsSummary();
            
            // Update summary metrics
            document.getElementById('total-pl').textContent = summaryData.totalProfitLoss;
            document.getElementById('win-rate').textContent = summaryData.winRate;
            document.getElementById('win-loss-ratio').textContent = summaryData.winLossRatio;
            document.getElementById('total-trades').textContent = summaryData.totalTrades;
            
            // For a real implementation, you would integrate with a charting library like Chart.js
            // to render the analytics charts based on the data from the API
            document.getElementById('pl-chart').innerHTML = '<p class="text-center">Chart would be rendered here with a library like Chart.js</p>';
            document.getElementById('win-loss-chart').innerHTML = '<p class="text-center">Chart would be rendered here with a library like Chart.js</p>';
            document.getElementById('session-performance-chart').innerHTML = '<p class="text-center">Chart would be rendered here with a library like Chart.js</p>';
            document.getElementById('instrument-performance-chart').innerHTML = '<p class="text-center">Chart would be rendered here with a library like Chart.js</p>';
            
        } catch (error) {
            console.error('Failed to load analytics data:', error);
            document.getElementById('total-pl').textContent = 'Error';
            document.getElementById('win-rate').textContent = 'Error';
            document.getElementById('win-loss-ratio').textContent = 'Error';
            document.getElementById('total-trades').textContent = 'Error';
            
            document.getElementById('pl-chart').innerHTML = '<p class="text-center text-danger">Failed to load chart data. Please try again later.</p>';
            document.getElementById('win-loss-chart').innerHTML = '<p class="text-center text-danger">Failed to load chart data. Please try again later.</p>';
            document.getElementById('session-performance-chart').innerHTML = '<p class="text-center text-danger">Failed to load chart data. Please try again later.</p>';
            document.getElementById('instrument-performance-chart').innerHTML = '<p class="text-center text-danger">Failed to load chart data. Please try again later.</p>';
        }
    }
    
    // Show session form modal for creating or editing a session
    async showSessionFormModal(sessionId = null) {
        // Modal implementation for session form
        alert('Session form modal would be implemented here');
    }
    
    // Show journal entry form modal for creating or editing an entry
    async showJournalEntryFormModal(entryId = null) {
        // Modal implementation for journal entry form
        alert('Journal entry form modal would be implemented here');
    }
    
    // Confirm deletion of a session
    confirmDeleteSession(sessionId) {
        // Confirmation dialog for session deletion
        const confirmed = confirm('Are you sure you want to delete this session?');
        if (confirmed) {
            this.deleteSession(sessionId);
        }
    }
    
    // Delete a session
    async deleteSession(sessionId) {
        try {
            await apiService.deleteSession(sessionId);
            this.loadSessionsData(); // Reload sessions after deletion
            alert('Session deleted successfully');
        } catch (error) {
            console.error('Failed to delete session:', error);
            alert('Failed to delete session: ' + error.message);
        }
    }
    
    // Confirm deletion of a journal entry
    confirmDeleteJournalEntry(entryId) {
        // Confirmation dialog for journal entry deletion
        const confirmed = confirm('Are you sure you want to delete this journal entry?');
        if (confirmed) {
            this.deleteJournalEntry(entryId);
        }
    }
    
    // Delete a journal entry
    async deleteJournalEntry(entryId) {
        try {
            await apiService.deleteJournalEntry(entryId);
            this.loadJournalData(); // Reload journal after deletion
            alert('Journal entry deleted successfully');
        } catch (error) {
            console.error('Failed to delete journal entry:', error);
            alert('Failed to delete journal entry: ' + error.message);
        }
    }
}

// Create and export a singleton instance
const router = new Router();