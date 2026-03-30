import React from 'react'
import { Sun, Moon } from 'lucide-react'
import './GlobalHeader.css'

function GlobalHeader({ theme, toggleTheme }) {
  return (
    <header className="global-header">
      <div className="header-actions">
        <button 
          className="header-btn theme-toggle-btn" 
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  )
}

export default GlobalHeader
