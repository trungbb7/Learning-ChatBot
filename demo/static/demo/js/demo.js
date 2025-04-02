const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
// const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
// State variables
let userMessage = null;
let isResponseGenerating = false;

let currentChat = "";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  // const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  // Apply the stored theme
  // document.body.classList.toggle("light_mode", isLightMode);
  // toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  // Restore saved chats or clear the chat container
  chatContainer.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats);

  chatContainer.querySelectorAll("pre code").forEach((block) => {
    hljs.highlightElement(block);
  });

  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
};
// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); // Getting text element
  try {
    incomingMessageDiv.classList.add("loading");
    // Send a POST request to the API with the user's message

    // const csrftoken = getCookie("csrftoken");
    // console.log("csrftoken", csrftoken);

    const API_URL = "/chat";
    console.log("userMessage", userMessage);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "X-CSRFToken": csrftoken,
      },
      body: JSON.stringify({
        message: userMessage,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    // Get the API response text and remove asterisks from it
    // const apiResponse = data.candidates[0].content.parts[0].text.replace(
    //   /\*\*(.*?)\*\*/g,
    //   "$1"
    // );

    // showTypingEffect(apiResponse, textElement, incomingMessageDiv); // Show typing effect

    const text = data.response;
    const formattedText = marked.parse(text);
    textElement.innerHTML = formattedText;
  } catch (error) {
    // Handle error
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
    isResponseGenerating = false;
    incomingMessageDiv.querySelector(".icon").classList.remove("hide");
    localStorage.setItem("saved-chats", chatContainer.innerHTML); // Save chats to local storage
    // }

    chatContainer.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });

    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  }
};
// Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="https://png.pngtree.com/png-clipart/20230122/original/pngtree-chatbot-customer-service-clipart-element-png-image_8925859.png" alt=chat bot">
                  <div class="text markdown-body"></div>
                  
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
  const incomingMessageDiv = createMessageElement(html, "incoming");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  generateAPIResponse(incomingMessageDiv);
};
// Copy message text to the clipboard
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done"; // Show confirmation icon
  setTimeout(() => (copyButton.innerText = "content_copy"), 1000); // Revert icon after 1 second
};
// Handle sending outgoing chat messages
const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return; // Exit if there is no message or response is generating
  isResponseGenerating = true;
  const html = `<div class="message-content">
                  <img class="avatar" src="https://www.pngarts.com/files/5/User-Avatar-PNG-Transparent-Image.png" alt="User avatar">
                  <p class="text"></p>
                </div>`;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);

  typingForm.reset(); // Clear input field
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to the bottom
  setTimeout(showLoadingAnimation, 500); // Show loading animation after a delay
};

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
  }
});

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});
loadDataFromLocalstorage();
