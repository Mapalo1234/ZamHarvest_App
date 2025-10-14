const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("input-file");
const imageView = document.getElementById("image-view");

inputFile.addEventListener("change", uploadImage);

function uploadImage() {
  const imageLink = URL.createObjectURL(inputFile.files[0]);
  imageView.style.backgroundImage = `url(${imageLink})`;
  imageView.textContent = ""; // clears inner text/icon
}

dropArea.addEventListener("dragover", function(e){
  e.preventDefault();
});

dropArea.addEventListener("drop", function(e){
  e.preventDefault();
  inputFile.files = e.dataTransfer.files;
  uploadImage();
});
