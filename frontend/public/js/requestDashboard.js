document.addEventListener("DOMContentLoaded", async () => {
  //  Get sellerId from localStorage
  const seller = JSON.parse(localStorage.getItem('user'));
  const sellerId = seller ? seller.id : null;
  console.log("Seller ID:", sellerId);
  if (!sellerId) {
    document.querySelector('.orderInfo').innerHTML =
      '<tr><td colspan="8">Seller not logged in.</td></tr>';
    return;
  }

  try {
    const res = await fetch(`/requests/seller/${sellerId}`);
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
    document.querySelector('.orderInfo').innerHTML =
      '<tr><td colspan="8">Error loading requests.</td></tr>';
    console.error(err);
  }
});
