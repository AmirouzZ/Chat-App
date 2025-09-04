// public/js/chat.js
document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const userForm = document.getElementById("user-form");
  const userSelect = document.getElementById("user-select");
  const logoutBtn = document.getElementById("logout-btn");
  const messageForm = document.getElementById("message-form");
  const messageInput = document.getElementById("message-input");
  const messagesContainer = document.getElementById("messages");
  const sendButton = document.getElementById("send-button");
  const connectionStatus = document.getElementById("connection-status");

  let socket = null;
  let connectionAttempts = 0;
  const maxConnectionAttempts = 3;

  // Check if we have a token in localStorage
  const token = localStorage.getItem("chatToken");
  const userId = localStorage.getItem("userId");

  if (token && userId) {
    initializeChat(token, userId);
  }

  // User login form
  if (userForm) {
    userForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const selectedUserId = userSelect.value;

      if (!selectedUserId) {
        alert("Please select a user");
        return;
      }

      // Get token from server
      fetch(`/api/get-token?userId=${selectedUserId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.token) {
            // Store token and user ID
            localStorage.setItem("chatToken", data.token);
            localStorage.setItem("userId", selectedUserId);

            // Add token to URL for server-side rendering
            const newUrl = `${window.location.origin}${window.location.pathname}?token=${data.token}`;
            window.location.href = newUrl;
          } else {
            throw new Error("No token received from server");
          }
        })
        .catch((error) => {
          console.error("Error getting token:", error);
          alert("Error getting token. Please check console for details.");
        });
    });
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      // Clear stored data and disconnect socket
      localStorage.removeItem("chatToken");
      localStorage.removeItem("userId");

      if (socket) {
        socket.disconnect();
      }

      // Redirect to clean URL without token
      window.location.href = window.location.origin + window.location.pathname;
    });
  }

  // Message form submission
  if (messageForm) {
    messageForm.addEventListener("submit", function (e) {
      e.preventDefault();
      handleMessageSend();
    });
  }

  // Send button click event
  if (sendButton) {
    sendButton.addEventListener("click", function (e) {
      e.preventDefault();
      handleMessageSend();
    });
  }

  // Handle message sending
  function handleMessageSend() {
    const messageText = messageInput.value.trim();
    if (!messageText) {
      alert("Please enter a message");
      return;
    }

    if (!socket || !socket.connected) {
      alert("Not connected to server. Please try again.");
      return;
    }

    // Send message via socket
    socket.emit(
      "sendMessageEmit",
      {
        chat_id: 1, // Using a fixed chat ID for simplicity
        text: messageText,
        temp_id: Date.now(), // Temporary ID for optimistic UI
      },
      (response) => {
        if (response && !response.ok) {
          console.error("Failed to send message:", response.error);
          alert(
            "Failed to send message: " + (response.error || "Unknown error")
          );
        }
      }
    );

    // Clear input
    messageInput.value = "";
  }

  // Initialize chat connection
  function initializeChat(token, userId) {
    connectionAttempts++;
    updateConnectionStatus("connecting", "Establishing connection...");

    // First try with websocket only
    socket = io({
      auth: {
        token: token,
      },
      transports: ["websocket"],
    });

    // Set up event handlers
    setupSocketHandlers(socket, token);

    // Add token to URL for server-side rendering if not already present
    if (!window.location.search.includes("token=")) {
      const newUrl = `${window.location.origin}${window.location.pathname}?token=${token}`;
      window.history.replaceState({}, "", newUrl);
    }
  }

  // Set up socket event handlers
  function setupSocketHandlers(socket, token) {
    socket.on("connect", function () {
      console.log("Connected to server with ID:", socket.id);
      connectionAttempts = 0; // Reset counter on successful connection
      updateConnectionStatus("connected", "Connected to chat");

      // Display connection status
      addSystemMessageToUI("Connected to chat server");
    });

    socket.on("connectionSuccess", function (data) {
      console.log("Server confirmed successful connection:", data);
      addSystemMessageToUI(`Logged in as user ${data.userId}`);
    });

    socket.on("receiveMessageOn", function (message) {
      // Add message to UI
      addMessageToUI(message);
    });

    socket.on("disconnect", function (reason) {
      console.log("Disconnected from server:", reason);
      updateConnectionStatus("disconnected", "Disconnected: " + reason);
      addSystemMessageToUI("Disconnected from server: " + reason);
    });

    socket.on("connect_error", function (error) {
      console.error("Connection error:", error.message);
      updateConnectionStatus("disconnected", "Connection failed");

      // If websocket fails, try with polling as fallback
      if (connectionAttempts < maxConnectionAttempts) {
        console.log("Attempting fallback to polling transport");
        updateConnectionStatus(
          "connecting",
          "Trying alternative connection..."
        );

        // Disconnect current socket
        if (socket) {
          socket.disconnect();
        }

        // Try with polling transport
        socket = io({
          auth: {
            token: token,
          },
          transports: ["polling"],
        });

        // Set up handlers again
        setupSocketHandlers(socket, token);
        connectionAttempts++;
      } else {
        updateConnectionStatus(
          "disconnected",
          "Failed to connect after multiple attempts"
        );
        addSystemMessageToUI(
          "Failed to connect to server after multiple attempts"
        );
        alert("Connection failed. Please refresh the page and try again.");
      }
    });

    socket.on("error", function (error) {
      console.error("Socket error:", error);
      updateConnectionStatus(
        "disconnected",
        "Error: " + (error.message || "Unknown error")
      );
      addSystemMessageToUI("Error: " + (error.message || "Unknown error"));
    });
  }

  // Update connection status UI
  function updateConnectionStatus(status, message) {
    if (!connectionStatus) return;

    const indicator = connectionStatus.querySelector(".status-indicator");
    const text = connectionStatus.querySelector("span");

    // Remove all status classes
    indicator.classList.remove(
      "status-connected",
      "status-connecting",
      "status-disconnected"
    );

    // Apply appropriate class and text
    switch (status) {
      case "connected":
        indicator.classList.add("status-connected");
        text.textContent = message || "Connected";
        if (messageInput) messageInput.disabled = false;
        if (sendButton) sendButton.disabled = false;
        break;
      case "connecting":
        indicator.classList.add("status-connecting");
        text.textContent = message || "Connecting...";
        if (messageInput) messageInput.disabled = true;
        if (sendButton) sendButton.disabled = true;
        break;
      case "disconnected":
        indicator.classList.add("status-disconnected");
        text.textContent = message || "Disconnected";
        if (messageInput) messageInput.disabled = true;
        if (sendButton) sendButton.disabled = true;
        break;
    }
  }

  // Function to add user message to UI
  function addMessageToUI(message) {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message");

    // Check if message is from current user
    const currentUserId = localStorage.getItem("userId");
    const isCurrentUser = message.sender_id == currentUserId;
    messageEl.classList.add(isCurrentUser ? "sent" : "received");

    // Add sender name and message text
    const senderName = document.createElement("div");
    senderName.classList.add("sender-name");
    senderName.textContent = message.sender_name || `User ${message.sender_id}`;

    const messageText = document.createElement("div");
    messageText.classList.add("message-text");
    messageText.textContent = message.text;

    // Add timestamp
    const messageTime = document.createElement("div");
    messageTime.classList.add("message-time");
    messageTime.textContent = new Date(message.created_at).toLocaleTimeString();

    messageEl.appendChild(senderName);
    messageEl.appendChild(messageText);
    messageEl.appendChild(messageTime);

    messagesContainer.appendChild(messageEl);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Function to add system message to UI
  function addSystemMessageToUI(text) {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message", "system-message");
    messageEl.textContent = text;
    messagesContainer.appendChild(messageEl);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Enable message input when connected
  function enableMessageInput() {
    if (messageInput) messageInput.disabled = false;
    if (sendButton) sendButton.disabled = false;
  }

  // Disable message input when disconnected
  function disableMessageInput() {
    if (messageInput) messageInput.disabled = true;
    if (sendButton) sendButton.disabled = true;
  }
});
