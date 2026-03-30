import React, { useState } from 'react'
import { ArrowRight, Sparkles, Mail } from 'lucide-react'
import './Identity.css'

function Identity({ onIdentified }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:5000/api/auth/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      if (data.userId) {
        onIdentified(data.userId, email)
      } else {
        throw new Error(data.error || 'Identity verification failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="identity-container">
      <div className="identity-card">
        <div className="identity-header">
          <div className="brand-icon">
            <Sparkles size={32} />
          </div>
          <h1>Gift Meaning Engine</h1>
          <p>Enter your email to restore your history or start a new curation.</p>
        </div>

        <form onSubmit={handleSubmit} className="identity-form">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="identify-btn" disabled={loading || !email}>
            {loading ? 'Identifying...' : 'Continue'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="identity-footer">
          <p>Your history and learned preferences are linked to this email.</p>
        </div>
      </div>
    </div>
  )
}

export default Identity
