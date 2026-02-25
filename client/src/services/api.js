import axios from 'axios'

const adminPath = import.meta.env.VITE_ADMIN_SECRET_PATH || 'maheen-dashboard-2025'
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 8000
})

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session overridden (logged in from another device)
    if (error.response?.data?.code === 'SESSION_OVERRIDDEN') {
      console.log('🔄 Session overridden - logged in from another device')
      localStorage.removeItem('token')
      localStorage.removeItem('sessionId')
      sessionStorage.clear()
      
      // Show user-friendly message
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
      
      // Don't clear token immediately, let the health check handle it
      // Just show a toast in the UI component
    }
    
    return Promise.reject(error)
  }
)

// Health check function
export const checkServerHealth = async () => {
  try {
    const response = await api.get('/health')
    return response.data.status === 'online'
  } catch (error) {
    return false
  }
}

// Auth APIs
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post(`/${adminPath}/login`, credentials)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        if (response.data.sessionId) {
          localStorage.setItem('sessionId', response.data.sessionId)
        }
      }
      return response
    } catch (error) {
      throw error
    }
  },
  logout: () => {
    const token = localStorage.getItem('token')
    localStorage.removeItem('token')
    localStorage.removeItem('sessionId')
    sessionStorage.clear()
    
    if (token) {
      return api.post(`/${adminPath}/logout`).catch(() => ({}))
    }
    return Promise.resolve({})
  },
  verify: () => api.get(`/${adminPath}/verify`),
  health: () => api.get('/health')
}

// Projects APIs remain the same
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'image') formData.append('image', data.image)
      else formData.append(key, data[key])
    })
    return api.post('/projects', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  update: (id, data) => {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'image' && data.image) formData.append('image', data.image)
      else formData.append(key, data[key])
    })
    return api.put(`/projects/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  delete: (id) => api.delete(`/projects/${id}`)
}

export default api