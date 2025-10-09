class MessagingSystem {
    constructor() {
        this.currentProductId = null;
        this.currentSellerId = null;
        this.currentProductName = null;
        this.messages = [];
        this.isModalOpen = false;
        this.pollingInterval = null;
        this.pollingDelay = 3000; // 3 seconds
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
        this.loadUserData();
        this.startPolling();
    }

    loadUserData() {
        // Load user data from localStorage (set by the server)
        const userData = localStorage.getItem('user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    createModal() {
        // Create the messaging modal HTML
        const modalHTML = `
            <div id="messagingModal" class="messaging-modal">
                <div class="messaging-content">
                    <div class="messaging-header">
                        <h3 id="modalHeader">Message Supplier</h3>
                        <button class="close-messaging" id="closeMessaging">&times;</button>
                    </div>
                    <div class="messaging-body">
                        <div class="product-info" id="productInfo">
                            <h4 id="productName">Product Name</h4>
                            <p id="productDetails">Loading product details...</p>
                        </div>
                        <div class="messages-container" id="messagesContainer">
                            <div class="loading">Loading messages...</div>
                        </div>
                        <div class="message-input-container">
                            <div class="message-input-wrapper">
                                <textarea 
                                    id="messageInput" 
                                    class="message-input" 
                                    placeholder="Type your message here..."
                                    rows="1"
                                ></textarea>
                                <button id="sendMessage" class="send-button" disabled>
                                    <i class="fa fa-paper-plane" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Debug: Check if modal was created
        const modal = document.getElementById('messagingModal');
        if (modal) {
            console.log('Messaging modal created successfully');
        } else {
            console.error('Failed to create messaging modal');
        }
    }

    bindEvents() {
        // Close modal events
        document.getElementById('closeMessaging').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('messagingModal').addEventListener('click', (e) => {
            if (e.target.id === 'messagingModal') {
                this.closeModal();
            }
        });

        // Send message events
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send message
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        document.getElementById('messageInput').addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
            this.toggleSendButton();
        });

        // Message input events
        document.getElementById('messageInput').addEventListener('input', () => {
            this.toggleSendButton();
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    toggleSendButton() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');
        const hasText = messageInput.value.trim().length > 0;
        
        sendButton.disabled = !hasText;
    }

    openModal(productId, sellerId, productName, productPrice) {
        console.log('Opening modal with:', { productId, sellerId, productName, productPrice });
        
        if (!this.currentUser) {
            alert('Please log in to send messages');
            return;
        }

        this.currentProductId = productId;
        this.currentSellerId = sellerId;
        this.currentProductName = productName;
        this.isModalOpen = true;

        // Update modal header with recipient name
        document.getElementById('modalHeader').textContent = `Message Supplier - ${productName}`;
        
        // Update product info with more details including image
        document.getElementById('productName').textContent = productName;
        document.getElementById('productDetails').innerHTML = `
            <div class="product-info-container">
                <div class="product-image-container">
                    <img src="${this.currentProductImage || '/image/icons8-empty-box-100.png'}" 
                         alt="${productName}" 
                         class="product-image">
                </div>
                <div class="product-details-text">
                    <div class="product-detail-item">
                        <strong>Product:</strong> ${productName}
                    </div>
                    <div class="product-detail-item">
                        <strong>Price:</strong> K${productPrice || 'N/A'}
                    </div>
                    <div class="product-detail-item">
                        <strong>Unit:</strong> ${this.currentProductUnit || 'N/A'}
                    </div>
                    <div class="product-detail-item">
                        <strong>Category:</strong> ${this.currentProductCategory || 'N/A'}
                    </div>
                </div>
            </div>
        `;

        // Show modal
        const modal = document.getElementById('messagingModal');
        if (!modal) {
            console.error('Modal not found! Creating modal...');
            this.createModal();
            return;
        }
        
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Ensure the modal is visible and properly positioned
        modal.style.zIndex = '10000';
        modal.style.position = 'fixed';
        
        console.log('Modal displayed:', modal.style.display);

        // Load messages
        this.loadMessages();

        // Focus on input and ensure it's visible
        setTimeout(() => {
            const messageInput = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendMessage');
            
            if (messageInput && sendButton) {
                messageInput.focus();
                // Ensure input field is visible
                messageInput.style.display = 'block';
                sendButton.style.display = 'flex';
                
                // Enable the send button if there's text
                this.toggleSendButton();
            } else {
                console.error('Message input elements not found');
            }
        }, 300);
    }

    closeModal() {
        const modal = document.getElementById('messagingModal');
        modal.classList.remove('show');
        modal.style.display = 'none';
        this.isModalOpen = false;
        this.messages = [];
    }

    async loadMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '<div class="loading">Loading messages...</div>';

        try {
            const response = await fetch(`/api/messages/${this.currentProductId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const responseData = await response.json();
            
            // Handle new API response format
            this.messages = responseData.data || responseData;
            
            if (!Array.isArray(this.messages)) {
                console.error("Messages data is not an array:", this.messages);
                throw new Error("Invalid messages data format");
            }
            
            this.displayMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
            messagesContainer.innerHTML = '<div class="error-message">Failed to load messages. Please try again.</div>';
        }
    }

    displayMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        
        if (this.messages.length === 0) {
            messagesContainer.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
            return;
        }

        const messagesHTML = this.messages.map(message => {
            // Add null checks for senderId
            const isSent = message.senderId && message.senderId._id === this.currentUser._id;
            const messageTime = this.formatMessageTime(message.createdAt);

            // Get the name to display (sender name for sent messages, receiver name for received messages)
            let displayName = 'Unknown User';
            
            if (isSent) {
                // For sent messages, show the current user's name
                displayName = this.currentUser.username || this.currentUser.email?.split('@')[0] || 'You';
            } else {
                // For received messages, show the sender's name
                if (message.senderId && message.senderId.username) {
                    displayName = message.senderId.username;
                } else if (message.senderId && message.senderId.email) {
                    displayName = message.senderId.email.split('@')[0];
                } else if (message.senderId && typeof message.senderId === 'string') {
                    displayName = 'User';
                }
            }

            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div class="message-bubble">
                        ${this.escapeHtml(message.message)}
                    </div>
                    <div class="message-meta">
                        <div class="message-time">${messageTime}</div>
                        <div class="message-sender">${this.escapeHtml(displayName)}</div>
                    </div>
                </div>
            `;
        }).join('');

        messagesContainer.innerHTML = messagesHTML;
        this.scrollToBottom();
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message) return;

        const sendButton = document.getElementById('sendMessage');
        sendButton.disabled = true;

        try {
            const response = await fetch('/api/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: this.currentProductId,
                    sellerId: this.currentSellerId,
                    message: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send message');
            }

            // Clear input
            messageInput.value = '';
            messageInput.style.height = 'auto';
            this.toggleSendButton();

            // Show success notification
            this.showSuccessNotification('Message sent successfully!');

            // Reload messages to show the new one
            await this.loadMessages();

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            sendButton.disabled = false;
        }
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
        // Create a temporary success notification
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
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = message;
        
        // Add animation keyframes if not already added
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Method to be called from the Message Supplier button
    async openMessageSupplier(productId, sellerId, productName, productPrice, productImage, productUnit, productCategory) {
        // Store additional product details
        this.currentProductImage = productImage;
        this.currentProductUnit = productUnit;
        this.currentProductCategory = productCategory;
        
        // First check if conversation already exists
        const existingConversation = await this.checkExistingConversation(productId, sellerId);
        
        if (existingConversation) {
            // Redirect to existing conversation in messaging dashboard
            this.redirectToExistingConversation(productId);
        } else {
            // Open new conversation modal
            this.openModal(productId, sellerId, productName, productPrice);
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
            
            // Handle new API response format
            const conversations = responseData.data || responseData;
            
            if (!Array.isArray(conversations)) {
                console.error("Conversations data is not an array:", conversations);
                return false;
            }
            console.log('All conversations:', conversations);

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

    // Redirect to existing conversation in messaging dashboard
    redirectToExistingConversation(productId) {
        console.log('Redirecting to existing conversation for product:', productId);
        
        // Show notification
        this.showSuccessNotification('Redirecting to existing conversation...');
        
        // Redirect to messaging dashboard with the specific conversation
        setTimeout(() => {
            // Store the productId in localStorage as backup
            localStorage.setItem('pendingConversationId', productId);
            window.location.href = `/messaging?productId=${productId}`;
        }, 1000);
    }

    // Start polling for new messages
    startPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        this.pollingInterval = setInterval(() => {
            // Only refresh messages if modal is open and we have a conversation
            if (this.isModalOpen && this.currentProductId) {
                this.loadMessages();
            }
        }, this.pollingDelay);
    }

    // Stop polling
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    // Public method to refresh messages
    loadMessages() {
        if (this.currentProductId && this.currentSellerId) {
            this.fetchMessages(this.currentProductId, this.currentSellerId);
        }
    }
}

// Initialize messaging system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.messagingSystem = new MessagingSystem();
});

// Function to be called from the Message Supplier button
function openMessageSupplier(productId, sellerId, productName, productPrice) {
    if (window.messagingSystem) {
        window.messagingSystem.openMessageSupplier(productId, sellerId, productName, productPrice);
    }
}
