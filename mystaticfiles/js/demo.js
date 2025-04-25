// Typewriter effect
const textArray = [
  "Unlock Your Creativity.",
  "Design Stunning Websites.",
  "Build Something Awesome!",
];
let currentIndex = 0;
let charIndex = 0;
const typingSpeed = 100;
const typewriterElement = document.getElementById("typewriter");

function type() {
  if (charIndex < textArray[currentIndex].length) {
    typewriterElement.textContent += textArray[currentIndex].charAt(charIndex);
    charIndex++;
    setTimeout(type, typingSpeed);
  } else {
    setTimeout(erase, 2000);
  }
}

function erase() {
  if (charIndex > 0) {
    typewriterElement.textContent = textArray[currentIndex].substring(
      0,
      charIndex - 1
    );
    charIndex--;
    setTimeout(erase, typingSpeed / 2);
  } else {
    currentIndex = (currentIndex + 1) % textArray.length;
    setTimeout(type, typingSpeed);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  type();
});
