window.addEventListener("load", () => {
  const loaderWrapper = document.querySelector(".loader-wrapper");
  if (loaderWrapper) {
    loaderWrapper.style.opacity = "0";
    setTimeout(() => {
      loaderWrapper.style.display = "none";
    }, 500); // wait for fade-out
  }
});
