import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Send, FileText, Clock, BarChart2, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { PageHeader, Card, StatCard, Badge, StatusBadge, Spinner } from '../components/UI.jsx'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/analytics/summary').then(r => setStats(r.data)),
      axios.get('/api/emails/logs').then(r => setLogs(r.data.slice(0, 8)))
    ]).finally(() => setLoading(false))
  }, [])

  const quickLinks = [
    { to: '/compose',   icon: Send,     label: 'Send Campaign',   desc: 'Upload CSV & send' },
    { to: '/templates', icon: FileText, label: 'Templates',       desc: 'Manage email templates' },
    { to: '/schedule',  icon: Clock,    label: 'Schedule',        desc: 'Queue future campaigns' },
    { to: '/analytics', icon: BarChart2,label: 'Analytics',       desc: 'View performance data' },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back, Chanchal. Here's your campaign overview." />
      <div style={{ padding: '28px 36px' }}>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>
        ) : (
          <>
            <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
              <StatCard label="Total Sent"    value={stats?.sent    ?? 0} color="var(--green)"  sub="Real sends only" />
              <StatCard label="Failed"        value={stats?.failed  ?? 0} color="var(--red)"    sub="Check your logs" />
              <StatCard label="Skipped"       value={stats?.skipped ?? 0} color="var(--amber)"  sub="Invalid emails" />
              <StatCard label="Total Emails"  value={stats?.total   ?? 0} color="var(--ink)"    sub="All time" />
            </div>

            <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              <Card style={{ padding: '20px 24px' }}>
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Quick Actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {quickLinks.map(({ to, icon: Icon, label, desc }) => (
                    <Link key={to} to={to} style={{
                      display: 'block', padding: '14px', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', transition: 'all .15s', background: 'var(--paper-2)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='var(--ink-3)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                      <Icon size={18} color="var(--accent)" style={{ marginBottom: 6 }} />
                      <p style={{ fontWeight: 500, fontSize: 13 }}>{label}</p>
                      <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{desc}</p>
                    </Link>
                  ))}
                </div>
              </Card>

              <Card style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16 }}>Recent Activity</h3>
                  <Link to="/analytics" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
                {logs.length === 0 ? (
                  <p style={{ color: 'var(--ink-3)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No emails sent yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {logs.map(log => (
                      <div key={log.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 0', borderBottom: '1px solid var(--paper-3)'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.name || log.email}</p>
                          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>{log.company}</p>
                        </div>
                        <StatusBadge status={log.status} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
