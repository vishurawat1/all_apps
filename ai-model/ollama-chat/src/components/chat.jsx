import { useState } from "react";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);

  const sendPrompt = async () => {
    if (!prompt) return;

    const userMsg = { role: "user", text: prompt };
    setMessages([...messages, userMsg]);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer }]);
      setPrompt("");
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "bot", text: "Error connecting to backend" }]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          marginBottom: "10px",
          border: "1px solid #ccc",
          padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.role === "user" ? "right" : "left", margin: "5px 0" }}>
            <b>{msg.role}:</b> {msg.text}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your message"
        style={{ width: "80%", padding: "5px" }}
      />
      <button onClick={sendPrompt} style={{ padding: "5px 10px", marginLeft: "5px" }}>
        Send
      </button>
    </div>
  );
}
