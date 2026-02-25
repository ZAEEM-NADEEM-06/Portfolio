import axios from 'axios'

const adminPath = import.meta.env.VITE_ADMIN_SECRET_PATH || 'maheen-dashboard-2025'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

console.log('🔐 API URL:', API_URL)
console.log('🔐 Admin Path:', adminPath)

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 8000
})

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session overridden (logged in from another device)
    if (error.response?.data?.code === 'SESSION_OVERRIDDEN') {
      console.log('🔄 Session overridden - logged in from another device')
      localStorage.removeItem('token')
      localStorage.removeItem('sessionId')
      sessionStorage.clear()
      
      alert('You have been logged out because you logged in from another device.')
      window.location.href = `/${adminPath}`
    }
    
    // Handle other auth errors
    else if (error.response?.data?.code === 'TOKEN_VERSION_MISMATCH' ||
        error.response?.data?.message?.includes('Session expired')) {
      localStorage.removeItem('token')
      localStorage.removeItem('sessionId')
      sessionStorage.clear()
      
      if (!window.location.pathname.includes(`/${adminPath}`)) {
        window.location.href = `/${adminPath}`
      }
    }
    
    // Handle network errors
    else if (error.code === 'ERR_NETWORK') {
      console.log('🔌 Network error - server unreachable')
    }
    
    return Promise.reject(error)
  }
)

// Health check function
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`)
    return response.ok
  } catch (error) {
    return false
  }
}

// Auth APIs
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/${adminPath}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const error = new Error(data.message || 'Login failed')
        error.response = { data }
        throw error
      }
      
      // Store token if login successful
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  },
  
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/${adminPath}/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      localStorage.removeItem('token')
      localStorage.removeItem('sessionId')
      sessionStorage.clear()
      
      return await response.json()
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('sessionId')
      sessionStorage.clear()
      return { success: true, message: 'Logged out locally' }
    }
  },
  
  verify: async () => {
    try {
      const response = await fetch(`${API_URL}/${adminPath}/verify`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  },
  
  changePassword: async (passwordData) => {
    try {
      const response = await fetch(`${API_URL}/${adminPath}/change-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Password change failed')
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  }
}

// Projects APIs
export const projectsAPI = {
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/projects`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  },
  
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error('Failed to fetch project')
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  },
  
  create: async (formData) => {
    try {
      const response = await fetch(`${API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create project')
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  },
  
  update: async (id, formData) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update project')
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  },
  
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete project')
      }
      
      return { data }
    } catch (error) {
      throw error
    }
  }
}

export default api