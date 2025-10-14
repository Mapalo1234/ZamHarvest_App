// Receipt System for Payment Receipts
class ReceiptSystem {
  constructor() {
    this.currentOrder = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Print receipt button in modal
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    if (printReceiptBtn) {
      printReceiptBtn.addEventListener('click', () => this.printReceipt());
    }

    // Print receipt button in order details
    const printReceiptFromDetailsBtn = document.getElementById('printReceiptFromDetailsBtn');
    if (printReceiptFromDetailsBtn) {
      printReceiptFromDetailsBtn.addEventListener('click', () => this.printReceipt());
    }

    // Close receipt modal when clicking outside
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
      receiptModal.addEventListener('click', (e) => {
        if (e.target === receiptModal) {
          this.closeReceiptModal();
        }
      });
    }
  }

  // Show receipt modal with order data
  showReceipt(orderData) {
    // Check if order is paid, if not show message
    if (!orderData || orderData.paidStatus !== 'Paid') {
      alert('Receipt will be generated once payment is made. Please complete your payment first.');
      return;
    }

    this.currentOrder = orderData;
    const receiptModal = document.getElementById('receiptModal');
    const receiptContent = document.getElementById('receiptContent');
    
    if (receiptModal && receiptContent) {
      receiptContent.innerHTML = this.generateReceiptHTML(orderData);
      receiptModal.style.display = 'flex';
    }
  }

  // Close receipt modal
  closeReceiptModal() {
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
      receiptModal.style.display = 'none';
    }
  }

  // Generate receipt HTML
  generateReceiptHTML(orderData) {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = currentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <div class="receipt">
        <div class="receipt-header">
          <h2 class="receipt-title">ZamHarvest</h2>
          <p class="receipt-subtitle">Payment Receipt</p>
        </div>
        
        <div class="receipt-info">
          <div class="receipt-info-row">
            <span class="receipt-info-label">Receipt #:</span>
            <span class="receipt-info-value">${orderData.orderId || orderData.id}</span>
          </div>
          <div class="receipt-info-row">
            <span class="receipt-info-label">Date:</span>
            <span class="receipt-info-value">${formattedDate}</span>
          </div>
          <div class="receipt-info-row">
            <span class="receipt-info-label">Time:</span>
            <span class="receipt-info-value">${formattedTime}</span>
          </div>
          <div class="receipt-info-row">
            <span class="receipt-info-label">Payment Status:</span>
            <span class="receipt-info-value" style="color: #28a745; font-weight: bold;">PAID</span>
          </div>
        </div>
        
        <div class="receipt-items">
          <div class="receipt-item">
            <div>
              <div class="receipt-item-name">${orderData.productName || 'Product'}</div>
              <div class="receipt-item-details">
                Quantity: ${orderData.quantity || 1} ${orderData.unit || 'unit(s)'}
              </div>
            </div>
            <div>K${orderData.totalPrice || 0}</div>
          </div>
        </div>
        
        <div class="receipt-totals">
          <div class="receipt-total-row">
            <span class="receipt-total-label">Subtotal:</span>
            <span class="receipt-total-value">K${orderData.totalPrice || 0}</span>
          </div>
          <div class="receipt-total-row">
            <span class="receipt-total-label">Total:</span>
            <span class="receipt-total-value">K${orderData.totalPrice || 0}</span>
          </div>
        </div>
        
        <div class="receipt-footer">
          <div class="receipt-thank-you">Thank you for your purchase!</div>
          <div class="receipt-contact">Seller: ${orderData.sellerName || 'Unknown Seller'}</div>
          <div class="receipt-contact">Order ID: ${orderData.orderId || orderData.id}</div>
          <div class="receipt-contact">Keep this receipt for your records</div>
        </div>
      </div>
    `;
  }

  // Print receipt
  printReceipt() {
    if (!this.currentOrder) {
      console.error('No order data available for printing');
      return;
    }

    const printWindow = window.open('', '_blank');
    const receiptHTML = this.generateReceiptHTML(this.currentOrder);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${this.currentOrder.orderId || this.currentOrder.id}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .receipt {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border: 1px solid #ddd;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .receipt-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #333;
          }
          .receipt-subtitle {
            font-size: 14px;
            color: #666;
            margin: 0;
          }
          .receipt-info {
            margin-bottom: 20px;
          }
          .receipt-info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
          }
          .receipt-info-label {
            font-weight: bold;
            color: #333;
          }
          .receipt-info-value {
            color: #666;
          }
          .receipt-items {
            margin-bottom: 20px;
          }
          .receipt-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
          }
          .receipt-item-name {
            font-weight: bold;
            color: #333;
          }
          .receipt-item-details {
            font-size: 12px;
            color: #666;
            margin-top: 2px;
          }
          .receipt-totals {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 20px;
          }
          .receipt-total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .receipt-total-label {
            font-weight: bold;
            color: #333;
          }
          .receipt-total-value {
            font-weight: bold;
            color: #333;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
          .receipt-thank-you {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .receipt-contact {
            margin-bottom: 5px;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .receipt {
              border: none;
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        ${receiptHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  }

  // Show receipt for successful payment
  showPaymentReceipt(orderData) {
    this.showReceipt(orderData);
  }

  // Show receipt from order details
  showOrderReceipt(orderData) {
    this.showReceipt(orderData);
  }
}

// Global functions for backward compatibility
function closeReceiptModal() {
  if (window.receiptSystem) {
    window.receiptSystem.closeReceiptModal();
  }
}

// Initialize receipt system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.receiptSystem = new ReceiptSystem();
});
