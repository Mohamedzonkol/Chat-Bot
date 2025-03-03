"use client";

import { useState, useEffect } from "react";
import { FaMicrophone, FaPaperPlane } from "react-icons/fa";

export default function Chatbot() {
  const [messages, setMessages] = useState<
    { role: string; text: string; time: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    let recognition: any;

    if (listening) {
      recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = "en-US";
      recognition.start();
      recognition.onresult = (event: any) => {
        setInput(event.results[0][0].transcript);
      };
      recognition.onend = () => setListening(false);
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [listening]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const timestamp = new Date().toLocaleTimeString();
    const newMessages = [
      ...messages,
      { role: "user", text: input, time: timestamp },
    ];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch(
        "https://crop-pilot-api.azurewebsites.net/api/ChatBot/Chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Ensure the correct response structure
      const botResponse = data.data || "Bot did not return a response.";

      setMessages([
        ...newMessages,
        {
          role: "bot",
          text: botResponse,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages([
        ...newMessages,
        { role: "bot", text: "Error fetching response.", time: timestamp },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="w-full max-w-lg p-4 sm:p-6 bg-white rounded-xl shadow-2xl border border-green-200">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-green-800">
          🌿 Farmer's Assistant
        </h1>
        <div className="h-60 sm:h-80 overflow-y-auto border p-3 sm:p-4 rounded-lg bg-gray-50 space-y-2 sm:space-y-3 shadow-inner">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-2 sm:p-3 rounded-xl max-w-[70%] sm:max-w-xs break-words shadow-md ${
                  msg.role === "user"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p className="text-sm sm:text-base">{msg.text}</p>
                <span className="text-xs text-gray-600 block mt-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <p className="text-gray-500 text-sm text-center">
              Bot is typing...
            </p>
          )}
        </div>
        <div className="mt-4 sm:mt-6 flex gap-2 items-center">
          <button
            onClick={() => setListening(true)}
            className={`p-2 sm:p-3 ${
              listening ? "bg-green-700" : "bg-green-500"
            } text-white rounded-full hover:bg-green-700 transition duration-300`}
            title="Start Listening"
            disabled={loading}
          >
            <FaMicrophone className="text-sm sm:text-base" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 sm:p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-green-900 text-sm sm:text-base"
            placeholder="Ask about crops, soil, or farming..."
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            className="p-2 sm:p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
            disabled={loading}
            title="Send Message"
          >
            <FaPaperPlane className="text-sm sm:text-base" />
          </button>
        </div>
      </div>
    </div>
  );
}
