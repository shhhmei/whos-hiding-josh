import { BrowserRouter, Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Practice from './pages/Practice'
import Rules from './pages/Rules'

export default function App() {
  return (
    <BrowserRouter>
      <header className="site-header">
        <Link to="/" className="brand">
          <span aria-hidden="true">🏐</span> Who's hiding Josh <span className="brand-sub">(and Cynthia)</span>
        </Link>
        <nav>
          <NavLink to="/rules/1">Rules</NavLink>
          <NavLink to="/practice">Practice</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rules" element={<Navigate to="/rules/1" replace />} />
          <Route path="/rules/:step" element={<Rules />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
