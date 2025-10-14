document.addEventListener("DOMContentLoaded", () => {
  const tabButtons = document.querySelectorAll(".tab_btn");
  const productItems = document.querySelectorAll(".product-item");
  const mobileDropdownIcon = document.getElementById("mobileDropdownIcon");
  const mobileDropdownMenu = document.getElementById("mobileDropdownMenu");
  const dropdownItems = document.querySelectorAll(".dropdown-item");

  // Function to filter products
  function filterProducts(category) {
    productItems.forEach(item => {
      const itemCategory = item.dataset.category ? item.dataset.category.toLowerCase() : '';

      if (category === "tab1" || category === "all" || itemCategory === category) {
        item.style.display = "block"; // show
      } else {
        item.style.display = "none";  // hide
      }
    });
  }

  // Function to update active states
  function updateActiveStates(category) {
    // Update tab buttons
    tabButtons.forEach(btn => {
      btn.classList.remove("active");
      if (btn.id === category || (category === "all" && btn.id === "tab1")) {
        btn.classList.add("active");
      }
    });

    // Update dropdown items
    dropdownItems.forEach(item => {
      item.classList.remove("active");
      if (item.dataset.category === category) {
        item.classList.add("active");
      }
    });
  }

  // Handle tab clicks
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const category = btn.id; // id is fruits, vegetables, meat, or tab1 (All)
      filterProducts(category);
      updateActiveStates(category);
    });
  });

  // Handle mobile dropdown icon click
  if (mobileDropdownIcon && mobileDropdownMenu) {
    mobileDropdownIcon.addEventListener("click", () => {
      mobileDropdownMenu.classList.toggle("show");
      mobileDropdownIcon.classList.toggle("active");
    });

    // Handle dropdown item clicks
    dropdownItems.forEach(item => {
      item.addEventListener("click", () => {
        const category = item.dataset.category;
        filterProducts(category);
        updateActiveStates(category);

        // Close dropdown
        mobileDropdownMenu.classList.remove("show");
        mobileDropdownIcon.classList.remove("active");
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileDropdownIcon.contains(e.target) && !mobileDropdownMenu.contains(e.target)) {
        mobileDropdownMenu.classList.remove("show");
        mobileDropdownIcon.classList.remove("active");
      }
    });
  }
});