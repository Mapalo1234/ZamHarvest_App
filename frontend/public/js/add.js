document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".form-step");
  const nextBtns = document.querySelectorAll(".next-btn");
  const prevBtns = document.querySelectorAll(".prev-btn");
  const inputFile = document.getElementById("inputFile");
  const imageView = document.getElementById("image-view");
  const form = document.getElementById("productForm");

  const provinceSelect = document.getElementById("province");
  const locationSelect = document.getElementById("location");
  const isOnPromotionCheckbox = document.getElementById("isOnPromotion");
  const promotionFields = document.getElementById("promotionFields");

  let currentStep = 0;
  let uploadedImage = null;
  let isEdit = false;
  let editId = localStorage.getItem("editProductId");

  const zambiaLocations = {
    Central: ["Kabwe", "Kapiri Mposhi", "Serenje", "Mkushi", "Chibombo"],
    Copperbelt: ["Ndola", "Kitwe", "Chingola", "Mufulira", "Luanshya"],
    Eastern: ["Chipata", "Katete", "Petauke", "Lundazi"],
    Luapula: ["Mansa", "Samfya", "Nchelenge", "Mwense"],
    Lusaka: ["Lusaka", "Chongwe", "Kafue"],
    Muchinga: ["Chinsali", "Mpika", "Isoka"],
    Northern: ["Kasama", "Mbala", "Luwingu"],
    "North-Western": ["Solwezi", "Mwinilunga", "Zambezi"],
    Southern: ["Livingstone", "Choma", "Mazabuka", "Monze"],
    Western: ["Mongu", "Senanga", "Kaoma"]
  };

  Object.keys(zambiaLocations).forEach(province => {
    const option = document.createElement("option");
    option.value = province;
    option.textContent = province;
    provinceSelect.appendChild(option);
  });

  provinceSelect.addEventListener("change", () => {
    const selected = provinceSelect.value;
    locationSelect.innerHTML = '<option value="">Select Town</option>';
    if (zambiaLocations[selected]) {
      zambiaLocations[selected].forEach(town => {
        const option = document.createElement("option");
        option.value = town;
        option.textContent = town;
        locationSelect.appendChild(option);
      });
    }
  });

  // Promotion toggle functionality
  isOnPromotionCheckbox.addEventListener("change", () => {
    if (isOnPromotionCheckbox.checked) {
      promotionFields.style.display = "block";
    } else {
      promotionFields.style.display = "none";
      // Clear promotion fields when unchecked
      document.getElementById("promoPrice").value = "";
      document.getElementById("promotionEndDate").value = "";
    }
  });

  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle("active", i === index);
    });
  }

  function validateStep(index) {
    const inputs = steps[index].querySelectorAll("input, select, textarea");
    for (const input of inputs) {
      if (input.hasAttribute("required") && !input.value.trim()) {
        alert(`Please fill in the required field: ${input.placeholder || input.id || 'this field'}`);
        input.focus();
        return false;
      }
      if (input.type === "number" && input.value && Number(input.value) < 0) {
        alert("Price cannot be negative.");
        input.focus();
        return false;
      }
    }
    return true;
  }

  nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (validateStep(currentStep)) {
        if (currentStep < steps.length - 1) {
          currentStep++;
          showStep(currentStep);
        }
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  });

  const dropArea = document.getElementById("drop-area");

  dropArea.addEventListener("click", () => inputFile.click());

  dropArea.addEventListener("dragover", e => {
    e.preventDefault();
    dropArea.classList.add("drag-over");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("drag-over");
  });

  dropArea.addEventListener("drop", e => {
    e.preventDefault();
    dropArea.classList.remove("drag-over");
    if (e.dataTransfer.files.length) {
      handleImage(e.dataTransfer.files[0]);
      inputFile.files = e.dataTransfer.files;
    }
  });

  inputFile.addEventListener("change", () => {
    if (inputFile.files.length) {
      handleImage(inputFile.files[0]);
    }
  });

  function handleImage(file) {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        imageView.style.backgroundImage = `url(${reader.result})`;
        imageView.innerHTML = "";
        uploadedImage = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a valid image file.");
      uploadedImage = null;
      inputFile.value = "";
      imageView.style.backgroundImage = "";
      imageView.innerHTML = '<i class="fa fa-upload"></i><p>Upload Image</p>';
    }
  }

  // ✅ Load data if in edit mode
  if (editId) {
    console.log("Edit mode detected, fetching product data for ID:", editId);
    
    // Fetch product data from server instead of localStorage
    fetch('/products')
      .then(response => response.json())
      .then(responseData => {
        // Handle new API response format
        const products = responseData.data || responseData;
        
        if (!Array.isArray(products)) {
          console.error("Products data is not an array:", products);
          alert("Error: Unable to load products for editing.");
          return;
        }
        
        const product = products.find(p => p._id === editId);
        console.log("Editing product:", product);
        
        if (product) {
          isEdit = true;
          document.getElementById("formTitle").textContent = "Edit Product";
          console.log("Product data for editing:", product);

      // Populate all fields with proper fallbacks
      document.getElementById("name").value = product.name || "";
      document.getElementById("price").value = product.price || "";
      document.getElementById("category").value = product.category || "";
      provinceSelect.value = product.province || "";

      // Trigger town list population and wait for it to complete
      if (product.province) {
        provinceSelect.dispatchEvent(new Event("change"));
        // Use setTimeout to ensure the location options are populated before setting the value
        setTimeout(() => {
          locationSelect.value = product.location || "";
        }, 100);
      }
      
      document.getElementById("availability").value = product.availability || "Available";
      document.getElementById("organicStatus").value = product.organicStatus || "Non-Organic";
      document.getElementById("description").value = product.description || "";
          document.getElementById("unit").value = product.unit || "kg";
          document.getElementById("harvestDate").value = product.harvestDate || "";
          document.getElementById("expiryDate").value = product.expiryDate || "";

          // Populate promotion fields
          if (product.isOnPromotion) {
            isOnPromotionCheckbox.checked = true;
            promotionFields.style.display = "block";
            document.getElementById("promoPrice").value = product.promoPrice || "";
            document.getElementById("promotionEndDate").value = product.promotionEndDate || "";
          } else {
            isOnPromotionCheckbox.checked = false;
            promotionFields.style.display = "none";
          }

          if (product.image) {
            imageView.style.backgroundImage = `url(${product.image})`;
            imageView.innerHTML = "";
            uploadedImage = product.image;
          }

          // Verify field population after a short delay
          setTimeout(() => {
            console.log("Field population verification:");
            console.log("Name:", document.getElementById("name").value);
            console.log("Price:", document.getElementById("price").value);
            console.log("Category:", document.getElementById("category").value);
            console.log("Province:", provinceSelect.value);
            console.log("Location:", locationSelect.value);
            console.log("Availability:", document.getElementById("availability").value);
            console.log("Organic Status:", document.getElementById("organicStatus").value);
            console.log("Description:", document.getElementById("description").value);
            console.log("Unit:", document.getElementById("unit").value);
            console.log("Harvest Date:", document.getElementById("harvestDate").value);
            console.log("Expiry Date:", document.getElementById("expiryDate").value);
          }, 200);
        } else {
          console.error("Product not found with ID:", editId);
          alert("Product not found. Redirecting to add new product.");
          localStorage.removeItem("editProductId");
        }
      })
      .catch(error => {
        console.error("Error fetching product data:", error);
        alert("Error loading product data. Please try again.");
        localStorage.removeItem("editProductId");
      });
  }

  // ✅ Submit form (Handle Add or Edit)
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    if (!uploadedImage) {
      alert("Please upload an image.");
      return;
    }

    const productData = {
      name: document.getElementById("name").value.trim(),
      price: Number(document.getElementById("price").value.trim()),
      category: document.getElementById("category").value,
      province: provinceSelect.value,
      availability: document.getElementById("availability").value || "Available",
      location: locationSelect.value,
      organicStatus: document.getElementById("organicStatus").value || "Non-Organic",
      description: document.getElementById("description").value.trim(),
      image: uploadedImage,
      unit: document.getElementById("unit").value || "kg",
      harvestDate: document.getElementById("harvestDate").value || null,
      expiryDate: document.getElementById("expiryDate").value || null,
      isOnPromotion: isOnPromotionCheckbox.checked,
      promoPrice: isOnPromotionCheckbox.checked ? Number(document.getElementById("promoPrice").value) || null : null,
      promotionEndDate: isOnPromotionCheckbox.checked ? (document.getElementById("promotionEndDate").value || null) : null
    };

    try {
      const url = isEdit ? `/product/${editId}` : "/submit-product";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      });

      const result = await response.text();
       alert(result);

      // ✅ Clear edit mode
      if (isEdit) {
        localStorage.removeItem("editProductId");
      }

      window.location.href = "/view";
    } catch (error) {
      console.error("Error submitting product:", error);
      alert("Failed to submit product.");
    }
  });

  showStep(currentStep);
});
