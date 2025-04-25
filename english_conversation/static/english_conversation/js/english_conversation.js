let currentScenario = null;
let bot_role = null;
let scenarioDescription = null;

let currentConversationId = null;

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

// Document ready event
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing application...");

  // Initialize theme
  initTheme();

  // Set up scenario selection
  document.querySelectorAll(".scenario-card").forEach((card) => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".scenario-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      currentScenario = card.dataset.scenario;
      bot_role = card.dataset.botRole;
      if (currentScenario !== "custom") {
        scenarioDescription = card.dataset.scenarioDescription;
      } else {
      }

      // Toggle custom scenario input container visibility
      const customScenarioContainer = document.getElementById(
        "custom-scenario-container"
      );
      if (customScenarioContainer) {
        if (currentScenario === "custom") {
          customScenarioContainer.classList.add("active");
          // Focus the input
          document.getElementById("custom-scenario-input").focus();
        } else {
          customScenarioContainer.classList.remove("active");
        }
      }
    });
  });

  // Initialize history list
  updateHistoryList();

  // Set up input event handlers
  const userInput = document.getElementById("user-input");
  if (userInput) {
    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Debug info
  console.log("Application initialized successfully");
});

// Update history list with delete buttons for each conversation
async function updateHistoryList() {
  const historyList = document.getElementById("history-list");
  if (!historyList) return;

  try {
    const response = await fetch("/api/conversation-history", {
      method: "GET",
    });

    const data = await response.json();
    const conversations = data.history;
    historyList.innerHTML = conversations
      .map(
        (conv) => `
    <div class="history-item" data-id="${conv.id}">
      <div class="history-content" onclick="loadConversation(${conv.id})">
        <div class="scenario">${conv.title || conv.scenario}</div>
        <div class="preview">${conv.preview}</div>
        <div class="date">${conv.date}</div>
      </div>
      <button class="delete-conversation-btn" onclick="deleteConversation(${
        conv.id
      }, event)">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `
      )
      .join("");
  } catch (e) {
    console.error(e.message);
  }
}

// Function to delete a specific conversation
async function deleteConversation(id, event) {
  // Stop event propagation to prevent loading the conversation when deleting it
  if (event) {
    event.stopPropagation();
  }

  // Ask for confirmation
  if (confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại này?")) {
    try {
      const response = await fetch(`/api/english-conversation/delete`, {
        method: "POST",
        body: JSON.stringify({
          id: id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.log(data.message);
      } else {
        const data = await response.json();
        console.log(data.message);

        // If we deleted the current conversation, reset currentConversationId
        if (currentConversationId === id) {
          currentConversationId = null;

          // Clear the chat messages
          const chatMessages = document.getElementById("chat-messages");
          if (chatMessages) {
            chatMessages.innerHTML = "";
          }
        }

        // Update the UI
        updateHistoryList();
      }
    } catch (e) {
      console.error(e.message);
    }

    console.log(`Conversation ${id} deleted successfully`);
    // }
  }
}

function scrollIntoInput() {
  setTimeout(() => {
    const conversationArea = document.querySelector(".conversation-area");
    const chatMessagesArea = document.getElementById("chat-messages");

    chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

    conversationArea.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, 100);
}

async function loadConversation(id) {
  try {
    const response = await fetch(`/api/get-conversation/${id}`);

    const conversation = await response.json();
    console.log("conversation: ", conversation);
    if (!conversation) return;

    // Update UI
    document.querySelectorAll(".scenario-card").forEach((card) => {
      card.classList.toggle(
        "active",
        card.dataset.scenario === conversation.scenario
      );
    });

    // Clear current conversation
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      chatMessages.innerHTML = "";
    }

    // hide feedback
    const feedbackDiv = document.getElementById("feedback");
    feedbackDiv.style.display = "none";

    // Load conversation
    currentScenario = conversation.scenario;
    currentConversationId = conversation.id; // Set current conversation ID
    // conversationHistory = [...conversation.messages];

    // Display messages
    conversation.messages.forEach((msg) => {
      addMessage(msg.content, msg.role, msg.feedback);
    });

    // Update active state in history
    document.querySelectorAll(".history-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.id === id.toString());
    });

    scrollIntoInput();
  } catch (e) {
    console.error(e);
  }
}

async function clearHistory() {
  if (confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử hội thoại?")) {
    try {
      const response = await fetch("/api/english-conversation/delete-all", {
        method: "POST",
      });
      if (!response.ok) {
        console.log("Remove unsuccessful");
      } else {
        currentConversationId = null; // Reset current conversation ID
        updateHistoryList();

        // Clear the current conversation display
        const chatMessages = document.getElementById("chat-messages");
        if (chatMessages) {
          chatMessages.innerHTML = "";
        }

        console.log("All conversation history cleared");
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

// Add loading indicator function
function showLoadingIndicator() {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  // Create loading indicator element
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "message bot loading-indicator";
  loadingDiv.id = "typing-indicator";

  // Create typing animation dots
  const dotsContainer = document.createElement("div");
  dotsContainer.className = "typing-dots";

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    dotsContainer.appendChild(dot);
  }

  loadingDiv.appendChild(dotsContainer);
  chatMessages.appendChild(loadingDiv);

  // Scroll to show loading indicator
  scrollIntoInput();
}

function removeLoadingIndicator() {
  const loadingIndicator = document.getElementById("typing-indicator");
  if (loadingIndicator && loadingIndicator.parentNode) {
    loadingIndicator.parentNode.removeChild(loadingIndicator);
  }
}

// Update sendMessage function
async function sendMessage() {
  const userInput = document.getElementById("user-input");
  if (!userInput) {
    console.error("User input element not found");
    return;
  }

  const text = userInput.value.trim();
  if (!text) return;

  // Disable input while processing
  userInput.disabled = true;
  const sendButton = document.querySelector(".send-btn");
  if (sendButton) sendButton.disabled = true;

  // Add user message
  addMessage(text, "user");
  userInput.value = "";

  // Show loading indicator
  showLoadingIndicator();

  try {
    const response = await fetch("api/english-conversation/continue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: currentConversationId,
        user_message: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    // Remove loading indicator before adding the response
    removeLoadingIndicator();

    const responseText = data.message;
    const feedback = data.feedback;

    if (responseText) {
      addMessage(responseText, "bot");
    }

    // Update the feedback for the user's message in conversationHistory
    if (feedback) {
      // Update the feedback for the user's message in conversationHistory
      showFeedback(feedback);

      // Update the message element with feedback
      const messages = document.querySelectorAll(".message.user");
      const lastUserMessageElement = messages[messages.length - 1];
      if (lastUserMessageElement) {
        lastUserMessageElement.setAttribute("data-feedback", feedback);
      }
    }
  } catch (error) {
    // Remove loading indicator on error
    removeLoadingIndicator();

    console.error("Error:", error);
    addMessage("I'm sorry, I encountered an error. Please try again.", "bot");
  } finally {
    // Re-enable input
    userInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
  }
}

function showFeedback(feedback) {
  const feedbackDiv = document.getElementById("feedback");
  if (!feedbackDiv) {
    console.error("Feedback element not found");
    return;
  }

  feedbackDiv.textContent = feedback;
  feedbackDiv.style.display = "block";
  feedbackDiv.className = "feedback grammar";

  scrollIntoInput();
}

function addMessage(text, sender, feedback = null) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    console.error("Chat messages container not found");
    return;
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = text;

  // Add feedback data attribute if available
  if (feedback) {
    messageDiv.setAttribute("data-feedback", feedback);
  }

  chatMessages.appendChild(messageDiv);

  scrollIntoInput();

  // Log the message for debugging
  console.log(`Added ${sender} message:`, text);
}

// Custom scenario handling
function startCustomScenario() {
  const customScenarioInput = document.getElementById("custom-scenario-input");
  const customRoleInput = document.getElementById("custom-role-input");
  if (!customScenarioInput || !customRoleInput) return;

  const scenarioDescriptionData = customScenarioInput.value.trim();
  const roleDescriptionData = customRoleInput.value.trim();

  if (!scenarioDescriptionData) {
    alert("Vui lòng nhập mô tả tình huống trước khi bắt đầu.");
    customScenarioInput.focus();
    return;
  }

  if (!roleDescriptionData) {
    alert("Vui lòng nhập vai trò của người đối thoại trước khi bắt đầu.");
    customRoleInput.focus();
    return;
  }

  scenarioDescription = scenarioDescriptionData;
  bot_role = roleDescriptionData;

  startConversation();
}

async function startConversation() {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    console.error("Chat messages container not found");
    return;
  }

  if (!currentScenario || !scenarioDescription) {
    alert("Vui lòng chọn chủ đề");
    return;
  }

  // hide feedback
  const feedbackDiv = document.getElementById("feedback");
  feedbackDiv.style.display = "none";

  // Clear the chat messages
  chatMessages.innerHTML = "";

  // Show loading indicator
  showLoadingIndicator();

  try {
    // Generate initial message based on custom scenario
    const response = await fetch("/api/english-conversation/get-init-message", {
      method: "POST",
      body: JSON.stringify({
        scenario: currentScenario,
        description: scenarioDescription,
        bot_role: bot_role,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    updateHistoryList();

    const data = await response.json();

    const initialMessage = data.message;
    const conversationId = data.conversation_id;

    // Remove loading indicator
    removeLoadingIndicator();

    // Display the initial message
    if (initialMessage && conversationId) {
      addMessage(initialMessage, "bot");
      currentConversationId = conversationId;
    }
  } catch (error) {
    // Remove loading indicator if still present
    removeLoadingIndicator();

    console.error("Error:", error);
    addMessage(
      "I'm sorry, I encountered an error starting the conversation. Please try again.",
      "bot"
    );
  }
}
