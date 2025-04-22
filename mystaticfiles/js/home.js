// Theme handling
function toggleTheme() {
  const body = document.body;
  const isDark = body.getAttribute("data-theme") === "dark";
  const newTheme = isDark ? "light" : "dark";

  // Apply transition class for smooth transition
  body.classList.add("theme-transition");

  // Update theme
  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update icon
  updateThemeIcon();

  // Remove transition class after transition completes
  setTimeout(() => {
    body.classList.remove("theme-transition");
  }, 500);

  console.log(`Theme changed to: ${newTheme}`);
}

function updateThemeIcon() {
  const icon = document.querySelector(".theme-toggle i");
  if (icon) {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  } else {
    console.warn("Theme toggle icon not found");
  }
}

// Initialize theme
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);
  console.log(`Initialized theme: ${savedTheme}`);
  updateThemeIcon();
}

// Typewriter effect
class Typewriter {
  constructor(element, words, wait = 3000) {
    this.element = element;
    this.words = words;
    this.txt = "";
    this.wordIndex = 0;
    this.wait = parseInt(wait, 10);
    this.type();
    this.isDeleting = false;
  }

  type() {
    const current = this.wordIndex % this.words.length;
    const fullTxt = this.words[current];

    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }

    this.element.innerHTML = `<span class="txt">${this.txt}</span>`;

    let typeSpeed = 80;

    if (this.isDeleting) {
      typeSpeed /= 2;
    }

    if (!this.isDeleting && this.txt === fullTxt) {
      typeSpeed = this.wait;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === "") {
      this.isDeleting = false;
      this.wordIndex++;
      typeSpeed = 500;
    }

    setTimeout(() => this.type(), typeSpeed);
  }
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing application...");

  // Initialize theme
  initTheme();

  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active");

      // Toggle between menu and close icon
      const icon = mobileMenuBtn.querySelector("i");
      if (icon) {
        if (navLinks.classList.contains("active")) {
          icon.className = "fas fa-times";
        } else {
          icon.className = "fas fa-bars";
        }
      }
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 992) {
          navLinks.classList.remove("active");
          const icon = mobileMenuBtn.querySelector("i");
          if (icon) {
            icon.className = "fas fa-bars";
          }
        }
      });
    });
  }

  // Initialize typewriter if element exists
  const txtElement = document.querySelector("#typewriter");
  if (txtElement) {
    const words = [
      "Học Tập Thông Minh với AI",
      "Hỗ Trợ 24/7",
      "Giải Pháp Học Tập Tối Ưu",
    ];
    const wait = 3000;
    new Typewriter(txtElement, words, wait);
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetElement = document.querySelector(this.getAttribute("href"));
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Feature items animation on scroll
  const featureItems = document.querySelectorAll(".feature-item");

  if (featureItems.length > 0) {
    // Add animation class for CSS transitions
    featureItems.forEach((item) => {
      item.classList.add("feature-animate");
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate");
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    featureItems.forEach((item) => {
      observer.observe(item);
    });
  }

  // Parallax effect for hero section
  const hero = document.querySelector(".hero");
  if (hero) {
    window.addEventListener("scroll", () => {
      const scrolled = window.pageYOffset;
      hero.style.backgroundPositionY = -(scrolled * 0.3) + "px";
    });
  }

  // Navbar scroll effect
  const mainNav = document.querySelector(".main-nav");
  if (mainNav) {
    let lastScroll = 0;

    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= 50) {
        mainNav.classList.remove("scrolled");
        return;
      }

      mainNav.classList.add("scrolled");

      if (
        currentScroll > lastScroll &&
        !mainNav.classList.contains("scroll-down")
      ) {
        // Scrolling down
        mainNav.classList.remove("scroll-up");
        mainNav.classList.add("scroll-down");
      } else if (
        currentScroll < lastScroll &&
        mainNav.classList.contains("scroll-down")
      ) {
        // Scrolling up
        mainNav.classList.remove("scroll-down");
        mainNav.classList.add("scroll-up");
      }

      lastScroll = currentScroll;
    });
  }

  // Form validation for contact form
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = contactForm.querySelector('input[name="name"]');
      const email = contactForm.querySelector('input[name="email"]');
      const message = contactForm.querySelector('textarea[name="message"]');

      if (!name || !email || !message) {
        console.warn("Form elements not found");
        return;
      }

      if (!name.value || !email.value || !message.value) {
        alert("Vui lòng điền đầy đủ thông tin");
        return;
      }

      if (!isValidEmail(email.value)) {
        alert("Vui lòng nhập email hợp lệ");
        return;
      }

      // Here you would typically send the form data to your server
      alert(
        "Cảm ơn bạn đã gửi tin nhắn! Chúng tôi sẽ phản hồi sớm nhất có thể."
      );
      contactForm.reset();
    });
  }

  // Debug info
  console.log("Application initialized successfully");
});

// Helper function for email validation
function isValidEmail(email) {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
