import { useEffect, useState } from "react";

// npm run dev -> local backend, npm run build (Render) -> production backend
const BACKEND_URL = import.meta.env.DEV
  ? "http://localhost:5000"
  : "https://spam-detector-backend-gcey.onrender.com";

// User try panni paakka sample messages
const SAMPLES = [
  { type: "spam", text: "Congratulations! You won a free prize. Call now to claim" },
  { type: "spam", text: "URGENT! Your account is selected for a cash reward. Click the link" },
  { type: "ham", text: "Hi, are we meeting tomorrow at 5 PM?" },
  { type: "ham", text: "Can you send me the notes from today's class?" },
];

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const loadHistory = async (type = filter) => {
    try {
      const query = type === "all" ? "" : `?type=${type}`;
      const res = await fetch(`${BACKEND_URL}/api/history${query}`);
      setHistory(await res.json());
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadHistory(filter);
  }, [filter]);

  const deleteMessage = async (id) => {
    await fetch(`${BACKEND_URL}/api/history/${id}`, { method: "DELETE" });
    loadHistory();
  };

  const checkMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      loadHistory();
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>📩 SMS Spam Detector</h1>
      <p className="subtitle">Message type pannunga, AI adhu spam-aa illaiyaa-nu sollum</p>

      <div className="samples">
        <p className="note">Try pannunga, click pannaa box-la fill aagum:</p>
        {SAMPLES.map((s) => (
          <button
            key={s.text}
            type="button"
            className={`sample ${s.type}`}
            onClick={() => {
              setText(s.text);
              setResult(null);
            }}
          >
            {s.type === "spam" ? "⚠️" : "✅"} {s.text}
          </button>
        ))}
      </div>

      <form onSubmit={checkMessage}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Eg: Congratulations! You won a free prize. Call now"
          rows={4}
        />
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? "Checking..." : "Check Message"}
        </button>
      </form>

      {loading && <p className="note">First request-ku 50 sec aagalaam (free server wake up aagudhu)</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <div className={`result ${result.prediction}`}>
          {result.prediction === "spam" ? "⚠️ Spam" : "✅ Safe (Not Spam)"}
        </div>
      )}

      <div className="history">
        <h2>Saved Messages</h2>
        <div className="tabs">
          {["all", "spam", "ham"].map((t) => (
            <button
              key={t}
              type="button"
              className={filter === t ? "tab active" : "tab"}
              onClick={() => setFilter(t)}
            >
              {t === "all" ? "All" : t === "spam" ? "⚠️ Spam" : "✅ Safe"}
            </button>
          ))}
        </div>

        {history.length === 0 ? (
          <p className="note">No messages saved yet</p>
        ) : (
          <ul>
            {history.map((item) => (
              <li key={item.id}>
                <span className={`tag ${item.prediction}`}>{item.prediction}</span>
                <span className="msg">{item.text}</span>
                <button type="button" className="delete" onClick={() => deleteMessage(item.id)}>
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
