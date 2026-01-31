import { useState } from 'react'
import './App.css'



function App() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setError('Speech Recognition not supported in your browser')
      return
    }

    const recognition = new SpeechRecognition()
    setIsListening(true)
    setError('')
    setTranscript('')

    recognition.onstart = () => {
      setIsListening(true)
      console.log('Listening started...')
    }

    recognition.onresult = (event) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          setTranscript(prev => prev + transcriptSegment + ' ')
        } else {
          interimTranscript += transcriptSegment
        }
      }

      console.log('Transcript:', interimTranscript)
    }

    recognition.onerror = (event) => {
      setError(`Error: ${event.error}`)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const stopListening = () => {
    setIsListening(false)
  }

  const submitForRating = async () => {
    if (!transcript.trim()) {
      setError('No transcript to submit')
      return
    }

    setLoading(true)
    setError('')
    setRating(null)

    try {
      const response = await fetch('http://localhost:8000/rate-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcript })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setRating(parseInt(data.rating))
    } catch (err) {
      setError(`Failed to get rating: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setRating(null)
  }

  return (
    <div className="app">
      <div>
        <h1>Study Group Monitor</h1>
      </div>

      <div className="card">
        <div className="controls">
          <button 
            onClick={startListening} 
            disabled={isListening}
            className="btn btn-primary"
          >
            {isListening ? '🎤 Recording...' : '🎤 Start Listening'}
          </button>
          
          <button 
            onClick={stopListening} 
            disabled={!isListening}
            className="btn btn-secondary"
          >
            Stop Recording
          </button>

          <button 
            onClick={submitForRating}
            disabled={loading || !transcript.trim()}
            className="btn btn-success"
          >
            {loading ? '⏳ Rating...' : '📊 Get Rating'}
          </button>

          <button 
            onClick={clearTranscript}
            className="btn btn-danger"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {transcript && (
          <div className="transcript-box">
            <h3>Transcript:</h3>
            <p>{transcript}</p>
          </div>
        )}

        {rating !== null && (
          <div className={`rating-box rating-${getRatingColor(rating)}`}>
            <h2>On-Task Rating: {rating}/100</h2>
            <p>{getRatingMessage(rating)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getRatingColor(rating: number): string {
  if (rating >= 80) return 'excellent'
  if (rating >= 60) return 'good'
  if (rating >= 40) return 'fair'
  return 'poor'
}

function getRatingMessage(rating: number): string {
  if (rating >= 80) return '✅ Great job staying on task!'
  if (rating >= 60) return '👍 Good focus, minor distractions'
  if (rating >= 40) return '⚠️ Some off-topic discussion'
  return '❌ Significant off-topic discussion'
}

export default App