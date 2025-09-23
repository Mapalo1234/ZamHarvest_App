// Simple test script to create sample notifications
// Run this in your browser console after logging in

async function createTestNotifications() {
  try {
    // Get current user
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      console.log('Please log in first');
      return;
    }

    console.log('Creating test notifications for user:', user.username);

    // Create sample notifications
    const testNotifications = [
      {
        type: 'order_created',
        title: 'Order Confirmed',
        message: 'Your order for Fresh Tomatoes has been confirmed and is being processed.',
        data: {
          orderId: 'ORD-TEST-001',
          amount: 25.50
        }
      },
      {
        type: 'delivery_scheduled',
        title: 'Delivery Scheduled',
        message: 'Your order ORD-TEST-001 is scheduled for delivery tomorrow at 2:00 PM.',
        data: {
          orderId: 'ORD-TEST-001',
          deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      },
      {
        type: 'payment_received',
        title: 'Payment Received',
        message: 'Payment of $45.00 has been received for order ORD-TEST-002.',
        data: {
          orderId: 'ORD-TEST-002',
          amount: 45.00
        }
      }
    ];

    // Create notifications via API
    for (const notification of testNotifications) {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          userModel: user.role === 'buyer' ? 'Buyer' : 'Seller',
          ...notification
        })
      });

      if (response.ok) {
        console.log('Created notification:', notification.title);
      } else {
        console.error('Failed to create notification:', notification.title);
      }
    }

    console.log('Test notifications created! Check your notification bell icon.');
    
    // Refresh the notification system if it exists
    if (window.notificationSystem) {
      window.notificationSystem.refresh();
    }

  } catch (error) {
    console.error('Error creating test notifications:', error);
  }
}

// Run the test
createTestNotifications();
