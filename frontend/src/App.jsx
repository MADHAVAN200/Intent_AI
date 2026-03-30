import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Identity from './components/Identity'
import Onboarding from './components/Onboarding'
import Curation from './components/Curation'
import GiftDirections from './components/GiftDirections'
import GlobalHeader from './components/GlobalHeader'

// Router wrapper to access navigation hooks
function AppWrapper() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('gift_engine_theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [userId, setUserId] = useState(localStorage.getItem('gift_engine_user_id'))
  const [userEmail, setUserEmail] = useState(localStorage.getItem('gift_engine_user_email'))
  
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gift_engine_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const handleIdentified = (id, email) => {
    setUserId(id)
    setUserEmail(email)
    localStorage.setItem('gift_engine_user_id', id)
    localStorage.setItem('gift_engine_user_email', email)
    navigate('/onboarding')
  }

  const handleLogout = () => {
    localStorage.removeItem('gift_engine_user_id')
    localStorage.removeItem('gift_engine_user_email')
    setUserId(null)
    setUserEmail(null)
    navigate('/')
  }

  const handleCreateSession = async (templateId = 'custom', name = null) => {
    if (!userId) return
    
    try {
      const response = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, templateId, name }),
      })
      const data = await response.json()
      if (data.id) {
        navigate(`/curation/${data.id}`)
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={userId ? <Navigate to="/onboarding" /> : <Identity onIdentified={handleIdentified} />} 
      />
      <Route 
        path="/onboarding" 
        element={userId ? <Onboarding 
          userId={userId} 
          userEmail={userEmail}
          onStartSession={(id) => navigate(`/curation/${id}`)} 
          onCreateSession={handleCreateSession}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        /> : <Navigate to="/" />} 
      />
      <Route 
        path="/curation/:sessionId?" 
        element={userId ? <Curation 
          onNavigateToDirections={() => {}} 
          onBack={() => navigate('/onboarding')}
          theme={theme}
          toggleTheme={toggleTheme}
          onNewChat={() => handleCreateSession()}
        /> : <Navigate to="/" />} 
      />
      <Route 
        path="/directions/:sessionId" 
        element={userId ? <GiftDirections 
          onBackToCuration={(id) => navigate(`/curation/${id}`)}
          theme={theme}
          toggleTheme={toggleTheme}
          onNewChat={() => handleCreateSession()}
        /> : <Navigate to="/" />} 
      />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  )
}

export default App
