document.addEventListener("DOMContentLoaded", async () => {
  console.log("Request dashboard loaded");
  
  // Show loading state
  document.querySelector('.orderInfo').innerHTML =
    '<tr><td colspan="8">Loading requests...</td></tr>';

  try {
    // Use the new route that doesn't require sellerId in URL
    const res = await fetch('/requests/seller/test', {
      method: 'GET',
      credentials: 'same-origin', // Include cookies for session
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("API Error:", errorData);
      
      if (res.status === 403) {
        document.querySelector('.orderInfo').innerHTML =
          '<tr><td colspan="8">Please log in as a seller to view requests.</td></tr>';
      } else {
        document.querySelector('.orderInfo').innerHTML =
          '<tr><td colspan="8">Error: ' + (errorData.error || 'Failed to load requests') + '</td></tr>';
      }
      return;
    }
    
    const data = await res.json();
    console.log("Fetched Requests:", data);

    if (!data.requests || data.requests.length === 0) {
      document.querySelector('.orderInfo').innerHTML =
        '<tr><td colspan="8">No requests found.</td></tr>';
      return;
    }

    const rows = data.requests.map(req => `
      <tr>
        <td>${req.product?.name || 'N/A'}</td>
        <td>${req.buyer?.username || 'N/A'}</td>
        <td>${req.order?.quantity || 'N/A'}</td>
        <td>${req.order?.unit || 'N/A'}</td>
        <td>
          <span class="price-value">${req.order?.totalPrice || '0'}</span>
          <button class="edit-price-btn" data-id="${req._id}">Edit</button>
        </td>
        <td>${req.order?.deliveryDate ? new Date(req.order.deliveryDate).toLocaleDateString() : 'N/A'}</td>
        <td>${req.status || 'pending'}</td>
        <td>
          <button class="accept-btn" data-id="${req._id}">Accept</button>
          <button class="cancel-btn" data-id="${req._id}">Cancel</button>
        </td>
      </tr>
    `).join('');

    document.querySelector('.orderInfo').innerHTML = rows;

  } catch (err) {
    console.error("Network error:", err);
    document.querySelector('.orderInfo').innerHTML =
      '<tr><td colspan="8">Network error. Please check your connection and try again.</td></tr>';
  }
});
