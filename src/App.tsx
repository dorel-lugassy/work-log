import { useState, useEffect } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Jobs } from './pages/Jobs'
import { Reports } from './pages/Reports'
import { Navigation } from './components/Navigation'
import { ThemeToggle } from './components/ThemeToggle'
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import Login from './components/Login'

type Page = 'dashboard' | 'jobs' | 'reports'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'jobs':
        return <Jobs />
      case 'reports':
        return <Reports />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app-container">
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthLoading>
      <Unauthenticated>
        <Login />
      </Unauthenticated>
      <Authenticated>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
        <main className="main-content">
          {renderPage()}
        </main>
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      </Authenticated>
    </div>
  )
}

export default App
