import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Send, FileText, BarChart2, Clock, Sparkles, Mail } from 'lucide-react'
import Dashboard  from './pages/Dashboard.jsx'
import Compose    from './pages/Compose.jsx'
import Templates  from './pages/Templates.jsx'
import Analytics  from './pages/Analytics.jsx'
import Schedule   from './pages/Schedule.jsx'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/compose',   icon: Send,            label: 'Send Emails' },
  { to: '/templates', icon: FileText,        label: 'Templates' },
  { to: '/schedule',  icon: Clock,           label: 'Schedule' },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
]

function Sidebar() {
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: 'var(--ink)',
      display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 10
    }}>
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Mail size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display', color: '#fff', fontSize: 18, lineHeight: 1 }}>MailBlast</div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 11, marginTop: 2 }}>v2.0</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
            borderRadius: 8, marginBottom: 2, color: isActive ? '#fff' : 'rgba(255,255,255,.45)',
            background: isActive ? 'rgba(255,255,255,.1)' : 'transparent',
            fontWeight: isActive ? 500 : 400, fontSize: 14, transition: 'all .15s'
          })}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{
          background: 'rgba(200,98,42,.15)', border: '1px solid rgba(200,98,42,.3)',
          borderRadius: 8, padding: '10px 12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Sparkles size={13} color='var(--accent-2)' />
            <span style={{ fontSize: 12, color: 'var(--accent-2)', fontWeight: 500 }}>AI Powered</span>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', lineHeight: 1.5 }}>
            Generate personalized emails with Claude AI
          </p>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', background: 'var(--paper)' }}>
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/compose"   element={<Compose />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/schedule"  element={<Schedule />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
