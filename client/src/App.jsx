import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import PrivateRoute from './components/PrivateRoute'
import ScrollToTop from './components/ScrollToTop'
import { authAPI } from './services/api'
import LoadingSpinner from './components/LoadingSpinner'
import toast from 'react-hot-toast'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  // Get secret admin path from env
  const adminPath = import.meta.env.VITE_ADMIN_SECRET_PATH || 'maheen-dashboard-2025'
  console.log('🔐 Admin path:', adminPath)

  useEffect(() => {
    checkAuthStatus()
  }, [location.pathname])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    try {
      await authAPI.verify()
      setIsAuthenticated(true)
    } catch (error) {
      console.log('Auth failed:', error.message)
      localStorage.removeItem('token')
      sessionStorage.clear()
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  const isDashboardRoute = location.pathname.includes('/dashboard')

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="app">
      <ScrollToTop />
      <Navbar isAuthenticated={isAuthenticated} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Secret admin login page */}
          <Route 
            path={`/${adminPath}`} 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <AdminLogin onLogin={handleLogin} />
            } 
          />
          {/* Dashboard - always at /dashboard */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <AdminDashboard onLogout={handleLogout} />
              </PrivateRoute>
            } 
          />
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  )
}

export default App