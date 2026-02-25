import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectsAPI, authAPI } from '../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import './AdminDashboard.css'

const AdminDashboard = ({ onLogout }) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('projects')
  const [projects, setProjects] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    image: null
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsAPI.getAll()
      setProjects(response.data)
    } catch (error) {
      console.error('Fetch error:', error)
      
      if (error.response?.data?.code === 'TOKEN_VERSION_MISMATCH' ||
          error.response?.data?.message?.includes('Session expired')) {
        toast.error('Session expired. Logging out...')
        handleForceLogout()
      }
      else if (error.code === 'ERR_NETWORK') {
        toast.error('Server connection lost. Logging out...')
        handleForceLogout()
      }
      else if (error.response?.status === 401) {
        toast.error('Unauthorized. Logging out...')
        handleForceLogout()
      } else {
        toast.error('Failed to load projects')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      setMessagesLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.messages)
      } else {
        toast.error('Failed to load messages')
      }
    } catch (error) {
      console.error('Fetch messages error:', error)
      toast.error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }

  const markMessageAsRead = async (id) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/messages/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessages(messages.map(msg => 
          msg._id === id ? { ...msg, read: true } : msg
        ))
        if (selectedMessage?._id === id) {
          setSelectedMessage({ ...selectedMessage, read: true })
        }
        toast.success('Message marked as read')
      }
    } catch (error) {
      console.error('Mark as read error:', error)
      toast.error('Failed to mark as read')
    }
  }

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/messages/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMessages(messages.filter(msg => msg._id !== id))
        if (selectedMessage?._id === id) setSelectedMessage(null)
        toast.success('Message deleted')
      }
    } catch (error) {
      console.error('Delete message error:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleForceLogout = () => {
    localStorage.removeItem('token')
    sessionStorage.clear()
    onLogout()
    navigate('/admin', { replace: true })
  }

  const handleLogout = async () => {
    try {
      toast.loading('Logging out...', { id: 'logout' })
      await authAPI.logout()
      toast.success('Logged out successfully', { id: 'logout' })
    } catch (error) {
      console.log('Logout error:', error)
      toast.success('Logged out successfully', { id: 'logout' })
    } finally {
      localStorage.removeItem('token')
      sessionStorage.clear()
      onLogout()
      navigate('/admin', { replace: true })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await projectsAPI.update(editingId, formData)
        toast.success('Project updated successfully')
      } else {
        await projectsAPI.create(formData)
        toast.success('Project added successfully')
      }
      
      setFormData({ title: '', category: '', description: '', image: null })
      setEditingId(null)
      fetchProjects()
      setActiveTab('projects')
    } catch (error) {
      console.error('Submit error:', error)
      
      if (error.response?.data?.code === 'TOKEN_VERSION_MISMATCH' ||
          error.response?.data?.message?.includes('Session expired')) {
        toast.error('Session expired. Logging out...')
        handleForceLogout()
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Server connection lost. Logging out...')
        handleForceLogout()
      } else {
        toast.error(error.response?.data?.message || 'Operation failed')
      }
    }
  }

  const handleEdit = (project) => {
    setFormData({
      title: project.title,
      category: project.category,
      description: project.description,
      image: null
    })
    setEditingId(project._id)
    setActiveTab('add')
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectsAPI.delete(id)
        toast.success('Project deleted successfully')
        fetchProjects()
      } catch (error) {
        console.error('Delete error:', error)
        
        if (error.response?.data?.code === 'TOKEN_VERSION_MISMATCH' ||
            error.response?.data?.message?.includes('Session expired')) {
          toast.error('Session expired. Logging out...')
          handleForceLogout()
        } else if (error.code === 'ERR_NETWORK') {
          toast.error('Server connection lost. Logging out...')
          handleForceLogout()
        } else {
          toast.error('Failed to delete project')
        }
      }
    }
  }

  if (loading && activeTab === 'projects') {
    return <LoadingSpinner />
  }

  return (
    <div className="admin-dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <h2>MAHEEN NADEEM</h2>
          <p>Admin Panel</p>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            Projects
          </button>
          <button 
            className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setEditingId(null)
              setFormData({ title: '', category: '', description: '', image: null })
              setActiveTab('add')
            }}
          >
            Add New
          </button>
          <button 
            className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('messages')
              fetchMessages()
            }}
          >
            Messages {messages.filter(m => !m.read).length > 0 && (
              <span className="message-badge">{messages.filter(m => !m.read).length}</span>
            )}
          </button>
        </nav>
        
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'projects' && (
          <div className="projects-tab">
            <div className="tab-header">
              <h2>Manage Projects</h2>
            </div>
            
            <div className="projects-list">
              {projects.length === 0 ? (
                <p className="no-projects">No projects found. Add your first project!</p>
              ) : (
                projects.map(project => (
                  <div key={project._id} className="project-card">
                    <img src={project.image} alt={project.title} />
                    <div className="project-info">
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      <span className="category">{project.category}</span>
                    </div>
                    <div className="project-actions">
                      <button className="edit-btn" onClick={() => handleEdit(project)}>Edit</button>
                      <button className="delete-btn" onClick={() => handleDelete(project._id)}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-tab">
            <h2>{editingId ? 'Edit Project' : 'Add New Project'}</h2>
            
            <form onSubmit={handleSubmit} className="add-form">
              <div className="form-group">
                <label>Project Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
              </div>
              
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange} required>
                  <option value="">Select category</option>
                  <option value="textile">Textile</option>
                  <option value="drawings">Drawings</option>
                  <option value="paintings">Paintings</option>
                  <option value="crafts">Crafts</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" required></textarea>
              </div>
              
              <div className="form-group">
                <label>Project Image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} required={!editingId} />
                {editingId && <small className="file-hint">Leave empty to keep current image</small>}
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  {editingId ? 'Update Project' : 'Add Project'}
                </button>
                {editingId && (
                  <button type="button" className="btn-outline" onClick={() => {
                    setEditingId(null)
                    setFormData({ title: '', category: '', description: '', image: null })
                  }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages-tab">
            <div className="tab-header">
              <h2>Contact Messages</h2>
            </div>
            
            {messagesLoading ? (
              <LoadingSpinner />
            ) : (
              <div className="messages-container">
                <div className="messages-list">
                  {messages.length === 0 ? (
                    <p className="no-messages">No messages yet</p>
                  ) : (
                    messages.map(message => (
                      <div 
                        key={message._id} 
                        className={`message-item ${!message.read ? 'unread' : ''} ${selectedMessage?._id === message._id ? 'selected' : ''}`}
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div className="message-header">
                          <h4>{message.name}</h4>
                          <span className="message-date">
                            {new Date(message.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="message-preview">
                          <p className="message-email">{message.email}</p>
                          <p className="message-excerpt">
                            {message.message.substring(0, 60)}...
                          </p>
                        </div>
                        {!message.read && <span className="unread-dot"></span>}
                      </div>
                    ))
                  )}
                </div>
                
                {selectedMessage && (
                  <div className="message-detail">
                    <div className="message-detail-header">
                      <h3>Message from {selectedMessage.name}</h3>
                      <div className="message-actions">
                        {!selectedMessage.read && (
                          <button 
                            className="mark-read-btn"
                            onClick={() => markMessageAsRead(selectedMessage._id)}
                          >
                            Mark as Read
                          </button>
                        )}
                        <button 
                          className="delete-message-btn"
                          onClick={() => deleteMessage(selectedMessage._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="message-meta">
                      <p><strong>Email:</strong> {selectedMessage.email}</p>
                      <p><strong>Received:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                      <p><strong>Status:</strong> {selectedMessage.read ? 'Read' : 'Unread'}</p>
                    </div>
                    <div className="message-body">
                      <p>{selectedMessage.message}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard