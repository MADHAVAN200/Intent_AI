import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Cpu, Sparkles, AlertCircle } from 'lucide-react'
import GlobalHeader from './GlobalHeader'
import './GiftDirections.css'

function GiftDirections({ theme, toggleTheme, onNewChat }) {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [directions, setDirections] = useState([])
  const [signalsCount, setSignalsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDirections = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/generate-directions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }) // Signals hydrated by backend
        })
        const data = await response.json()
        
        if (data.directions) {
          setDirections(data.directions)
          // We can estimate signal count or fetch it if needed, 
          // but for UI, we'll just show 'Curated'
          setSignalsCount(data.directions.length > 0 ? 5 : 0) // Placeholder or actual count
        } else {
          setError(data.error || 'Failed to generate thematic directions. Please try again.')
        }
      } catch (err) {
        setError('Connection error. Is the backend running?')
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) fetchDirections()
  }, [sessionId])

  const handleFeedback = async (directionId, action) => {
    try {
      await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directionId, action })
      })
      setDirections(prev => prev.map(d => d.id === directionId ? { ...d, action } : d))
    } catch (err) {
      console.error('Feedback failed:', err)
    }
  }

  const getIcon = (level) => {
    if (level === 'high') return <Sparkles size={24} />
    if (level === 'medium') return <Cpu size={24} />
    return <MapPin size={24} />
  }

  if (loading) return (
    <div className="directions-container loading-state">
      <div className="loader"></div>
      <p>Consulting the Meaning Engine...</p>
    </div>
  )

  if (error) return (
    <div className="directions-container error-state">
      <AlertCircle size={48} color="#ef4444" />
      <h2>Something went wrong</h2>
      <p>{error}</p>
      <button className="btn-back" onClick={() => navigate(`/curation/${sessionId}`)}>Go Back to Chat</button>
    </div>
  )

  return (
    <div className="directions-container">
      <GlobalHeader 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />
      <header className="directions-header">
        <div className="header-top-row">
          <h1 className="directions-title">Gift Directions</h1>
          <button 
            className="btn-refine"
            onClick={() => navigate(`/curation/${sessionId}`)}
            style={{
              padding: '0.6rem 1.2rem',
              backgroundColor: 'var(--card-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-dim)',
              borderRadius: '2rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Refine in Chat
          </button>
        </div>
        <div className="suggestion-badge">
          <Sparkles size={16} className="badge-icon" />
          <span>Curated paths mapped to the recipient's <span className="text-bold">unique energy</span>.</span>
        </div>
      </header>

      <div className="cards-grid">
        {directions.map((dir) => (
          <div key={dir.id} className={`direction-card ${dir.action ? 'fade-action' : ''}`}>
            <div className="card-top">
              <div className={`icon-box color-${dir.confidence_level}`}>
                {getIcon(dir.confidence_level)}
              </div>
              <div className="tag-group-directions">
                {dir.metadata?.is_learned_match && (
                  <span className="learned-badge">LEARNED PREFERENCE</span>
                )}
                <span className={`confidence-tag tag-${dir.confidence_level}`}>
                  {dir.confidence_level.toUpperCase()} CONFIDENCE
                </span>
              </div>
            </div>

            <h2 className="card-title">{dir.title}</h2>
            <p className="card-description">{dir.description}</p>

            <div className="why-works-section">
              <div className="why-works-title">WHY THIS WORKS</div>
              <div className="why-works-content persistent">
                <p>{dir.why_works}</p>
              </div>
            </div>

            <div className="card-actions-row">
              <button 
                className={`btn-accept ${dir.action === 'accept' ? 'active' : ''}`}
                onClick={() => handleFeedback(dir.id, 'accept')}
                disabled={!!dir.action}
              >
                {dir.action === 'accept' ? 'Accepted' : 'Accept Direction'}
              </button>
              <button 
                className={`btn-reject ${dir.action === 'reject' ? 'active' : ''}`}
                onClick={() => handleFeedback(dir.id, 'reject')}
                disabled={!!dir.action}
              >
                {dir.action === 'reject' ? 'Rejected' : 'Reject Direction'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GiftDirections
