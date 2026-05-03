import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { PageHeader, Card, StatCard, Spinner } from '../components/UI.jsx'
import { TrendingUp } from 'lucide-react'

const PIE_COLORS = ['#2d7d4f', '#b83232', '#96620a']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      <p style={{ fontWeight: 500 }}>{label}</p>
      <p style={{ color: 'var(--accent)' }}>{payload[0].value} emails</p>
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get('/api/analytics/summary').then(r => setStats(r.data)),
      axios.get('/api/emails/logs').then(r => setLogs(r.data))
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div>
      <PageHeader title="Analytics" subtitle="Track your campaign performance." />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner /></div>
    </div>
  )

  const rate = stats?.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0

  const pieData = [
    { name: 'Sent',    value: stats?.sent    || 0 },
    { name: 'Failed',  value: stats?.failed  || 0 },
    { name: 'Skipped', value: stats?.skipped || 0 },
  ].filter(d => d.value > 0)

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Track your campaign performance." />
      <div style={{ padding: '28px 36px' }}>

        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="Total Sent"    value={stats?.sent    ?? 0} color="var(--green)" />
          <StatCard label="Failed"        value={stats?.failed  ?? 0} color="var(--red)" />
          <StatCard label="Skipped"       value={stats?.skipped ?? 0} color="var(--amber)" />
          <StatCard label="Success Rate"  value={`${rate}%`} color={rate > 70 ? 'var(--green)' : 'var(--amber)'} sub="Sent / Total" />
        </div>

        <div className="fade-up-1" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          <Card style={{ padding: '24px 28px' }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Emails sent — last 7 days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.daily || []} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--paper-3)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="var(--ink)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card style={{ padding: '24px 28px' }}>
            <h3 style={{ fontSize: 16, marginBottom: 20 }}>Status breakdown</h3>
            {pieData.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--ink-3)', fontSize: 14 }}>No data yet</div>
            ) : (
              <>
                <PieChart width={200} height={160} style={{ margin: '0 auto' }}>
                  <Pie data={pieData} cx={95} cy={75} innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                  {pieData.map((d, i) => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--ink-2)' }}>{d.name}</span>
                      <span style={{ fontWeight: 500 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>

        {stats?.topCompanies?.length > 0 && (
          <Card className="fade-up-2" style={{ padding: '24px 28px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Top companies reached</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.topCompanies.map((c, i) => {
                const max = stats.topCompanies[0].count
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 140, fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</span>
                    <div style={{ flex: 1, height: 8, background: 'var(--paper-3)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(c.count / max) * 100}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, width: 24, textAlign: 'right' }}>{c.count}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        <Card className="fade-up-3" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16 }}>All email logs</h3>
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <p style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>No logs yet. Send your first campaign!</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: 'var(--paper-2)', position: 'sticky', top: 0 }}>
                    {['Name','Email','Company','Status','Date'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid var(--paper-3)' }}>
                      <td style={{ padding: '8px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.name}</td>
                      <td style={{ padding: '8px 14px', color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.email}</td>
                      <td style={{ padding: '8px 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.company}</td>
                      <td style={{ padding: '8px 14px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                          background: l.status==='sent' ? 'var(--green-bg)' : l.status==='failed' ? 'var(--red-bg)' : 'var(--amber-bg)',
                          color: l.status==='sent' ? 'var(--green)' : l.status==='failed' ? 'var(--red)' : 'var(--amber)'
                        }}>{l.status}</span>
                        {l.dryRun && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--ink-3)' }}>dry</span>}
                      </td>
                      <td style={{ padding: '8px 14px', color: 'var(--ink-3)', fontSize: 12 }}>{new Date(l.sentAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
