import { useState, useRef } from "react";

interface RecordButtonProps {
  onTranscriptReceived?: (transcript: string) => void;
}

function RecordButton({ onTranscriptReceived }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });

          // Send audio to backend
          const formData = new FormData();
          formData.append("file", audioBlob);

          try {
            const response = await fetch("http://localhost:8000/transcribe", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();
            console.log("Transcript:", data.text);
            setTranscript(data.text);

            // Call parent component callback if provided
            if (onTranscriptReceived) {
              onTranscriptReceived(data.text);
            }
          } catch (error) {
            console.error("Error transcribing:", error);
          }

          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript("");
  };

  return (
    <div className="p-6 border border-gray-300 rounded-lg mb-6 bg-white shadow-sm">
      <div className="flex gap-3 mb-4 items-center">
        <div
          className="w-24 h-24 border-4 border-black rounded-full flex items-center justify-center bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={toggleRecording}
        >
          <div
            className={`transition-all duration-300 ease-out ${
              isRecording
                ? "w-12 h-12 bg-red-500 rounded-md"
                : "w-20 h-20 bg-red-500 rounded-full"
            }`}
          />
        </div>

        {transcript && (
          <button
            onClick={clearTranscript}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-all"
          >
            🗑️ Clear
          </button>
        )}
      </div>

      {transcript && (
        <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
          <h4 className="font-semibold text-gray-800 mb-2">
            Saved Transcript:
          </h4>
          <p className="text-gray-700 leading-relaxed">{transcript}</p>
        </div>
      )}
    </div>
  );
}

export default RecordButton;
