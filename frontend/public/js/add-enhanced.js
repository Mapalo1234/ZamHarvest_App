// Enhanced Add Product Page JavaScript

document.addEventListener("DOMContentLoaded", () => {
  // Enhanced form functionality with animations and better UX
  
  const steps = document.querySelectorAll(".form-step");
  const nextBtns = document.querySelectorAll(".next-btn");
  const prevBtns = document.querySelectorAll(".prev-btn");
  const inputFile = document.getElementById("inputFile");
  const imageView = document.getElementById("image-view");
  const form = document.getElementById("productForm");
  const progressFill = document.getElementById("progressFill");
  const stepIndicators = document.querySelectorAll(".step");

  const provinceSelect = document.getElementById("province");
  const locationSelect = document.getElementById("location");
  const isOnPromotionCheckbox = document.getElementById("isOnPromotion");
  const promotionFields = document.getElementById("promotionFields");

  let currentStep = 0;
  let uploadedImage = null;
  let isEdit = false;
  let editId = localStorage.getItem("editProductId");

  // Zambia locations data
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

  // Initialize form
  initializeForm();

  function initializeForm() {
    // Populate provinces
    populateProvinces();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize progress
    updateProgress();
    
    // Check if editing
    if (editId) {
      isEdit = true;
      loadProductForEdit();
    }
  }

  function populateProvinces() {
    Object.keys(zambiaLocations).forEach(province => {
      const option = document.createElement("option");
      option.value = province;
      option.textContent = province;
      provinceSelect.appendChild(option);
    });
  }

  function setupEventListeners() {
    // Province change handler
    provinceSelect.addEventListener("change", handleProvinceChange);
    
    // Promotion toggle handler
    isOnPromotionCheckbox.addEventListener("change", handlePromotionToggle);
    
    // File upload handlers
    inputFile.addEventListener("change", handleFileUpload);
    imageView.addEventListener("click", () => inputFile.click());
    
    // Drag and drop handlers
    const dropArea = document.getElementById("drop-area");
    dropArea.addEventListener("dragover", handleDragOver);
    dropArea.addEventListener("dragleave", handleDragLeave);
    dropArea.addEventListener("drop", handleDrop);
    
    // Navigation handlers
    nextBtns.forEach(btn => btn.addEventListener("click", handleNext));
    prevBtns.forEach(btn => btn.addEventListener("click", handlePrev));
    
    // Form submission
    form.addEventListener("submit", handleSubmit);
    
    // Input validation
    setupInputValidation();
  }

  function handleProvinceChange() {
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
  }

  function handlePromotionToggle() {
    if (isOnPromotionCheckbox.checked) {
      promotionFields.style.display = "block";
      promotionFields.style.animation = "fadeIn 0.3s ease";
    } else {
      promotionFields.style.display = "none";
    }
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("dragover");
  }

  function handleDragLeave(event) {
    event.currentTarget.classList.remove("dragover");
  }

  function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragover");
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function processFile(file) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage = e.target.result;
      imageView.style.backgroundImage = `url(${e.target.result})`;
      imageView.innerHTML = `
        <div class="image-overlay">
          <i class="fas fa-check-circle"></i>
          <p>Image uploaded successfully</p>
          <span>Click to change</span>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }

  function handleNext() {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        // Add animation classes
        steps[currentStep].classList.add("leaving");
        
        setTimeout(() => {
          steps[currentStep].classList.remove("active", "leaving");
          currentStep++;
          steps[currentStep].classList.add("active", "entering");
          
          // Remove entering class after animation
          setTimeout(() => {
            steps[currentStep].classList.remove("entering");
          }, 300);
          
          updateProgress();
        }, 150);
      }
    }
  }

  function handlePrev() {
    if (currentStep > 0) {
      // Add animation classes
      steps[currentStep].classList.add("leaving");
      
      setTimeout(() => {
        steps[currentStep].classList.remove("active", "leaving");
        currentStep--;
        steps[currentStep].classList.add("active", "entering");
        
        // Remove entering class after animation
        setTimeout(() => {
          steps[currentStep].classList.remove("entering");
        }, 300);
        
        updateProgress();
      }, 150);
    }
  }

  function validateCurrentStep() {
    const currentStepElement = steps[currentStep];
    const requiredFields = currentStepElement.querySelectorAll("[required]");
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.style.borderColor = "#ef4444";
        isValid = false;
        
        // Add shake animation
        field.style.animation = "shake 0.5s ease";
        setTimeout(() => {
          field.style.animation = "";
        }, 500);
      } else {
        field.style.borderColor = "#e5e7eb";
      }
    });
    
    if (!isValid) {
      showToast("Please fill in all required fields", "error");
    }
    
    return isValid;
  }

  function updateProgress() {
    const progress = ((currentStep + 1) / steps.length) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Update step indicators
    stepIndicators.forEach((step, index) => {
      step.classList.remove("active", "completed");
      if (index < currentStep) {
        step.classList.add("completed");
      } else if (index === currentStep) {
        step.classList.add("active");
      }
    });
  }

  function setupInputValidation() {
    // Real-time validation for price input
    const priceInput = document.getElementById("price");
    if (priceInput) {
      priceInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        if (value < 0) {
          e.target.value = 0;
        }
      });
    }
    
    // Character counter for description
    const descriptionTextarea = document.getElementById("description");
    if (descriptionTextarea) {
      const maxLength = 500;
      const counter = document.createElement("div");
      counter.className = "char-counter";
      counter.style.cssText = "text-align: right; font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;";
      descriptionTextarea.parentNode.appendChild(counter);
      
      descriptionTextarea.addEventListener("input", (e) => {
        const remaining = maxLength - e.target.value.length;
        counter.textContent = `${e.target.value.length}/${maxLength} characters`;
        counter.style.color = remaining < 50 ? "#ef4444" : "#6b7280";
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateCurrentStep()) {
      return;
    }
    
    const loader = document.getElementById("loader");
    loader.style.display = "flex";
    
    try {
      const formData = new FormData();
      
      // Collect form data
      const formFields = {
        name: document.getElementById("name").value,
        price: parseFloat(document.getElementById("price").value),
        category: document.getElementById("category").value,
        province: document.getElementById("province").value,
        location: document.getElementById("location").value,
        organicStatus: document.getElementById("organicStatus").value,
        description: document.getElementById("description").value,
        availability: document.getElementById("availability").value,
        unit: document.getElementById("unit").value,
        harvestDate: document.getElementById("harvestDate").value,
        expiryDate: document.getElementById("expiryDate").value
      };
      
      // Add promotion data if enabled
      if (isOnPromotionCheckbox.checked) {
        formData.append("isOnPromotion", "true");
        formData.append("promoPrice", document.getElementById("promoPrice").value);
        formData.append("promotionEndDate", document.getElementById("promotionEndDate").value);
      }
      
      // Add image if uploaded
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      }
      
      // Add all form fields
      Object.entries(formFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      const url = isEdit ? `/products/${editId}` : "/products";
      const method = isEdit ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        body: formData,
        credentials: "include"
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast(
          isEdit ? "Product updated successfully!" : "Product created successfully!",
          "success"
        );
        
        // Clear form and redirect
        setTimeout(() => {
          if (isEdit) {
            localStorage.removeItem("editProductId");
          }
          window.location.href = "/view";
        }, 2000);
      } else {
        throw new Error(result.message || "An error occurred");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast(error.message || "Something went wrong. Please try again.", "error");
    } finally {
      loader.style.display = "none";
    }
  }

  async function loadProductForEdit() {
    try {
      const response = await fetch(`/products/${editId}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const product = await response.json();
        populateFormForEdit(product);
      }
    } catch (error) {
      console.error("Error loading product for edit:", error);
      showToast("Error loading product data", "error");
    }
  }

  function populateFormForEdit(product) {
    // Populate all form fields
    Object.keys(product).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.value = product[key] || "";
      }
    });
    
    // Handle promotion fields
    if (product.isOnPromotion) {
      isOnPromotionCheckbox.checked = true;
      handlePromotionToggle();
    }
    
    // Handle image
    if (product.image) {
      uploadedImage = product.image;
      imageView.style.backgroundImage = `url(${product.image})`;
      imageView.innerHTML = `
        <div class="image-overlay">
          <i class="fas fa-check-circle"></i>
          <p>Image loaded</p>
          <span>Click to change</span>
        </div>
      `;
    }
    
    // Update form title
    document.getElementById("formTitle").textContent = "Edit Product";
  }

  function showToast(message, type = "info") {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6",
      stopOnFocus: true
    }).showToast();
  }

  // Add shake animation CSS
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
    }
    
    .image-overlay i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: #10b981;
    }
    
    .image-overlay p {
      font-weight: 600;
      margin: 0;
    }
    
    .image-overlay span {
      font-size: 0.875rem;
      opacity: 0.8;
    }
  `;
  document.head.appendChild(style);
});
