import { useState, useEffect } from 'react'
import axios from 'axios'
import { Clock, Calendar, Users, Trash2 } from 'lucide-react'
import { PageHeader, Card, Btn, Field, Input, Textarea, DropZone, Spinner } from '../components/UI.jsx'

export default function Schedule() {
  const [scheduled, setScheduled] = useState([])
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [senderName,  setSenderName]  = useState('Chanchal Mahor')
  const [senderEmail, setSenderEmail] = useState('chanchal01232@gmail.com')
  const [smtpPass,    setSmtpPass]    = useState('')
  const [subject,     setSubject]     = useState('')
  const [body,        setBody]        = useState('')
  const [campaignName,setCampaignName]= useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [contacts,    setContacts]    = useState([])
  const [csvName,     setCsvName]     = useState('')
  const [resumeB64,   setResumeB64]   = useState('')
  const [resumeName,  setResumeName]  = useState('')
  const [resumeFile,  setResumeFile]  = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await axios.get('/api/emails/scheduled')
    setScheduled(r.data)
    setLoading(false)
  }

  function handleCSV(file) {
    setCsvName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target.result
      const lines = text.trim().split(/\r?\n/)
      const headers = lines[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase())
      const parsed = lines.slice(1).map(l => {
        const vals = l.match(/(".*?"|[^,]+)/g) || l.split(',')
        const obj = {}
        headers.forEach((h, i) => obj[h] = (vals[i]||'').replace(/"/g,'').trim())
        return obj
      }).filter(c => c.email)
      setContacts(parsed)
    }
    reader.readAsText(file)
  }

  function handleResume(file) {
    setResumeName(file.name)
    const reader = new FileReader()
    reader.onload = e => setResumeB64(e.target.result.split(',')[1])
    reader.readAsDataURL(file)
    setResumeFile(file.name)
  }

  async function schedule() {
    if (!campaignName || !scheduledAt || contacts.length === 0 || !subject || !body) {
      alert('Please fill all fields and upload contacts CSV.')
      return
    }
    setSubmitting(true)
    try {
      await axios.post('/api/emails/schedule', {
        campaignName, senderName, senderEmail, smtpPassword: smtpPass,
        subject, body, contacts, resumeBase64: resumeB64, resumeName,
        delay: 3, dryRun: false, scheduledAt
      })
      alert('Campaign scheduled!')
      setCampaignName(''); setScheduledAt(''); setContacts([]); setCsvName('')
      await load()
    } catch (e) {
      alert('Failed: ' + (e.response?.data?.error || e.message))
    }
    setSubmitting(false)
  }

  return (
    <div>
      <PageHeader title="Schedule" subtitle="Queue campaigns to send at a specific time." />
      <div style={{ padding: '28px 36px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>

        <Card style={{ padding: 28 }} className="fade-up">
          <h3 style={{ fontSize: 17, marginBottom: 20 }}>New Scheduled Campaign</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Campaign name"><Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Q2 Outreach" /></Field>
            <Field label="Send at"><Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></Field>
            <Field label="Sender name"><Input value={senderName} onChange={e => setSenderName(e.target.value)} /></Field>
            <Field label="Gmail address"><Input type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} /></Field>
          </div>

          <Field label="Gmail App Password"><Input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="xxxx xxxx xxxx xxxx" /></Field>
          <Field label="Subject"><Input value={subject} onChange={e => setSubject(e.target.value)} /></Field>
          <Field label="Body"><Textarea value={body} onChange={e => setBody(e.target.value)} style={{ minHeight: 140 }} placeholder="Use {name} and {company} as merge fields" /></Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Contacts CSV">
              <DropZone label="Drop contacts.csv" hint=".csv file" accept=".csv"
                onFile={handleCSV} file={csvName} onClear={() => { setContacts([]); setCsvName('') }} />
              {contacts.length > 0 && <p style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>✓ {contacts.length} contacts</p>}
            </Field>
            <Field label="Resume PDF (optional)">
              <DropZone label="Drop resume PDF" hint=".pdf file" accept=".pdf"
                onFile={handleResume} file={resumeFile} onClear={() => { setResumeFile(null); setResumeB64('') }} />
            </Field>
          </div>

          <Btn variant="primary" onClick={schedule} loading={submitting} style={{ marginTop: 8 }}>
            <Calendar size={14} /> Schedule Campaign
          </Btn>
        </Card>

        <div className="fade-up-1">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>Pending Campaigns</h3>
          {loading ? <Spinner /> : scheduled.length === 0 ? (
            <Card style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>
              <Clock size={28} style={{ margin: '0 auto 10px', opacity: .4 }} />
              <p style={{ fontSize: 14 }}>No scheduled campaigns</p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {scheduled.map(s => (
                <Card key={s.id} style={{ padding: '16px 20px' }}>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</p>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)' }}>
                      <Calendar size={12} /> {new Date(s.scheduledAt).toLocaleString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--ink-3)' }}>
                      <Users size={12} /> {s.contactCount} contacts
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
