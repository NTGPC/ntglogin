import { Link } from 'react-router-dom'

interface NavbarProps {
  onLogout: () => void
}

export default function Navbar({ onLogout }: NavbarProps) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          NTG Login
        </Link>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/profiles">Profiles</Link>
          <Link to="/proxies">Proxies</Link>
          <Link to="/sessions">Sessions</Link>
          <Link to="/jobs">Jobs</Link>
          <Link to="/job-executions">Executions</Link>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
      <style>{`
        .navbar {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          text-decoration: none;
        }
        .nav-links {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .nav-links a {
          color: #333;
          text-decoration: none;
          font-weight: 500;
          padding: 5px 10px;
          border-radius: 5px;
          transition: background 0.2s;
        }
        .nav-links a:hover {
          background: #f0f0f0;
        }
        .logout-btn {
          padding: 8px 16px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: 500;
        }
        .logout-btn:hover {
          background: #c82333;
        }
      `}</style>
    </nav>
  )
}

