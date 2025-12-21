function connectWebSocket() {
  const socket = new WebSocket("wss://ai-be-3-3f11.onrender.com/chat");

  socket.onopen = function () {
    console.log("✅ WebSocket connection established.");
  };

  socket.onmessage = function (event) {
    console.log("🔹 Received WebSocket Message: ", event.data);

    try {
      let data = JSON.parse(event.data);

      // ✅ Remove the loading message once data arrives
      let loadingDiv = document.getElementById("loading-message");
      if (loadingDiv) {
        loadingDiv.remove();
      }

      if (
        data.Positive !== undefined &&
        data.Negative !== undefined &&
        data.Neutral !== undefined
      ) {
        console.log("✅ Sentiment Report Detected!");
        displayMessage("✅ Sentiment Report Generated.", "bot-message");
        showSentimentChart(data);
      } else if (data.candidates) {
        let aiResponse = data.candidates[0].content.parts[0].text;
        displayMessage(aiResponse, "bot-message");
      } else {
        displayMessage(event.data, "bot-message");
      }
    } catch (error) {
      console.error("❌ Error parsing WebSocket response:", error);

      // ✅ Remove the loading message even if there's an error
      let loadingDiv = document.getElementById("loading-message");
      if (loadingDiv) {
        loadingDiv.remove();
      }

      displayMessage(event.data, "bot-message");
    }
  };

  socket.onerror = function (error) {
    console.error("❌ WebSocket Error: ", error);
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

  // ✅ Create a placeholder for the reply
  let chatBox = document.getElementById("chat-box");
  let loadingDiv = document.createElement("div");
  loadingDiv.id = "loading-message";
  loadingDiv.classList.add("bot-message");

  chatBox.appendChild(loadingDiv);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll

  // ✅ Send the message to WebSocket
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
      // Beautified E-commerce Product Listings
      let formattedResponse = `<b>🛒 ${message.split(":")[0]}:</b><br><br>`;
      let productText = message.split(":")[1].trim();

      // 🔥 Correct splitting using '||'
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
      messageDiv.innerHTML = message;
    }
  } catch (error) {
    console.error("❌ Error parsing JSON:", error);
    messageDiv.innerHTML = message;
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Function to display Sentiment Analysis Chart
// ✅ Function to display Sentiment Analysis Chart
function showSentimentChart(reportData) {
  console.log("🔹 Preparing to render chart with:", reportData);

  let chatBox = document.getElementById("chat-box");

  // ✅ Remove any existing chart before creating a new one
  let existingChart = document.getElementById("chart-container");
  if (existingChart) {
    existingChart.remove();
  }

  // ✅ Create chart container
  let chartContainer = document.createElement("div");
  chartContainer.id = "chart-container";
  chartContainer.classList.add("chart-container");

  // ✅ Add heading
  let heading = document.createElement("div");
  heading.innerHTML = "<b>📊 Sentiment Analysis Report</b>";
  heading.style.textAlign = "center";
  heading.style.fontSize = "16px";
  heading.style.marginBottom = "10px";
  chartContainer.appendChild(heading);

  // ✅ Create canvas
  let canvas = document.createElement("canvas");
  canvas.id = "sentimentChart";
  chartContainer.appendChild(canvas);

  // ✅ Append to chat box
  chatBox.appendChild(chartContainer);
  chatBox.scrollTop = chatBox.scrollHeight;

  let ctx = document.getElementById("sentimentChart").getContext("2d");

  console.log("✅ Final Report Data Sent to Chart.js:", reportData);

  // ✅ Destroy only if chart exists
  if (
    window.sentimentChart &&
    typeof window.sentimentChart.destroy === "function"
  ) {
    window.sentimentChart.destroy();
  }

  // ✅ Create Pie Chart
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

  console.log("✅ Chart successfully rendered.");
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
