import { useState, useEffect } from 'react'
import GlobalHeader from './GlobalHeader'
import {
  Cake,
  Sparkles,
  Heart,
  Home,
  MapPin,
  PartyPopper,
  Plus,
  History,
  MessageSquare,
  User,
  LogOut,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react'
import './Onboarding.css'

const templates = [
  {
    id: 'birthday',
    title: 'A Milestone Birthday',
    description: "Tell me about a partner turning 30, a parent's 60th, or a golden jubilee.",
    icon: <Cake size={24} />,
    iconBg: '#eef2ff'
  },
  {
    id: 'surprise',
    title: 'An Unexpected Surprise',
    description: 'Brighten a Tuesday or celebrate a "just because" moment for a friend.',
    icon: <Sparkles size={24} />,
    iconBg: '#e9f5fe'
  },
  {
    id: 'thanks',
    title: 'A Quiet Thank You',
    description: 'Express gratitude to a mentor, neighbor, or colleague with elegance.',
    icon: <Heart size={24} />,
    iconBg: '#fef2f2'
  },
  {
    id: 'beginnings',
    title: 'New Beginnings',
    description: 'Housewarmings, job promotions, or embarking on a fresh journey.',
    icon: <Home size={24} />,
    iconBg: '#f0fdf4'
  },
  {
    id: 'longdistance',
    title: 'Long Distance Love',
    description: 'Bridge the gap with a gesture that feels like a warm embrace from afar.',
    icon: <MapPin size={24} />,
    iconBg: '#fff7ed'
  },
  {
    id: 'custom',
    title: 'Custom Celebration',
    description: 'Anniversaries, graduations, or any unique achievement worth noting.',
    icon: <PartyPopper size={24} />,
    iconBg: '#faf5ff'
  }
]

function Onboarding({ userId, userEmail, onStartSession, onCreateSession, onLogout, theme, toggleTheme }) {
  const [sessions, setSessions] = useState([])
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/sessions?userId=${userId}`)
        const data = await response.json()
        setSessions(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Fetch history failed:', error)
      }
    }
    
    if (userId) fetchHistory()
  }, [userId])

  const handleTemplateClick = (templateId) => {
    onCreateSession(templateId)
  }

  const handleStartEdit = (e, session) => {
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditValue(session.name)
  }

  const handleCancelEdit = (e) => {
    e.stopPropagation()
    setEditingSessionId(null)
    setEditValue('')
  }

  const handleSaveRename = async (e, sessionId) => {
    if (e) e.stopPropagation()
    if (!editValue.trim()) return handleCancelEdit(e)

    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() })
      })
      
      if (response.ok) {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name: editValue.trim() } : s))
        setEditingSessionId(null)
      }
    } catch (err) {
      console.error('Rename failed:', err)
    }
  }

  const handleDelete = (e, sessionId) => {
    e.stopPropagation()
    setDeleteConfirmId(sessionId)
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const confirmDelete = async () => {
    if (!deleteConfirmId) return

    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${deleteConfirmId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== deleteConfirmId))
        setDeleteConfirmId(null)
      }
    } catch (err) {
      console.error('Delete failed:', err)
      setDeleteConfirmId(null)
    }
  }

  return (
    <div className="onboarding-layout">
      <aside className="onboarding-sidebar">
        <div className="sidebar-header-onboarding">
          <History size={20} className="history-icon" />
          <h2 className="sidebar-title">History</h2>
        </div>

        <div className="new-chat-wrapper">
          <button className="new-chat-sidebar-btn" onClick={() => onCreateSession()}>
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        </div>

        <div className="history-list">
          {sessions.map((session) => (
            <div 
              key={session.id} 
              className={`history-item ${editingSessionId === session.id ? 'editing' : ''}`}
              onClick={() => editingSessionId !== session.id && onStartSession(session.id)}
            >
              <MessageSquare size={16} className="history-icon" />
              <div className="history-details">
                {editingSessionId === session.id ? (
                  <div className="edit-wrapper" onClick={e => e.stopPropagation()}>
                    <input 
                      autoFocus
                      className="edit-input"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRename(null, session.id)
                        if (e.key === 'Escape') handleCancelEdit(e)
                      }}
                    />
                    <div className="edit-actions">
                      <button className="icon-btn save" onClick={e => handleSaveRename(e, session.id)}>
                        <Check size={14} />
                      </button>
                      <button className="icon-btn cancel" onClick={handleCancelEdit}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="history-name">{session.name}</span>
                    <span className="history-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
              
              {editingSessionId !== session.id && (
                <div className="history-actions">
                  <button className="action-btn edit" onClick={e => handleStartEdit(e, session)} title="Rename">
                    <Edit2 size={14} />
                  </button>
                  <button className="action-btn delete" onClick={e => handleDelete(e, session.id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="no-history">No past conversations</div>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-details">
              <span className="user-email">{userEmail}</span>
            </div>
          </div>
          <button className="logout-icon-btn" onClick={onLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="onboarding-content">
        <GlobalHeader 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
        <header className="content-header">
          <h1 className="title">
            How should we <span className="highlight">start?</span>
          </h1>
          <p className="subtitle">
            Choose a template to begin our conversation or write your own curated gesture.
          </p>
        </header>

        <div className="templates-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleTemplateClick(template.id)}
            >
              <div className="icon-container" style={{ backgroundColor: template.iconBg }}>
                {template.icon}
              </div>
              <div className="card-content">
                <h3 className="card-title">{template.title}</h3>
                <p className="card-description">{template.description}</p>
              </div>
            </div>
          ))}
        </div>

        <footer className="onboarding-footer">
          <p className="footer-note">Our AI guide will help you refine your ideas into meaningful gestures.</p>
        </footer>
      </main>

      {deleteConfirmId && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <Trash2 size={24} className="delete-warning-icon" />
              <h3>Delete Conversation?</h3>
            </div>
            <p>This will permanently remove your progress and any signals extracted from this chat. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={cancelDelete}>Cancel</button>
              <button className="modal-btn confirm-delete" onClick={confirmDelete}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Onboarding
