import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI, checkServerHealth } from '../services/api'
import toast from 'react-hot-toast'
import './AdminLogin.css'

const AdminLogin = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [serverStatus, setServerStatus] = useState('checking')
  const navigate = useNavigate()

  useEffect(() => {
    // Clear any stale sessions
    localStorage.removeItem('token')
    localStorage.removeItem('sessionId')
    sessionStorage.clear()
    
    // Check server health
    checkServerHealthStatus()
  }, [])

  const checkServerHealthStatus = async () => {
    const isHealthy = await checkServerHealth()
    setServerStatus(isHealthy ? 'online' : 'offline')
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Double-check server before attempting login
      const isHealthy = await checkServerHealth()
      if (!isHealthy) {
        setError('Cannot connect to server. Please try again.')
        toast.error('Server is offline')
        setLoading(false)
        return
      }
      
      const response = await authAPI.login(credentials)
      
      // Check if login was successful
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token)
        onLogin()
        toast.success('Login successful!')
        navigate('/dashboard', { replace: true })
      } else {
        setError(response.data?.message || 'Login failed')
        toast.error(response.data?.message || 'Login failed')
      }
      
    } catch (error) {
      console.error('Login error:', error)
      
      if (error.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please check if server is running.')
        toast.error('Server connection failed')
      } else if (error.response?.data?.message) {
        setError(error.response.data.message)
        toast.error(error.response.data.message)
      } else {
        setError('Invalid username or password')
        toast.error('Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  if (serverStatus === 'checking') {
    return (
      <div className="admin-login">
        <div className="login-container">
          <div className="login-header">
            <h1>Admin Access</h1>
            <p>Checking server connection...</p>
          </div>
          <div className="loading-spinner-small"></div>
        </div>
      </div>
    )
  }

  if (serverStatus === 'offline') {
    return (
      <div className="admin-login">
        <div className="login-container">
          <div className="login-header">
            <h1>Server Offline</h1>
            <p className="error-message">Cannot connect to server. Please try again later.</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn login-btn"
          >
            Retry Connection
          </button>
          <Link to="/" className="back-link">← Back to Portfolio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>Admin Access</h1>
          <p>Enter your credentials to manage portfolio</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="maheen"
              autoComplete="off"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="••••••••"
              autoComplete="off"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn login-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <Link to="/" className="back-link">← Back to Portfolio</Link>
      </div>
    </div>
  )
}

export default AdminLogin