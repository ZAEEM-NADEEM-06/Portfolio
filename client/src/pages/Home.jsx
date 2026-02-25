import { useState, useEffect } from 'react'
import { projectsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'
import './Home.css'

const Home = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [error, setError] = useState(null)
  const [imageOrientations, setImageOrientations] = useState({})
  
  // New state for contact form
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    // Detect image orientations after projects are loaded
    if (projects.length > 0) {
      detectImageOrientations()
    }
  }, [projects])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await projectsAPI.getAll()
      setProjects(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const detectImageOrientations = () => {
    const orientations = {}
    
    projects.forEach(project => {
      const img = new Image()
      img.src = project.image
      img.onload = () => {
        const aspectRatio = img.width / img.height
        
        if (aspectRatio > 1.2) {
          orientations[project._id] = 'landscape'
        } else if (aspectRatio < 0.8) {
          orientations[project._id] = 'portrait'
        } else {
          orientations[project._id] = 'square'
        }
        
        setImageOrientations(prev => ({ ...prev, ...orientations }))
      }
    })
  }

  // Handle contact form input changes
  const handleContactChange = (e) => {
    const { name, value } = e.target
    setContactData(prev => ({ ...prev, [name]: value }))
  }

  // Handle contact form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Message sent successfully!')
        setContactData({ name: '', email: '', message: '' })
      } else {
        toast.error(data.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const categories = [
    { id: 'all', label: 'All Work' },
    { id: 'textile', label: 'Textile' },
    { id: 'drawings', label: 'Drawings' },
    { id: 'paintings', label: 'Paintings' },
    { id: 'crafts', label: 'Crafts' }
  ]

  const filteredProjects = activeCategory === 'all' 
    ? projects 
    : projects.filter(p => p.category === activeCategory)

  if (loading) return <LoadingSpinner />

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content container">
          <h1 className="hero-title">
            MAHEEN<br />NADEEM
          </h1>
          <p className="hero-subtitle">Textile Designer</p>
          <p className="hero-description">
            Creative and dedicated Textile Designer with a strong passion for developing 
            innovative and visually captivating designs. Skilled in digital design tools 
            such as Adobe Photoshop and Illustrator.
          </p>
          <div className="hero-buttons">
            <a href="#work" className="btn">Explore Portfolio</a>
            <a href="#about" className="btn btn-outline">About Me</a>
          </div>
        </div>
      </section>

      {/* Work Section */}
      <section id="work" className="work section">
        <div className="container">
          <h2>Selected Work</h2>
          
          {/* Category Filter */}
          <div className="work-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`filter-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          {error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="work-grid">
              {filteredProjects.map(project => {
                const orientation = imageOrientations[project._id] || 'square'
                
                return (
                  <div 
                    key={project._id} 
                    className={`work-item ${orientation} ${project.category}`}
                  >
                    <div className={`work-image ${orientation}`}>
                      <img 
                        src={project.image} 
                        alt={project.title} 
                        loading="lazy"
                      />
                      <div className="work-overlay">
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section-light">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <h2>About Maheen</h2>
              <p className="about-text">
                Creative and dedicated Textile Designer with a strong passion for developing 
                innovative and visually captivating designs. Skilled in digital design tools 
                such as Adobe Photoshop and Illustrator, with a solid understanding of patterns, 
                dyes, textures, and yarns.
              </p>
              <p className="about-text">
                Experienced in developing textile concepts, creating surface designs, and 
                contributing to design projects through various internships. Known for strong 
                multitasking, communication, and collaborative skills.
              </p>
              
              <div className="about-stats">
                <div className="stat">
                  <span className="stat-number">3.76</span>
                  <span className="stat-label">CGPA</span>
                </div>
                <div className="stat">
                  <span className="stat-number">3+</span>
                  <span className="stat-label">Internships</span>
                </div>
                <div className="stat">
                  <span className="stat-number">2025</span>
                  <span className="stat-label">Graduation</span>
                </div>
              </div>

              <div className="about-awards">
                <h3>Awards & Recognition</h3>
                <ul>
                  <li>Graphic Designing - SCSB - Nest</li>
                  <li>Talent Scholarship (PEEF)</li>
                  <li>Australia PM Laptop Awardee</li>
                </ul>
              </div>
            </div>
            
            <div className="about-image">
              <img src="public/img1.jpeg" alt="Maheen Nadeem" />
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="skills section">
        <div className="container">
          <h2>Skills & Expertise</h2>
          <div className="skills-grid">
            <div className="skill-category">
              <h3>Design Software</h3>
              <ul>
                <li>Adobe Photoshop</li>
                <li>Adobe Illustrator</li>
                <li>Arah Weave</li>
                <li>DB Weave</li>
              </ul>
            </div>
            <div className="skill-category">
              <h3>Techniques</h3>
              <ul>
                <li>Surface Creation</li>
                <li>Pattern Design</li>
                <li>Embroidery</li>
                <li>Embellishment</li>
              </ul>
            </div>
            <div className="skill-category">
              <h3>Traditional</h3>
              <ul>
                <li>Sketching</li>
                <li>Painting</li>
                <li>Handmade Techniques</li>
                <li>Textile Processing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact section-light">
        <div className="container">
          <h2>Get in Touch</h2>
          <div className="contact-grid">
            <div className="contact-info">
              <h3>Let's collaborate</h3>
              <p>Available for freelance work and collaborations</p>
              <div className="contact-details">
                <p><strong>Email:</strong> aesthetics5677@gmail.com</p>
                <p><strong>Phone:</strong> 0323-5095216</p>
                <p><strong>Location:</strong> Gujranwala, Pakistan</p>
              </div>
              <div className="contact-social">
                <a href="https://www.behance.net/Maheennaedemm" target="_blank" rel="noopener noreferrer">Behance</a>
                <a href="https://www.instagram.com/wonders_by_meeni" target="_blank" rel="noopener noreferrer">Instagram</a>
              </div>
            </div>
            
            {/* Updated Contact Form with functionality */}
            <form className="contact-form" onSubmit={handleContactSubmit}>
              <input 
                type="text" 
                name="name"
                placeholder="Name" 
                value={contactData.name}
                onChange={handleContactChange}
                required 
              />
              <input 
                type="email" 
                name="email"
                placeholder="Email" 
                value={contactData.email}
                onChange={handleContactChange}
                required 
              />
              <textarea 
                name="message"
                rows="5" 
                placeholder="Message" 
                value={contactData.message}
                onChange={handleContactChange}
                required
              ></textarea>
              <button 
                type="submit" 
                className="btn" 
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home