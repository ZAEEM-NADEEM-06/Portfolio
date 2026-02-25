import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authAPI } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

const PrivateRoute = ({ isAuthenticated, children }) => {
  const [checking, setChecking] = useState(true)
  const [valid, setValid] = useState(false)
  
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token')
      
      if (!token || !isAuthenticated) {
        setValid(false)
        setChecking(false)
        return
      }
      
      try {
        await authAPI.verify()
        setValid(true)
      } catch (error) {
        console.log('Token invalid in private route')
        localStorage.removeItem('token')
        sessionStorage.clear()
        setValid(false)
      } finally {
        setChecking(false)
      }
    }
    
    verifyToken()
  }, [isAuthenticated])
  
  if (checking) {
    return <LoadingSpinner />
  }
  
  if (!valid || !isAuthenticated) {
    // Get the admin path from env for redirect
    const adminPath = import.meta.env.VITE_ADMIN_SECRET_PATH || 'maheen-dashboard-2025'
    return <Navigate to={`/${adminPath}`} replace />
  }

  return children
}

export default PrivateRoute