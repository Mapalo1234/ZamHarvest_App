const loginForm = document.querySelector(".login-form");
const registerForm = document.querySelector(".register-form");
const wrapper = document.querySelector(".wrapper");
const loginTitle = document.querySelector(".title-login");
const registerTitle = document.querySelector(".title-register");
const signUpBtn = document.querySelector("#SignUpBtn");
const signInBtn = document.querySelector("#SignInBtn");
const loginIcon = document.getElementById("loginIcon");
const loginDropdown = document.getElementById("loginDropdown");

function loginFunction() {
  loginForm.style.left = "50%";
  loginForm.style.opacity = 1;
  registerForm.style.left = "150%";
  registerForm.style.opacity = 0;
  wrapper.style.height = "500px";
  loginTitle.style.top = "50%";
  loginTitle.style.opacity = 1;
  registerTitle.style.top = "50px";
  registerTitle.style.opacity = 0;
}

function registerFunction() {
  loginForm.style.left = "-50%";
  loginForm.style.opacity = 0;
  registerForm.style.left = "50%";
  registerForm.style.opacity = 1;
  wrapper.style.height = "580px";
  loginTitle.style.top = "-60px";
  loginTitle.style.opacity = 0;
  registerTitle.style.top = "50%";
  registerTitle.style.opacity = 1;
}



if (loginIcon && loginDropdown) {
  loginIcon.addEventListener("click", () => {
    // Update dropdown content before showing (if auth manager exists)
    if (window.authManager) {
      window.authManager.updateLoginDropdown();
    }
    
    loginDropdown.style.display =
      loginDropdown.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", (event) => {
    if (!loginIcon.contains(event.target) && !loginDropdown.contains(event.target)) {
      loginDropdown.style.display = "none";
    }
  });
}




