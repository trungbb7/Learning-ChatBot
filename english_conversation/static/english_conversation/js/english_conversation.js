const API_KEY = "";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

let currentScenario = null;
let conversationHistory = [];
let savedConversations = JSON.parse(
  localStorage.getItem("conversations") || "[]"
);
let currentConversationId = null; // Track current conversation ID

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

  // Set up scenario selection
  document.querySelectorAll(".scenario-card").forEach((card) => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".scenario-card")
        .forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      currentScenario = card.dataset.scenario;

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
          // Start pre-defined scenario conversation
          startConversation();
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

// Conversation history handling
function saveConversation(customDescription = null) {
  if (conversationHistory.length === 0) return;

  const conversationData = {
    id: currentConversationId || Date.now(),
    scenario: currentScenario,
    messages: [...conversationHistory],
    date: new Date().toLocaleString(),
    preview: conversationHistory[0].content.substring(0, 50) + "...",
    customDescription: customDescription,
  };

  // If this is a new conversation
  if (!currentConversationId) {
    currentConversationId = conversationData.id;
    savedConversations.unshift(conversationData);
  } else {
    // Update existing conversation
    const index = savedConversations.findIndex(
      (conv) => conv.id === currentConversationId
    );
    if (index !== -1) {
      savedConversations[index] = conversationData;
    }
  }

  localStorage.setItem("conversations", JSON.stringify(savedConversations));
  updateHistoryList();
}

// Update history list with delete buttons for each conversation
function updateHistoryList() {
  const historyList = document.getElementById("history-list");
  if (!historyList) return;

  historyList.innerHTML = savedConversations
    .map(
      (conv) => `
    <div class="history-item" data-id="${conv.id}">
      <div class="history-content" onclick="loadConversation(${conv.id})">
        <div class="scenario">${getScenarioName(conv.scenario)}</div>
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
}

// Function to delete a specific conversation
function deleteConversation(id, event) {
  // Stop event propagation to prevent loading the conversation when deleting it
  if (event) {
    event.stopPropagation();
  }

  // Ask for confirmation
  if (confirm("Bạn có chắc chắn muốn xóa cuộc hội thoại này?")) {
    // Find the index of the conversation in the saved conversations array
    const index = savedConversations.findIndex((conv) => conv.id === id);

    // If found, remove it from the array
    if (index !== -1) {
      savedConversations.splice(index, 1);

      // If we deleted the current conversation, reset currentConversationId
      if (currentConversationId === id) {
        currentConversationId = null;
        conversationHistory = [];

        // Clear the chat messages
        const chatMessages = document.getElementById("chat-messages");
        if (chatMessages) {
          chatMessages.innerHTML = "";
        }
      }

      // Update localStorage
      localStorage.setItem("conversations", JSON.stringify(savedConversations));

      // Update the UI
      updateHistoryList();

      console.log(`Conversation ${id} deleted successfully`);
    }
  }
}

function getScenarioName(scenario) {
  if (scenario && scenario.startsWith("custom_")) {
    // Find the conversation to get its custom description
    const conversation = savedConversations.find(
      (conv) => conv.scenario === scenario
    );
    if (conversation && conversation.customDescription) {
      // Return a shortened version of the custom description
      const desc = conversation.customDescription;
      return (
        "Tùy chỉnh: " +
        (desc.length > 30 ? desc.substring(0, 30) + "..." : desc)
      );
    }
    return "Tình huống tùy chỉnh";
  }

  const names = {
    restaurant: "Đặt Đồ Ăn",
    directions: "Hỏi Đường",
    interview: "Phỏng Vấn",
    meeting: "Gặp Gỡ",
    custom: "Tùy Chỉnh",
  };
  return names[scenario] || scenario;
}

function loadConversation(id) {
  const conversation = savedConversations.find(
    (conv) => conv.id === parseInt(id)
  );
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

  // Load conversation
  currentScenario = conversation.scenario;
  currentConversationId = conversation.id; // Set current conversation ID
  conversationHistory = [...conversation.messages];

  // Display messages
  conversationHistory.forEach((msg) => {
    addMessage(msg.content, msg.role === "assistant" ? "bot" : "user");
  });

  // Update active state in history
  document.querySelectorAll(".history-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.id === id.toString());
  });
}

function clearHistory() {
  if (confirm("Bạn có chắc chắn muốn xóa tất cả lịch sử hội thoại?")) {
    savedConversations = [];
    currentConversationId = null; // Reset current conversation ID
    localStorage.removeItem("conversations");
    updateHistoryList();

    // Clear the current conversation display
    conversationHistory = [];
    const chatMessages = document.getElementById("chat-messages");
    if (chatMessages) {
      chatMessages.innerHTML = "";
    }

    console.log("All conversation history cleared");
  }
}

// Update startConversation
async function startConversation() {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    console.error("Chat messages container not found");
    return;
  }

  chatMessages.innerHTML = "";
  conversationHistory = [];
  currentConversationId = null; // Reset conversation ID for new conversation

  const scenarioPrompts = {
    restaurant: "Hello! Welcome to our restaurant. How can I help you today?",
    directions:
      "Hi! I notice you look a bit lost. Can I help you find your way?",
    interview:
      "Hello! I'm the hiring manager. Could you tell me about yourself?",
    meeting: "Hi! I'm Sarah. It's nice to meet you!",
  };

  const initialMessage = scenarioPrompts[currentScenario];
  if (initialMessage) {
    addMessage(initialMessage, "bot");
    conversationHistory.push({ role: "assistant", content: initialMessage });
    saveConversation(); // Save initial message
  }
}

// Update sendMessage
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
  conversationHistory.push({ role: "user", content: text });
  userInput.value = "";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an English conversation partner. The current scenario is: ${currentScenario}. 
                The user's message is: "${text}". 
                
                Please provide:
                1. A natural response to the user's message
                2. Feedback on their English (grammar, vocabulary, naturalness)
                3. Suggestions for improvement if needed
                
                Format your response as JSON:
                {
                    "response": "your response here",
                    "feedback": "your feedback here"
                }`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts
    ) {
      throw new Error("Invalid API response format");
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log("Response text:", responseText);

    // Try to parse the response text as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      result = JSON.parse(jsonMatch[0]);
    }

    console.log("Parsed result:", result);

    // Display the response message
    if (result.response) {
      addMessage(result.response, "bot");
      conversationHistory.push({ role: "assistant", content: result.response });
      saveConversation(); // Save after each complete exchange
    }
    if (result.feedback) {
      showFeedback(result.feedback);
    }
  } catch (error) {
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
}

function addMessage(text, sender) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    console.error("Chat messages container not found");
    return;
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Log the message for debugging
  console.log(`Added ${sender} message:`, text);
}

// Custom scenario handling
function startCustomScenario() {
  const customScenarioInput = document.getElementById("custom-scenario-input");
  if (!customScenarioInput) return;

  const scenarioDescription = customScenarioInput.value.trim();
  if (!scenarioDescription) {
    alert("Vui lòng nhập mô tả tình huống trước khi bắt đầu.");
    customScenarioInput.focus();
    return;
  }

  // Clear chat messages
  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    chatMessages.innerHTML = "";
  }

  // Reset conversation history
  conversationHistory = [];
  currentConversationId = null;

  // Start custom conversation
  startCustomConversation(scenarioDescription);
}

async function startCustomConversation(scenarioDescription) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    console.error("Chat messages container not found");
    return;
  }

  // Show loading indicator
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "message bot loading";
  loadingMessage.textContent = "AI đang chuẩn bị cuộc hội thoại...";
  chatMessages.appendChild(loadingMessage);

  try {
    // Generate initial message based on custom scenario
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an English conversation partner. The user wants to practice English conversation in this context: "${scenarioDescription}".
                
                Please provide:
                1. A natural opening message to start the conversation in this context
                2. Keep it brief and natural, as if you're a real person in this situation
                
                Format your response as JSON:
                {
                    "response": "your opening message here"
                }`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Remove loading message
    chatMessages.removeChild(loadingMessage);

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts
    ) {
      throw new Error("Invalid API response format");
    }

    const responseText = data.candidates[0].content.parts[0].text;

    // Try to parse the response text as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      // If parsing fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in response");
      }
      result = JSON.parse(jsonMatch[0]);
    }

    // Display the initial message
    if (result.response) {
      addMessage(result.response, "bot");
      conversationHistory.push({ role: "assistant", content: result.response });

      // Save with custom scenario
      currentScenario = "custom_" + Date.now();
      saveConversation(scenarioDescription);
    }
  } catch (error) {
    // Remove loading message if still present
    if (loadingMessage.parentNode) {
      chatMessages.removeChild(loadingMessage);
    }

    console.error("Error:", error);
    addMessage(
      "I'm sorry, I encountered an error starting the conversation. Please try again.",
      "bot"
    );
  }
}
