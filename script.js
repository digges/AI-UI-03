function connectWebSocket() {
  const socket = new WebSocket("wss://ai-be-3-3f11.onrender.com/chat");

  socket.onopen = function () {
    console.log("✅ WebSocket connection established.");
  };

  socket.onmessage = function (event) {
    console.log("🔹 Received WebSocket Message: ", event.data);

    // ✅ Remove loading message
    let loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) {
      loadingDiv.remove();
    }

    // ✅ Check if it's plain text first
    const messageText = event.data.trim();
    
    if (!messageText.startsWith('{') && !messageText.startsWith('[')) {
      console.warn("⚠️ Plain text received:", messageText);
      displayMessage(`⚠️ Backend Error: ${messageText}`, "bot-message");
      return;
    }

    // ✅ Parse JSON
    try {
      let data = JSON.parse(messageText);

      // Sentiment report
      if (
        data.Positive !== undefined &&
        data.Negative !== undefined &&
        data.Neutral !== undefined
      ) {
        console.log("✅ Sentiment Report Detected!");
        displayMessage("✅ Sentiment Report Generated.", "bot-message");
        showSentimentChart(data);
      } 
      // Gemini response
      else if (data.candidates) {
        let aiResponse = data.candidates[0].content.parts[0].text;
        displayMessage(aiResponse, "bot-message");
      } 
      // Error response
      else if (data.error) {
        displayMessage(`❌ ${data.error}`, "bot-message");
        if (data.details) {
          console.error("Error details:", data.details);
        }
      } 
      // Other JSON
      else {
        displayMessage(JSON.stringify(data), "bot-message");
      }
    } catch (error) {
      console.error("❌ JSON Parse Error:", error);
      displayMessage(messageText, "bot-message");
    }
  };

  socket.onerror = function (error) {
    console.error("❌ WebSocket Error: ", error);
    
    let loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  };

  socket.onclose = function () {
    console.log("🔌 WebSocket closed.");
    
    let loadingDiv = document.getElementById("loading-message");
    if (loadingDiv) {
      loadingDiv.remove();
    }
  };

  return socket;
}

const socket = connectWebSocket();

function handleKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

function sendMessage() {
  let userInput = document.getElementById("user-input").value.trim();
  if (userInput === "") return;

  displayMessage(userInput, "user-message");
  document.getElementById("user-input").value = "";

  if (socket.readyState !== WebSocket.OPEN) {
    displayMessage("❌ Not connected. Refresh page.", "bot-message");
    return;
  }

  // ✅ Loading indicator
  let chatBox = document.getElementById("chat-box");
  let loadingDiv = document.createElement("div");
  loadingDiv.id = "loading-message";
  loadingDiv.classList.add("bot-message");
  loadingDiv.innerHTML = "⏳ Thinking...";

  chatBox.appendChild(loadingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  socket.send(userInput);
}

function displayMessage(message, className) {
  let chatBox = document.getElementById("chat-box");
  let messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);

  try {
    if (typeof message === "string" && message.trim().startsWith("{")) {
      let data = JSON.parse(message);

      if (data.plans) {
        let formattedResponse = `<b>✅ Matching Plans:</b><br><br><div style="width: 100%; text-align: left;">`;

        data.plans.forEach((plan) => {
          formattedResponse += `
            <div style="background: #1e1e1e; padding: 12px; border-radius: 10px; border: 1px solid #444; margin-bottom: 10px;">
              <div style="font-size: 16px; font-weight: bold; color: #00d1b2;">${plan.name || 'Plan'}</div>
              <div style="font-size: 14px; color: #ccc;">${plan.description || ''}</div>
            </div>
          `;
        });

        formattedResponse += `</div>`;
        messageDiv.innerHTML = formattedResponse;
      } else if (data.error) {
        messageDiv.innerHTML = `<b>❌ ${data.error}</b>`;
      } else {
        messageDiv.innerHTML = message;
      }
    } else if (
      typeof message === "string" &&
      message.toLowerCase().includes("here are some")
    ) {
      let formattedResponse = `<b>🛒 ${message.split(":")[0]}:</b><br><br>`;
      let productText = message.split(":")[1].trim();

      let products = productText
        .split("||")
        .filter((item) => item.trim() !== "");

      formattedResponse += `<div style="display: flex; flex-direction: column; gap: 10px;">`;

      products.forEach((product) => {
        if (product.trim() !== "") {
          let productParts = product.split(" (₹");
          let name = productParts[0].trim();
          let price = productParts[1]
            ? `₹${productParts[1].replace(")", "")}`
            : "";

          formattedResponse += `
            <div style="background: #1e1e1e; padding: 12px; border-radius: 10px; border: 1px solid #444; box-shadow: 0 0 10px rgba(0,0,0,0.3);">
              <div style="font-size: 16px; font-weight: bold; color: #00d1b2;">${name}</div>
              <div style="font-size: 14px; color: #ccc;">Price: <span style="font-weight: bold; color: #ffd700;">${price}</span></div>
            </div>
          `;
        }
      });

      formattedResponse += `</div>`;
      messageDiv.innerHTML = formattedResponse;
    } else {
      messageDiv.textContent = message;
    }
  } catch (error) {
    console.error("❌ Display error:", error);
    messageDiv.textContent = message;
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showSentimentChart(reportData) {
  console.log("🔹 Rendering chart:", reportData);

  let chatBox = document.getElementById("chat-box");

  let existingChart = document.getElementById("chart-container");
  if (existingChart) {
    existingChart.remove();
  }

  let chartContainer = document.createElement("div");
  chartContainer.id = "chart-container";
  chartContainer.classList.add("chart-container");

  let heading = document.createElement("div");
  heading.innerHTML = "<b>📊 Sentiment Analysis Report</b>";
  heading.style.textAlign = "center";
  heading.style.fontSize = "16px";
  heading.style.marginBottom = "10px";
  chartContainer.appendChild(heading);

  let canvas = document.createElement("canvas");
  canvas.id = "sentimentChart";
  chartContainer.appendChild(canvas);

  chatBox.appendChild(chartContainer);
  chatBox.scrollTop = chatBox.scrollHeight;

  let ctx = document.getElementById("sentimentChart").getContext("2d");

  if (
    window.sentimentChart &&
    typeof window.sentimentChart.destroy === "function"
  ) {
    window.sentimentChart.destroy();
  }

  window.sentimentChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [
        {
          data: [
            reportData.Positive || 0,
            reportData.Negative || 0,
            reportData.Neutral || 0,
          ],
          backgroundColor: ["#28a745", "#dc3545", "#ffc107"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });

  console.log("✅ Chart rendered.");
}

function saveChatHistory() {
  localStorage.setItem("chatHistory", JSON.stringify(chatSessions));
}

function loadChatHistory() {
  let storedHistory = localStorage.getItem("chatHistory");
  if (storedHistory) {
    chatSessions = JSON.parse(storedHistory);
    updateChatHistoryUI();
  }
}

function updateChatHistoryUI() {
  let historyList = document.getElementById("chat-history");
  historyList.innerHTML = "";

  chatSessions.forEach((session, index) => {
    let listItem = document.createElement("li");
    listItem.innerText = `Chat ${index + 1}`;
    listItem.onclick = () => loadChatSession(index);
    historyList.appendChild(listItem);
  });
}
