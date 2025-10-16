const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatContent = document.getElementById("chat-content");

let context = "inicio";
let session = {};

async function sendMessageToBot(userMessage) {
  try {
   const res = await fetch("http://localhost:4000/chatbot/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, context, session }),
    });

    if (!res.ok) throw new Error("Error al conectar con el servidor");

    const data = await res.json();
    context = data.nextContext || "inicio";
    session = data.session || {};
    return data.reply;
  } catch (error) {
    console.error(error);
    return "⚠️ Error al conectar con el servidor.";
  }
}

function addMessage(message, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(sender === "user" ? "user-msg" : "bot-msg");
  msgDiv.innerHTML = message;
  chatContent.appendChild(msgDiv);
  chatContent.scrollTop = chatContent.scrollHeight;
}

sendBtn.addEventListener("click", async () => {
  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessage(userMessage, "user");
  input.value = "";

  const botReply = await sendMessageToBot(userMessage);
  addMessage(botReply, "bot");
});

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendBtn.click();
});


window.onload = async () => {
  const botReply = await sendMessageToBot("");
  addMessage(botReply, "bot");
};
