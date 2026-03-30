import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, BarChart2, Info, PenLine, Check } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import './Curation.css'

function Curation({ onBack, theme, toggleTheme, onNewChat }) {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [inputText, setInputText] = useState('')
  const [sessionName, setSessionName] = useState('New Gift Chat')
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [messages, setMessages] = useState([])
  const [signals, setSignals] = useState([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. Session Hydration: Fetch existing state on mount
  useEffect(() => {
    const hydrateSession = async () => {
      if (!sessionId) return
      setLoading(true)
      try {
        const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}`)
        const data = await response.json()
        
        if (data.name) {
          setSessionName(data.name)
        }

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map(m => ({
            id: m.id,
            type: m.role,
            text: m.content,
            time: 'PREVIOUS'
          })))
        } else {
          // Initialize first message if new session
          setMessages([{
            id: 'init',
            type: 'assistant',
            text: 'Tell me about this person in your own words. What makes them smile after a long day?',
            time: 'JUST NOW'
          }])
        }

        if (data.extracted_signals) {
          setSignals(data.extracted_signals)
        }
      } catch (error) {
        console.error('Hydration error:', error)
      } finally {
        setLoading(false)
      }
    }

    hydrateSession()
  }, [sessionId])

  const handleRename = async () => {
    if (!tempName.trim()) return
    try {
      await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tempName })
      })
      setSessionName(tempName)
      setIsEditingName(false)
    } catch (error) {
      console.error('Rename failed:', error)
    }
  }

  const handleSend = async () => {
    if (!inputText.trim() || loading) return

    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      time: 'NOW'
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content: inputText })
      })
      const data = await response.json()
      
      if (data.signals || data.reply) {
        if (data.signals) setSignals(data.signals)
        if (data.summary) setSummary(data.summary)
        
        // Add AI acknowledgment from server
        setMessages(prev => [...prev, {
          id: data.replyId || Date.now() + 1,
          type: 'assistant',
          text: data.reply || `Got it. I'm starting to see a pattern: ${data.summary}`,
          time: 'JUST NOW'
        }])
      }
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = () => {
    navigate(`/directions/${sessionId}`)
  }

  return (
    <div className="curation-container">
      <div className="curation-main">
        <div className="local-theme-toggle">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
        <header className="curation-header">
          {isEditingName ? (
            <div className="title-edit-wrapper">
              <input 
                type="text" 
                className="title-input" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleRename}
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
              />
              <button className="btn-save-title" onClick={handleRename}>
                <Check size={18} />
              </button>
            </div>
          ) : (
            <div className="title-display-wrapper" onClick={() => { setIsEditingName(true); setTempName(sessionName); }}>
              <h1 className="curation-title">{sessionName}</h1>
              <PenLine size={16} className="edit-icon" />
            </div>
          )}
          <p className="curation-subtitle">Help us understand the recipient's unique essence.</p>
        </header>

        <div className="chat-window">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.type}`}>
              <div className="message-bubble">
                {msg.text}
              </div>
              <span className="message-meta">
                {msg.type.toUpperCase()} • {msg.time}
              </span>
            </div>
          ))}
          {loading && <div className="message-wrapper assistant"><div className="message-bubble loading-dots">...</div></div>}
        </div>

        <div className="input-container">
          <div className="action-bar-unified">
            <div className="input-wrapper">
              <input 
                type="text" 
                placeholder="Type your thoughts here..." 
                className="chat-input" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button className="send-button" onClick={handleSend} disabled={loading}>
                <Send size={20} />
              </button>
            </div>
            
            {messages.length > 2 && (
              <button className="generate-btn" onClick={handleGenerate}>
                Generate Gift Directions
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="curation-sidebar">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Current Understanding</h2>
          <BarChart2 size={20} className="sidebar-icon" />
        </div>

        <section className="understanding-section">
          <h3 className="section-label">SIGNALS DETECTED</h3>
          <div className="tag-group">
            {signals.length > 0 ? signals.map((s, i) => (
               <div key={i} className="signal-tag-wrapper">
                 <span className="tag" title={`Confidence: ${Math.round(s.confidence * 100)}%`}>
                   {s.value}
                 </span>
                 {s.evidence && (
                   <p className="signal-evidence">"{s.evidence}"</p>
                 )}
               </div>
            )) : <span className="tag-empty">Start chatting to see signals...</span>}
          </div>
          {summary && <p className="summary-text">{summary}</p>}
        </section>

      </aside>
    </div>
  )
}

export default Curation
