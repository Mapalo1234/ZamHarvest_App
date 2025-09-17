document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab_btn");
  const productItems = document.querySelectorAll(".product-item"); 
  // 👆 each product card/row should have class="product-item" and data-category="fruits" etc

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const category = btn.id; // id is fruits, vegetables, meat, or tab1 (All)

      productItems.forEach(item => {
        const itemCategory = item.dataset.category.toLowerCase();

        if (category === "tab1" || itemCategory === category) {
          item.style.display = "block"; // show
        } else {
          item.style.display = "none";  // hide
        }
      });
    });
  });
});
