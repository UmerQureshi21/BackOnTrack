import { useState } from "react";
import RecordButton from "./components/RecordButton";

function App() {
  const [lastTranscript, setLastTranscript] = useState("");

  const handleTranscriptReceived = (transcript: string) => {
    setLastTranscript(transcript);
    console.log("App received transcript:", transcript);
  };

  return (
    <div className="bg-[var(--bg)]" style={{ padding: "20px" }}>
      <h1>Study Group Monitor</h1>

      <RecordButton onTranscriptReceived={handleTranscriptReceived} />

      {lastTranscript && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            backgroundColor: "#e0f2fe",
            borderRadius: "8px",
            border: "1px solid #0284c7",
          }}
        >
          <h3>Last Transcript Saved:</h3>
          <p>{lastTranscript}</p>
        </div>
      )}

      {/* <ToggleButton /> */}
    </div>
  );
}

export default App;
