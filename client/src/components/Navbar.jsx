import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import './Navbar.css'

const Navbar = ({ isAuthenticated }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  const handleNavigation = (e, sectionId) => {
    e.preventDefault()
    
    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const handleDownloadCV = () => {
    const cvUrl = '/cv/Maheen_Nadeem_CV.pdf'
    const link = document.createElement('a')
    link.href = cvUrl
    link.download = 'Maheen_Nadeem_CV.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Downloading CV...')
  }

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" onClick={() => window.scrollTo(0, 0)}>
          MAHEEN NADEEM
        </Link>

        <button 
          className={`menu-toggle ${isMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <Link to="/" className="nav-link" onClick={() => window.scrollTo(0, 0)}>Home</Link>
            <a href="#work" className="nav-link" onClick={(e) => handleNavigation(e, 'work')}>Work</a>
            <a href="#about" className="nav-link" onClick={(e) => handleNavigation(e, 'about')}>About</a>
            <a href="#contact" className="nav-link" onClick={(e) => handleNavigation(e, 'contact')}>Contact</a>
          </div>
          
          {isAuthenticated ? (
            <Link to="/dashboard" className="nav-admin">Dashboard</Link>
          ) : (
            <button onClick={handleDownloadCV} className="nav-admin">RESUME</button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar