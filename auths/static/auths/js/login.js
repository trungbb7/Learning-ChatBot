document.addEventListener("DOMContentLoaded", function () {
  // Hiệu ứng cho input khi focus
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="password"]'
  );
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
    });
    input.addEventListener("blur", function () {
      if (!this.value) {
        this.parentElement.classList.remove("focused");
      }
    });
  });

  // Hiệu ứng cho nút đăng nhập
  const loginButton = document.querySelector(".button input");
  loginButton.addEventListener("mouseover", function () {
    this.style.transform = "translateY(-2px)";
  });
  loginButton.addEventListener("mouseout", function () {
    this.style.transform = "translateY(0)";
  });

  // Hiệu ứng cho form khi submit
  const form = document.querySelector("form");
  form.addEventListener("submit", function (e) {
    if (!this.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
      this.classList.add("was-validated");
    }
  });

  // Hiệu ứng cho các link
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    link.addEventListener("mouseover", function () {
      this.style.transform = "scale(1.05)";
    });
    link.addEventListener("mouseout", function () {
      this.style.transform = "scale(1)";
    });
  });

  // Hiệu ứng cho icon
  const icons = document.querySelectorAll(".row i");
  icons.forEach((icon) => {
    icon.addEventListener("mouseover", function () {
      this.style.transform = "scale(1.1)";
    });
    icon.addEventListener("mouseout", function () {
      this.style.transform = "scale(1)";
    });
  });
});
