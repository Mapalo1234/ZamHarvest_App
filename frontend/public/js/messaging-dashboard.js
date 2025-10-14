class MessagingDashboard {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('Initializing messaging dashboard...');
        this.loadUserData();
        
        // Validate session with server before proceeding
        const sessionValid = await this.validateSession();
        if (!sessionValid) {
            return; // handleInvalidSession will redirect
        }
        
        this.bindEvents();
        this.updateDashboardHeader();
        this.loadConversations();
        this.initUserSearch();
        this.handleUrlParameters();
        console.log('Messaging dashboard initialized');
    }

    async validateSession() {
        try {
            console.log('Validating session with server...');
            const response = await fetch('/api/notifications', {
                credentials: 'include'
            });
            
            if (response.status === 401) {
                console.error('Session validation failed: Unauthorized');
                this.handleInvalidSession();
                return false;
            } else if (response.ok) {
                console.log('✅ Session valid');
                return true;
            } else {
                console.warn('Session validation returned:', response.status);
                return true; // Continue anyway for non-auth errors
            }
        } catch (error) {
            console.error('Session validation error:', error);
            return true; // Continue anyway for network errors
        }
    }

    loadUserData() {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            console.log('User loaded:', this.currentUser);
            
            // Validate user data format
            if (!this.currentUser.id && !this.currentUser._id) {
                console.error('User data missing ID:', this.currentUser);
                this.handleInvalidSession();
                return;
            }
            
            // Ensure consistent ID format
            if (!this.currentUser.id && this.currentUser._id) {
                this.currentUser.id = this.currentUser._id;
            }
        } else {
            console.error('No user data found in localStorage');
            this.handleInvalidSession();
        }
    }

    handleInvalidSession() {
        console.log('Invalid session detected, redirecting to login...');
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
    }

    updateDashboardHeader() {
        const descriptionElement = document.getElementById('dashboardDescription');
        if (descriptionElement && this.currentUser) {
            if (this.currentUser.role === 'buyer') {
                descriptionElement.textContent = 'Manage your conversations with suppliers';
            } else if (this.currentUser.role === 'seller') {
                descriptionElement.textContent = 'Manage your conversations with buyers';
            } else {
                descriptionElement.textContent = 'Manage your conversations';
            }
        }
    }

    bindEvents() {
        // Chat input events
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');

        if (messageInput) {
            messageInput.addEventListener('input', () => {
                this.toggleSendButton();
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        // Search input events
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleConversationSearch(e.target.value);
                this.toggleSearchClearButton(e.target.value);
            });

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleConversationSearch(e.target.value);
                }
            });

            // Add clear search functionality
            searchInput.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });

            searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    this.hideSearchSuggestions();
                }, 200);
            });
        }

        // Close messaging button
        const closeMessagingBtn = document.getElementById('closeMessagingBtn');
        if (closeMessagingBtn) {
            closeMessagingBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMessaging();
            });
        }

        // Delete conversation button
        const deleteBtn = document.getElementById('deleteConversationBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteConversation();
            });
        }

        // Start conversation button
        const startBtn = document.getElementById('startConversationBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startNewConversation();
            });
        }

        // Close modal button
        const closeBtn = document.getElementById('closeUserSearch');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeUserSearchModal();
            });
        }
    }

    toggleSendButton() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (messageInput && sendButton) {
            const hasText = messageInput.value.trim().length > 0;
            sendButton.disabled = !hasText;
        }
    }

    async loadConversations() {
        const conversationsList = document.getElementById('conversationsList');
        conversationsList.innerHTML = '<div class="loading">Loading conversations...</div>';

        try {
            console.log('Loading conversations...');
            const response = await fetch('/api/conversations');
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`Failed to load conversations: ${errorData.error || 'Unknown error'}`);
            }

            const responseData = await response.json();
            
            // Handle new API response format
            this.conversations = responseData.data || responseData;
            
            if (!Array.isArray(this.conversations)) {
                console.error("Conversations data is not an array:", this.conversations);
                throw new Error("Invalid conversations data format");
            }
            
            console.log('Conversations loaded:', this.conversations);
            this.displayConversations();
            
            // Check if there's a pending conversation to select
            if (this.pendingConversationId) {
                // Use setTimeout to ensure DOM is ready
                setTimeout(() => {
                    this.selectPendingConversation();
                }, 100);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            conversationsList.innerHTML = `<div class="error-message">Failed to load conversations: ${error.message}</div>`;
        }
    }

    displayConversations() {
        const conversationsList = document.getElementById('conversationsList');
        
        if (this.conversations.length === 0) {
            conversationsList.innerHTML = '<div class="no-conversation">No conversations yet</div>';
            return;
        }

        const conversationsHTML = this.conversations.map(conversation => {
            const product = conversation.product;
            const buyer = conversation.buyerId;
            const seller = conversation.sellerId;
            
            // Determine the other participant based on current user role
            const otherParticipant = this.currentUser.role === 'buyer' ? seller : buyer;
            
            const lastMessageTime = this.formatMessageTime(conversation.lastMessageAt || conversation.lastMessageTime);
            const unreadBadge = conversation.unreadCount > 0 ? 
                `<span class="unread-badge">${conversation.unreadCount}</span>` : '';

            return `
                <div class="conversation-item" data-conversation-id="${conversation._id}">
                    <div class="conversation-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="conversation-content">
                        <div class="conversation-header">
                            <h4 class="conversation-name">${otherParticipant ? otherParticipant.username : 'Unknown User'}</h4>
                            <span class="conversation-time">${lastMessageTime}</span>
                        </div>
                        <p class="conversation-preview">${this.escapeHtml(this.getLastMessageText(conversation))}</p>
                        <p class="product-info">Product: ${product ? product.name : 'Unknown Product'}</p>
                    </div>
                    ${unreadBadge}
                </div>
            `;
        }).join('');

        conversationsList.innerHTML = conversationsHTML;

        // Bind conversation click events
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectConversation(item.dataset.conversationId);
            });
        });
    }

    async selectConversation(conversationId) {
        console.log('Selecting conversation:', conversationId);
        
        // Update active conversation
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.currentConversation = conversationId;
        this.updateChatHeader(conversationId);
        this.showChatView();
        
        // Show delete button
        const deleteBtn = document.getElementById('deleteConversationBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'flex';
        }
        
        // Enable input and send button
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (messageInput && sendButton) {
            messageInput.disabled = false;
            messageInput.placeholder = 'Type a message';
            sendButton.disabled = false;
        }
        
        await this.loadMessages(conversationId);
        await this.markMessagesAsRead(conversationId);
    }

    updateChatHeader(conversationId) {
        const conversation = this.conversations.find(conv => conv._id === conversationId);
        if (!conversation) {
            console.log('Conversation not found for conversationId:', conversationId);
            return;
        }

        const product = conversation.product;
        const buyer = conversation.buyerId;
        const seller = conversation.sellerId;
        
        // Determine the other participant based on current user role
        const otherParticipant = this.currentUser.role === 'buyer' ? seller : buyer;

        // Update product name
        const productNameElement = document.getElementById('chatProductName');
        if (productNameElement) {
            productNameElement.textContent = product ? product.name : 'Unknown Product';
        }

        // Update other party name
        const otherPartyElement = document.getElementById('chatOtherPartyInfo');
        if (otherPartyElement) {
            otherPartyElement.textContent = otherParticipant ? otherParticipant.username : 'Unknown User';
        }
    }

    showChatView() {
        // Hide welcome message and show chat interface
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        // Enable message input
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (messageInput && sendButton) {
            messageInput.disabled = false;
            sendButton.disabled = false;
        }
    }

    async loadMessages(conversationId) {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = '<div class="loading">Loading messages...</div>';

        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`);
            
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const responseData = await response.json();
            
            // Handle new API response format
            const messages = responseData.data || responseData;
            
            if (!Array.isArray(messages)) {
                console.error("Messages data is not an array:", messages);
                throw new Error("Invalid messages data format");
            }
            
            this.displayMessages(messages);
        } catch (error) {
            console.error('Error loading messages:', error);
            chatMessages.innerHTML = '<div class="error-message">Failed to load messages. Please try again.</div>';
        }
    }

    displayMessages(messages) {
        const chatMessages = document.getElementById('chatMessages');
        
        if (messages.length === 0) {
            chatMessages.innerHTML = '<div class="welcome-message"><div class="welcome-icon"><i class="fas fa-comments"></i></div><h3>No messages yet</h3><p>Start the conversation!</p></div>';
            return;
        }

        const messagesHTML = messages.map(message => {
            // Check if current user is the sender using the correct field names
            const isSent = message.senderId && 
                          ((message.senderId._id && message.senderId._id === this.currentUser._id) || 
                           (message.senderId._id && message.senderId._id === this.currentUser.id) ||
                           (typeof message.senderId === 'string' && message.senderId === this.currentUser._id) ||
                           (typeof message.senderId === 'string' && message.senderId === this.currentUser.id));
            
            const messageTime = this.formatMessageTime(message.createdAt);

            let displayName = 'Unknown User';
            
            if (isSent) {
                displayName = this.currentUser.username || this.currentUser.email?.split('@')[0] || 'You';
            } else {
                // Use senderId for sender information (it should be populated)
                if (message.senderId && typeof message.senderId === 'object' && message.senderId.username) {
                    displayName = message.senderId.username;
                } else if (message.senderId && typeof message.senderId === 'object' && message.senderId.email) {
                    displayName = message.senderId.email.split('@')[0];
                } else {
                    displayName = 'Other User';
                }
            }

            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-content">
                        ${this.escapeHtml(message.message)}
                    </div>
                    <div class="message-meta">
                        <div class="message-time">${messageTime}</div>
                        <div class="message-sender">${this.escapeHtml(displayName)}</div>
                    </div>
                </div>
            `;
        }).join('');

        chatMessages.innerHTML = messagesHTML;
        this.scrollToBottom();
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();

        if (!text || !this.currentConversation) {
            console.log('Cannot send message:', { text, currentConversation: this.currentConversation });
            return;
        }

        const sendButton = document.getElementById('sendMessage');
        sendButton.disabled = true;

        try {
            const messageData = {
                conversationId: this.currentConversation,
                message: text
            };
            
            console.log('Sending message:', messageData);
            console.log('Current user:', this.currentUser);
            
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageData),
                credentials: 'include' // Ensure cookies are sent for session
            });

            if (!response.ok) {
                let errorMessage = 'Failed to send message';
                let errorDetails = null;
                
                try {
                    // Try to read as text first (works for both JSON and plain text)
                    const responseText = await response.text();
                    
                    if (responseText) {
                        try {
                            // Try to parse as JSON
                            const errorData = JSON.parse(responseText);
                            errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                            errorDetails = errorData;
                        } catch (jsonError) {
                            // If not JSON, use as plain text
                            errorMessage = `HTTP ${response.status}: ${responseText}`;
                            errorDetails = { text: responseText };
                        }
                    } else {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                } catch (readError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    errorDetails = { readError: readError.message };
                }
                
                console.error('Message sending failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorMessage,
                    details: errorDetails
                });
                throw new Error(errorMessage);
            }

            // Handle successful response (may be wrapped in new API format)
            const responseData = await response.json();
            console.log('Message sent successfully:', responseData);
            
            // Clear input
            messageInput.value = '';
            this.toggleSendButton();

            // Show success notification
            this.showSuccessNotification('Message sent successfully!');

            // Reload messages to show the new one
            await this.loadMessages(this.currentConversation);
            await this.loadConversations(); // Refresh conversations list

        } catch (error) {
            console.error('Error sending message:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                currentConversation: this.currentConversation,
                messageData: {
                    conversationId: this.currentConversation,
                    message: text
                }
            });
            alert(`Failed to send message: ${error.message}. Please try again.`);
        } finally {
            sendButton.disabled = false;
        }
    }

    getCurrentConversationReceiverId() {
        const conversation = this.conversations.find(conv => conv._id.productId === this.currentConversation);
        if (!conversation) {
            console.error('Conversation not found in conversations array:', this.currentConversation);
            return null;
        }
        
        const receiverId = this.currentUser.role === 'buyer' ? 
            conversation._id.receiverId : 
            conversation._id.senderId;
            
        return receiverId;
    }

    async markMessagesAsRead(conversationId) {
        try {
            await fetch(`/api/conversations/${conversationId}/read`, {
                method: 'PUT'
            });
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getLastMessageText(conversation) {
        // Handle different formats of lastMessage
        if (!conversation.lastMessage) {
            return 'No messages yet';
        }
        
        // If lastMessage is a string, return it directly
        if (typeof conversation.lastMessage === 'string') {
            return conversation.lastMessage || 'No messages yet';
        }
        
        // If lastMessage is an object, try to extract the message text
        if (typeof conversation.lastMessage === 'object') {
            // Try different possible field names
            if (conversation.lastMessage.message) {
                return conversation.lastMessage.message;
            }
            if (conversation.lastMessage.text) {
                return conversation.lastMessage.text;
            }
            if (conversation.lastMessage.content) {
                return conversation.lastMessage.content;
            }
            // If it's an object but no recognizable message field
            return 'New message';
        }
        
        return 'No messages yet';
    }

    formatMessageTime(timestamp) {
        if (!timestamp) return 'Unknown time';
        
        const messageDate = new Date(timestamp);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
        
        // Check if message is from today
        if (messageDay.getTime() === today.getTime()) {
            // Show time only for today's messages
            return messageDate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            // Check if message is from yesterday
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (messageDay.getTime() === yesterday.getTime()) {
                return 'Yesterday ' + messageDate.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } else {
                // Show date and time for older messages
                return messageDate.toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric' 
                }) + ' ' + messageDate.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            }
        }
    }

    showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Conversation Search Functionality
    handleConversationSearch(query) {
        if (this.conversationSearchTimeout) {
            clearTimeout(this.conversationSearchTimeout);
        }

        if (query.length < 1) {
            this.displayConversations(this.conversations);
            // Hide search results info when search is cleared
            const resultsInfo = document.querySelector('.search-results-info');
            if (resultsInfo) {
                resultsInfo.classList.remove('show');
            }
            return;
        }

        this.conversationSearchTimeout = setTimeout(() => {
            this.searchConversations(query);
        }, 300);
    }

    searchConversations(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            this.displayConversations(this.conversations);
            return;
        }

        const filteredConversations = this.conversations.filter(conversation => {
            // Search in product name
            const productName = conversation.product?.name?.toLowerCase() || '';
            // Search in seller name
            const sellerName = conversation.sellerId?.username?.toLowerCase() || '';
            // Search in buyer name
            const buyerName = conversation.buyerId?.username?.toLowerCase() || '';
            // Search in last message
            const lastMessage = conversation.lastMessage?.toLowerCase() || '';

            return productName.includes(searchTerm) ||
                   sellerName.includes(searchTerm) ||
                   buyerName.includes(searchTerm) ||
                   lastMessage.includes(searchTerm);
        });

        this.displayConversations(filteredConversations);
        this.showSearchResultsInfo(filteredConversations.length, searchTerm);
    }

    showSearchResultsInfo(resultCount, searchTerm) {
        const conversationsContainer = document.querySelector('.conversations-container');
        let resultsInfo = conversationsContainer.querySelector('.search-results-info');
        
        if (!resultsInfo) {
            resultsInfo = document.createElement('div');
            resultsInfo.className = 'search-results-info';
            conversationsContainer.insertBefore(resultsInfo, conversationsContainer.firstChild);
        }
        
        if (resultCount === 0) {
            resultsInfo.innerHTML = `<i class="fas fa-search"></i> No conversations found for "${searchTerm}"`;
        } else {
            resultsInfo.innerHTML = `<i class="fas fa-search"></i> Found ${resultCount} conversation${resultCount === 1 ? '' : 's'} for "${searchTerm}"`;
        }
        
        resultsInfo.classList.add('show');
    }

    toggleSearchClearButton(value) {
        const searchContainer = document.querySelector('.search-container');
        let clearButton = searchContainer.querySelector('.clear-search-btn');
        
        if (value.length > 0) {
            if (!clearButton) {
                clearButton = document.createElement('button');
                clearButton.className = 'clear-search-btn';
                clearButton.innerHTML = '<i class="fas fa-times"></i>';
                clearButton.title = 'Clear search';
                clearButton.addEventListener('click', () => {
                    this.clearSearch();
                });
                searchContainer.appendChild(clearButton);
            }
            clearButton.style.display = 'block';
        } else {
            if (clearButton) {
                clearButton.style.display = 'none';
            }
        }
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.handleConversationSearch('');
            searchInput.focus();
        }
        
        // Hide search results info
        const resultsInfo = document.querySelector('.search-results-info');
        if (resultsInfo) {
            resultsInfo.classList.remove('show');
        }
    }

    showSearchSuggestions() {
        // Add visual feedback when search is focused
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.classList.add('search-focused');
        }
    }

    hideSearchSuggestions() {
        // Remove visual feedback when search loses focus
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.classList.remove('search-focused');
        }
    }

    // User Search Functionality
    initUserSearch() {
        this.searchTimeout = null;
        this.conversationSearchTimeout = null;
        this.bindUserSearchEvents();
    }

    bindUserSearchEvents() {
        // Close modal events
        const closeBtn = document.getElementById('closeUserSearch');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeUserSearchModal();
            });
        }

        // Click outside modal to close
        const modal = document.getElementById('userSearchModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'userSearchModal') {
                    this.closeUserSearchModal();
                }
            });
        }

        // Search input events
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleUserSearch(e.target.value);
            });
        }
    }

    openUserSearchModal() {
        console.log('Opening new conversation modal');
        const modal = document.getElementById('userSearchModal');
        
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
            modal.style.zIndex = '10000';
        }
    }

    closeUserSearchModal() {
        console.log('Closing new conversation modal');
        const modal = document.getElementById('userSearchModal');
        if (modal) {
            modal.classList.remove('show');
            modal.style.display = 'none';
        }
    }

    handleUserSearch(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (query.length < 2) {
            this.showSearchPlaceholder();
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.searchUsers(query);
        }, 300);
    }

    async searchUsers(query) {
        const resultsContainer = document.getElementById('userSearchResults');
        resultsContainer.innerHTML = '<div class="loading-search">Searching users...</div>';

        try {
            const response = await fetch(`/api/search-users?query=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error('Failed to search users');
            }

            const users = await response.json();
            this.displayUserSearchResults(users);
        } catch (error) {
            console.error('Error searching users:', error);
            resultsContainer.innerHTML = '<div class="no-results">Failed to search users. Please try again.</div>';
        }
    }

    displayUserSearchResults(users) {
        const resultsContainer = document.getElementById('userSearchResults');
        
        if (users.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-results">
                    <i class="fa fa-user-times" aria-hidden="true"></i>
                    <p>No users found matching your search</p>
                </div>
            `;
            return;
        }

        const resultsHTML = users.map(user => `
            <div class="user-result-item" data-user-id="${user._id}" data-user-role="${user.role}">
                <div class="user-info">
                    <div class="user-name">${this.escapeHtml(user.username)}</div>
                    <div class="user-email">${this.escapeHtml(user.email)}</div>
                    <div class="user-role">${user.role}</div>
                </div>
                <button class="start-chat-btn" onclick="messagingDashboard.startConversation('${user._id}', '${user.role}')">
                    <i class="fa fa-comment" aria-hidden="true"></i> Start Chat
                </button>
            </div>
        `).join('');

        resultsContainer.innerHTML = resultsHTML;
    }

    showSearchPlaceholder() {
        const resultsContainer = document.getElementById('userSearchResults');
        resultsContainer.innerHTML = `
            <div class="search-placeholder">
                <i class="fa fa-search" aria-hidden="true"></i>
                <p>Enter a username or email to search for users</p>
            </div>
        `;
    }

    async startNewConversation() {
        const nameInput = document.getElementById('userNameInput');
        const userName = nameInput.value.trim();

        if (!userName) {
            alert('Please enter a username or email');
            return;
        }

        console.log('Starting conversation with:', userName);
        // Implementation will be added here
    }

    async startConversation(userId, userRole) {
        console.log('Starting conversation with user:', userId, userRole);
        // Implementation will be added here
    }

    async deleteConversation() {
        if (!this.currentConversation) {
            alert('No conversation selected');
            return;
        }

        const confirmed = confirm('Are you sure you want to delete this conversation? This action cannot be undone.');
        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`/api/conversations/${this.currentConversation}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMessage = 'Failed to delete conversation';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch (jsonError) {
                    // If response is not JSON (like "Page not found"), use the response text
                    try {
                        const errorText = await response.text();
                        errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
                    } catch (textError) {
                        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                    }
                }
                throw new Error(errorMessage);
            }

            this.showSuccessNotification('Conversation deleted successfully!');
            this.currentConversation = null;
            
            const deleteBtn = document.getElementById('deleteConversationBtn');
            if (deleteBtn) {
                deleteBtn.style.display = 'none';
            }

            this.clearChatView();
            await this.loadConversations();

        } catch (error) {
            console.error('Error deleting conversation:', error);
            alert(`Failed to delete conversation: ${error.message}`);
        }
    }

    clearChatView() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '<div class="welcome-message"><div class="welcome-icon"><i class="fas fa-comments"></i></div><h3>No messages yet</h3><p>Start the conversation!</p></div>';
        }

        const otherPartyName = document.getElementById('chatOtherPartyName');
        const productName = document.getElementById('chatProductName');
        
        if (otherPartyName) otherPartyName.textContent = 'Select a conversation';
        if (productName) productName.textContent = 'Choose a conversation to start messaging';

        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (messageInput && sendButton) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Select a conversation to start messaging';
            messageInput.value = '';
            sendButton.disabled = true;
        }
    }

    // Handle URL parameters to auto-select conversation
    handleUrlParameters() {
        // Check for pending conversation from product detail page
        const pendingConversationId = localStorage.getItem('pendingConversationId');
        
        if (pendingConversationId) {
            console.log('Pending conversation found:', pendingConversationId);
            this.pendingConversationId = pendingConversationId;
            localStorage.removeItem('pendingConversationId');
        } else {
            console.log('No pending conversation found in localStorage');
        }
    }

    // Select pending conversation
    selectPendingConversation() {
        if (!this.pendingConversationId) return;
        
        const conversationId = this.pendingConversationId;
        console.log('Selecting pending conversation:', conversationId);
        
        // Find the conversation
        const targetConversation = this.conversations.find(conv => conv._id === conversationId);
        
        if (targetConversation) {
            console.log('Found target conversation, selecting:', targetConversation);
            
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                this.selectConversation(conversationId);
                
                // Show notification
                this.showSuccessNotification('Redirected to conversation!');
                
                // Clear pending conversation ID
                this.pendingConversationId = null;
            }, 100);
        } else {
            console.log('Conversation not found for ID:', conversationId);
            console.log('Available conversations:', this.conversations.map(c => c._id));
            this.showSuccessNotification('Conversation not found. You can start a new one.');
            this.pendingConversationId = null;
        }
    }

    // Handle pending message product from product detail page
    async handlePendingMessageProduct(productInfo) {
        console.log('Pending message product handling - to be implemented');
    }

    // Close messaging dashboard
    closeMessaging() {
        // Redirect to home page or previous page
        if (document.referrer && document.referrer !== window.location.href) {
            window.history.back();
        } else {
            window.location.href = '/home';
        }
    }

    // Check if conversation already exists between buyer and seller for this product
    async checkExistingConversation(productId, sellerId) {
        try {
            console.log('Checking for existing conversation:', { productId, sellerId });
            
            const response = await fetch('/api/conversations');
            if (!response.ok) {
                console.error('Failed to fetch conversations');
                return false;
            }

            const responseData = await response.json();
            const conversations = responseData.data || responseData;
            
            if (!Array.isArray(conversations)) {
                console.error("Conversations data is not an array:", conversations);
                return false;
            }

            // Check if there's already a conversation for this product and seller
            const existingConversation = conversations.find(conv => 
                conv.product && conv.product._id === productId && conv.sellerId && conv.sellerId._id === sellerId
            );

            if (existingConversation) {
                console.log('Found existing conversation:', existingConversation);
                return existingConversation;
            }

            console.log('No existing conversation found');
            return false;
        } catch (error) {
            console.error('Error checking for existing conversation:', error);
            return false;
        }
    }

    // Start a new conversation with the supplier
    async startNewConversationWithSupplier(productInfo) {
        try {
            console.log('Starting new conversation with supplier:', productInfo);
            
            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert('Please log in to start a conversation');
                return;
            }

            const response = await fetch('/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    buyerId: userId,
                    sellerId: productInfo.sellerId,
                    productId: productInfo.productId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create conversation');
            }

            const responseData = await response.json();
            const conversationData = responseData.data || responseData;
            
            console.log('Conversation created:', conversationData);
            
            // Redirect to messaging page with the new conversation
            window.location.href = `/messaging?conversationId=${conversationData.conversation._id}`;
            
        } catch (error) {
            console.error('Error starting conversation:', error);
            alert('Failed to start conversation: ' + error.message);
        }
    }
}

// Initialize messaging dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.messagingDashboard = new MessagingDashboard();
});