import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Rules from './pages/Rules'
import SixTwo from './pages/SixTwo'
import Where from './pages/Where'

export default function App() {
  return (
    <BrowserRouter>
      <header className="site-header">
        <Link to="/" className="brand">
          <span aria-hidden="true">🏐</span> 0- <span className="brand-sub">(5)</span>
        </Link>
        <nav>
          <NavLink to="/rules/1">Rules</NavLink>
          <NavLink to="/six-two">6-2</NavLink>
          <NavLink to="/practice">Practice</NavLink>
          <NavLink to="/where">See where you'd be</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<Navigate to="/rules/1" replace />} />
          <Route path="/rules/:step" element={<Rules />} />
          <Route path="/six-two" element={<SixTwo />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/where" element={<Where />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
