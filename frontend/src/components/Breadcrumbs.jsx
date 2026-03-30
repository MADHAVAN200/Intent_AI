import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, Home, Users, MessageSquare, Gift } from 'lucide-react'
import './Breadcrumbs.css'

function Breadcrumbs({ userId }) {
  const navigate = useNavigate()
  const location = useLocation()

  const path = location.pathname

  const steps = [
    { name: 'Identify', path: '/', icon: Users, active: path === '/' || !userId },
    { name: 'Onboarding', path: '/onboarding', icon: Home, active: path === '/onboarding' },
    { name: 'Curation', path: '/curation', icon: MessageSquare, active: path.startsWith('/curation') },
    { name: 'Suggestions', path: '/directions', icon: Gift, active: path.startsWith('/directions') }
  ]

  // Find current step index
  const currentIndex = steps.findIndex(s => s.active)

  const handleNavigate = (targetPath, index) => {
    // Only allow navigating back or to current
    if (index <= currentIndex && userId) {
      navigate(targetPath)
    }
  }

  if (!userId && path !== '/') return null

  return (
    <nav className="breadcrumbs-container">
      <div className="breadcrumbs-inner">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isPast = index < currentIndex
          const isCurrent = index === currentIndex
          const isFuture = index > currentIndex

          return (
            <React.Fragment key={step.name}>
              <div
                className={`breadcrumb-item ${isCurrent ? 'active' : ''} ${isPast ? 'past' : ''} ${isFuture ? 'future' : ''}`}
                onClick={() => handleNavigate(step.path, index)}
              >
                <div className="breadcrumb-icon">
                  <Icon size={16} />
                </div>
                <span className="breadcrumb-name">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="breadcrumb-separator">
                  <ChevronRight size={14} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </nav>
  )
}

export default Breadcrumbs
  )
}

export default Breadcrumbs
