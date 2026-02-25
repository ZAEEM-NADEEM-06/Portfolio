import { Link, useNavigate } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const navigate = useNavigate()

  const handleNavigation = (sectionId) => {
    if (window.location.pathname !== '/') {
      // If not on home page, navigate to home first then scroll
      navigate('/')
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      // If on home page, just scroll
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <footer className="footer">
      <div className="footer-container container">
        <div className="footer-grid">
          <div className="footer-info">
            <h3>MAHEEN NADEEM</h3>
            <p>Textile Designer</p>
            <div className="footer-social">
              <a 
                href="https://www.behance.net/Maheennaedemm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                Behance
              </a>
              <a 
                href="https://www.instagram.com/wonders_by_meeni" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
              >
                Instagram
              </a>
            </div>
          </div>
          
          <div className="footer-contact">
            <h4>Contact</h4>
            <p>
              <a href="tel:03235095216" className="contact-link">
                0323-5095216
              </a>
            </p>
            <p>
              <a href="mailto:aesthetics5677@gmail.com" className="contact-link">
                aesthetics5677@gmail.com
              </a>
            </p>
            <p>St no.4 Mohallah Ahmad Pura, Gujranwala</p>
          </div>
          
          <div className="footer-quick">
            <h4>Quick Links</h4>
            <ul>
              <li>
                <button 
                  onClick={() => handleNavigation('work')}
                  className="footer-link-btn"
                >
                  Work
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('about')}
                  className="footer-link-btn"
                >
                  About
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('contact')}
                  className="footer-link-btn"
                >
                  Contact
                </button>
              </li>
              {/* Admin link removed */}
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Maheen Nadeem. All rights reserved.</p>
          <p>Designed with ♥ for textile art</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer