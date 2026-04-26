import { useState } from "react";
import "./App.css";

export default function TradeStreamPro() {
  const [fieldList, setFieldList] = useState("");
  const [order, setOrder] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [jobName, setJobName] = useState("");

  const BACKEND_URL = "https://tradestreampro-backend.onrender.com/read-image";

  const partMap = {
    "6 pipe": ["8H642", '6" GALV PIPE'],
    "4 pipe": ["8H640C", '4" GALV PIPE'],
    "6 tap": ["8H862C", '6" SADDLE COLLAR'],
    "4 tap": ["8H860C", '4" SADDLE COLLAR'],
    "6 saddle collar": ["8H862C", '6" SADDLE COLLAR'],
    "4 saddle collar": ["8H860C", '4" SADDLE COLLAR'],
    "pvc tee": ["3K110", '3/4" PVC TEE'],
    '3/4" pvc tee': ["3K110", '3/4" PVC TEE']
  };

  function buildOrder() {
    const lines = fieldList.split("\n");
    const result = [];

    lines.forEach(line => {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return;

      const qty = Number(match[1]);
      const desc = match[2].toLowerCase().replace(/"/g, "").trim();

      if (!qty) return;

      const item = partMap[desc] || ["—", desc.toUpperCase()];
      result.push({ qty, part: item[0], desc: item[1] });
    });

    setOrder(result);
    setStatus("Order built successfully");
  }

  function copyOrder() {
    const text = order
      .map(item => `${item.qty} | ${item.part} | ${item.desc}`)
      .join("\n");

    navigator.clipboard.writeText(text);
    setStatus("Order copied to clipboard");
  }

  function emailOrder() {
    const body = order
      .map(item => `${item.qty} ${item.desc} (${item.part})`)
      .join("%0D%0A");

    window.location.href = `mailto:?subject=Material Order - ${jobName || "Job"}&body=${body}`;
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (BACKEND_URL.includes("REPLACE_WITH")) {
      setStatus("Add your Render backend URL in App.jsx first.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      setStatus("Reading image with AI...");

      try {
        const res = await fetch(BACKEND_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ image: reader.result })
        });

        const data = await res.json();

        if (!data.result) {
          setStatus("AI could not read image. Try again.");
          return;
        }

        setFieldList(data.result);
        setStatus("Image processed successfully");
      } catch (err) {
        setStatus("Connection failed. Check backend.");
      }
    };

    reader.readAsDataURL(file);
  }

  function optimizePaste() {
    const lines = fieldList.split(/\n+/);
    const cleaned = [];

    lines.forEach(line => {
      let l = line.toLowerCase().trim();

      l = l.replace(/^[-•]\s*/, "");

      l = l
        .replace(/taps?/g, "saddle collar")
        .replace(/collars?/g, "saddle collar")
        .replace(/pvc(?!\s*\d)/g, '3/4" pvc')
        .replace(/pipee|plpe|p1pe/g, "pipe")
        .replace(/flexx|f1ex/g, "flex");

      l = l.replace(/\s+/g, " ");

      let match = l.match(/^(\d+)\s+(.+)$/);
      if (!match) {
        match = l.match(/^(.+?)\s+(\d+)$/);
        if (match) {
          const desc = match[1];
          const qty = match[2];
          if (qty !== "0") cleaned.push(qty + " " + desc);
          return;
        }
      }

      if (match) {
        const qty = match[1];
        const desc = match[2];
        if (qty !== "0") cleaned.push(qty + " " + desc);
      }
    });

    setFieldList(cleaned.join("\n"));
    setStatus("List optimized");
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>TradeStreamPro</h1>
          <p>AI-powered HVAC material ordering</p>
        </div>
        <span className="badge">Beta</span>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Build Order</h2>

          <input
            className="input"
            placeholder="Job Name (optional)"
            value={jobName}
            onChange={e => setJobName(e.target.value)}
          />

          <textarea
            className="textarea"
            value={fieldList}
            onChange={e => setFieldList(e.target.value)}
            placeholder={'Upload image or paste list\nExample:\n8 6 pipe\n2 6 tap\n1 pvc tee'}
          />

          <input type="file" onChange={handleImageUpload} className="file" />

          <div className="buttons">
            <button onClick={optimizePaste} className="button secondary">
              Optimize
            </button>

            <button onClick={buildOrder} className="button primary">
              Build Order
            </button>
          </div>

          <p className="status">{status}</p>
        </section>

        <section className="card">
          <div className="sectionTop">
            <h2>Supplier Order</h2>
            <div className="buttons small">
              <button onClick={copyOrder} className="button secondary">Copy</button>
              <button onClick={emailOrder} className="button green">Email</button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Qty</th>
                <th>Part</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {order.map((item, i) => (
                <tr key={i}>
                  <td>{item.qty}</td>
                  <td>{item.part}</td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
