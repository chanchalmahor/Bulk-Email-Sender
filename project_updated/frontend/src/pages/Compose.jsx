import { useState, useRef } from 'react'
import axios from 'axios'
import { Sparkles, Send, CheckCircle, ChevronRight, ChevronLeft, PenLine } from 'lucide-react'
import { PageHeader, Card, Btn, Field, Input, Textarea, DropZone, Toggle, StatusBadge, Spinner } from '../components/UI.jsx'

const STEPS = ['Setup', 'Compose', 'Contacts', 'Send']

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600,
              background: i < current ? 'var(--green)' : i === current ? 'var(--ink)' : 'var(--paper-3)',
              color: i <= current ? '#fff' : 'var(--ink-3)'
            }}>
              {i < current ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: i === current ? 500 : 400, color: i === current ? 'var(--ink)' : 'var(--ink-3)' }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: i < current ? 'var(--green)' : 'var(--border)', margin: '0 12px' }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function Compose() {
  const [step, setStep] = useState(0)

  // Setup
  const [senderName,  setSenderName]  = useState('Chanchal Mahor')
  const [senderEmail, setSenderEmail] = useState('chanchal01232@gmail.com')
  const [smtpPass,    setSmtpPass]    = useState('')
  const [delay,       setDelay]       = useState(3)
  const [maxEmails,   setMaxEmails]   = useState('')
  const [resumeFile,  setResumeFile]  = useState(null)
  const [resumeName,  setResumeName]  = useState('')
  const [resumeB64,   setResumeB64]   = useState('')

  // Compose
  const [subject, setSubject] = useState('Application for Data Analyst Role | Chanchal Mahor')
  const [body, setBody]       = useState(`Dear {name},\n\nI hope this email finds you well. I am writing to apply for the Data Analyst position at {company}.\n\nI am a final-year B.Tech CSE student (graduating 2026) with hands-on experience in SQL, Python, Excel, and Power BI. I have built dashboards, performed data cleaning, and extracted actionable insights across multiple projects.\n\nPlease find my resume attached. I would welcome the chance to discuss how I can contribute to your team at {company}.\n\nThank you for your time.\n\nWarm regards,\nChanchal Mahor\n📧 chanchal01232@gmail.com | 📞 +91-7302194314`)

  // AI — structured
  const [aiLoading, setAiLoading] = useState(false)
  const [aiRole,    setAiRole]    = useState('Data Analyst')
  const [aiSkills,  setAiSkills]  = useState('SQL, Python, Power BI, Excel, data visualization')
  const [aiTone,    setAiTone]    = useState('professional')
  const [showAI,    setShowAI]    = useState(false)

  // AI — custom prompt
  const [customPrompt,  setCustomPrompt]  = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [showPrompt,    setShowPrompt]    = useState(false)

  // Contacts
  const [contacts, setContacts] = useState([])
  const [csvName,  setCsvName]  = useState('')

  // Send
  const [dryRun,  setDryRun]  = useState(true)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState([])
  const [summary, setSummary] = useState(null)
  const [logs,    setLogs]    = useState([])

  function addLog(msg, type = 'info') {
    setLogs(prev => [...prev, { msg, type, t: new Date().toLocaleTimeString() }])
  }

  function handleResume(file) {
    setResumeName(file.name)
    const reader = new FileReader()
    reader.onload = e => setResumeB64(e.target.result.split(',')[1])
    reader.readAsDataURL(file)
    setResumeFile(file.name)
  }

  function handleCSV(file) {
    setCsvName(file.name)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target.result
      const lines = text.trim().split(/\r?\n/)
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase())
      const parsed = lines.slice(1).map(l => {
        const vals = l.match(/(".*?"|[^,]+)/g) || l.split(',')
        const obj = {}
        headers.forEach((h, i) => obj[h] = (vals[i] || '').replace(/"/g, '').trim())
        return obj
      }).filter(c => c.email && c.email.includes('@'))
      setContacts(parsed)
      addLog(`Loaded ${parsed.length} contacts from ${file.name}`, 'info')
    }
    reader.readAsText(file)
  }

  async function generateAI() {
    setAiLoading(true)
    try {
      const r = await axios.post('/api/ai/generate', { role: aiRole, skills: aiSkills, tone: aiTone, extra: '' })
      if (r.data.body) setBody(r.data.body)
      else alert(r.data.error || 'AI generation failed')
    } catch { alert('Could not reach AI service. Check GEMINI_API_KEY.') }
    finally { setAiLoading(false) }
  }

  async function generateFromPrompt() {
    if (!customPrompt.trim()) return
    setPromptLoading(true)
    try {
      const r = await axios.post('/api/ai/prompt', { prompt: customPrompt })
      if (r.data.body) {
        setBody(r.data.body)
        setShowPrompt(false)
      } else alert(r.data.error || 'Generation failed')
    } catch { alert('Could not reach AI service. Check GEMINI_API_KEY.') }
    finally { setPromptLoading(false) }
  }

  async function startSend() {
    setSending(true)
    setResults([])
    setSummary(null)
    setLogs([])
    addLog(`${dryRun ? '[DRY RUN] ' : ''}Starting — ${contacts.length} contacts…`, 'info')
    try {
      const r = await axios.post('/api/emails/send', {
        senderName, senderEmail, smtpPassword: smtpPass,
        subject, body, contacts,
        resumeBase64: resumeB64, resumeName,
        delay: Number(delay), maxEmails: maxEmails ? Number(maxEmails) : null,
        dryRun
      })
      const { summary: s, results: res } = r.data
      setSummary(s)
      setResults(res)
      res.forEach(r => addLog(
        `${r.status === 'sent' ? '✓' : '✗'} ${r.name} <${r.email}> — ${r.status}${r.error ? ': ' + r.error : ''}`,
        r.status === 'sent' ? 'ok' : r.status === 'failed' ? 'err' : 'warn'
      ))
      addLog(`Done. Sent:${s.sent} Failed:${s.failed} Skipped:${s.skipped}`, 'info')
    } catch (e) {
      addLog('Error: ' + (e.response?.data?.error || e.message), 'err')
    }
    setSending(false)
  }

  return (
    <div>
      <PageHeader title="Send Emails" subtitle="Configure and launch your email campaign." />
      <div style={{ padding: '28px 36px' }}>
        <StepBar current={step} />

        {/* ── STEP 0: SETUP ───────────────────────────────── */}
        {step === 0 && (
          <Card style={{ padding: 28 }} className="fade-up">
            <h3 style={{ fontSize: 17, marginBottom: 20 }}>Sender Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Your name"><Input value={senderName} onChange={e => setSenderName(e.target.value)} /></Field>
              <Field label="Gmail address"><Input type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} /></Field>
            </div>
            <Field label="Gmail App Password" hint="Get it at myaccount.google.com/apppasswords — 2FA must be on">
              <Input type="password" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} placeholder="xxxx xxxx xxxx xxxx" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Delay between emails (sec)"><Input type="number" value={delay} onChange={e => setDelay(e.target.value)} min={1} max={60} /></Field>
              <Field label="Max emails per run"><Input type="number" value={maxEmails} onChange={e => setMaxEmails(e.target.value)} placeholder="All" /></Field>
            </div>
            <Field label="Resume PDF" hint="Will be attached to every email">
              <DropZone label="Drop your resume PDF" hint="or click to browse" accept=".pdf" onFile={handleResume} file={resumeFile} onClear={() => { setResumeFile(null); setResumeB64('') }} />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Btn variant="primary" onClick={() => setStep(1)}>Next: Compose <ChevronRight size={15} /></Btn>
            </div>
          </Card>
        )}

        {/* ── STEP 1: COMPOSE ─────────────────────────────── */}
        {step === 1 && (
          <Card style={{ padding: 28 }} className="fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17 }}>Email Content</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="default" onClick={() => { setShowPrompt(!showPrompt); setShowAI(false) }}>
                  <PenLine size={14} /> {showPrompt ? 'Hide Prompt' : 'Write Prompt'}
                </Btn>
                <Btn variant="accent" onClick={() => { setShowAI(!showAI); setShowPrompt(false) }}>
                  <Sparkles size={14} /> {showAI ? 'Hide AI' : 'Generate with AI'}
                </Btn>
              </div>
            </div>

            {/* ── Structured AI panel ── */}
            {showAI && (
              <div style={{
                background: 'var(--accent-bg)', border: '1px solid var(--accent-2)',
                borderRadius: 'var(--radius-sm)', padding: 20, marginBottom: 20
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent)', marginBottom: 12 }}>✦ AI Email Generator</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Field label="Role"><Input value={aiRole} onChange={e => setAiRole(e.target.value)} placeholder="Data Analyst" /></Field>
                  <Field label="Key Skills"><Input value={aiSkills} onChange={e => setAiSkills(e.target.value)} /></Field>
                  <Field label="Tone">
                    <select value={aiTone} onChange={e => setAiTone(e.target.value)} style={{
                      width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', background: 'var(--paper)', fontSize: 14
                    }}>
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="concise">Concise</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </Field>
                </div>
                <Btn variant="accent" onClick={generateAI} loading={aiLoading} disabled={aiLoading}>
                  {!aiLoading && <Sparkles size={13} />} Generate email body
                </Btn>
              </div>
            )}

            {/* ── Custom prompt panel ── */}
            {showPrompt && (
              <div style={{
                background: 'var(--blue-bg)', border: '1px solid #b3d1f5',
                borderRadius: 'var(--radius-sm)', padding: 20, marginBottom: 20
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue)', marginBottom: 4 }}>
                  ✦ Write your own prompt
                </p>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12 }}>
                  Describe exactly what email you want — AI will generate it and fill the body below.
                </p>
                <Field label="Your prompt">
                  <Textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder={`e.g. Write a short friendly email applying for a Data Analyst role at a startup. I am a fresher with Python and SQL skills. Mention I am open to internships too. Keep it under 150 words.`}
                    style={{ minHeight: 100 }}
                  />
                </Field>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Btn
                    variant="primary"
                    onClick={generateFromPrompt}
                    loading={promptLoading}
                    disabled={promptLoading || !customPrompt.trim()}
                  >
                    <PenLine size={13} /> Generate from my prompt
                  </Btn>
                  {promptLoading && (
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>AI is writing your email…</span>
                  )}
                </div>
              </div>
            )}

            <Field label="Subject line">
              <Input value={subject} onChange={e => setSubject(e.target.value)} />
            </Field>
            <Field label="Body — use {name} and {company} as merge fields" hint="These are replaced per contact when sending">
              <Textarea value={body} onChange={e => setBody(e.target.value)} style={{ minHeight: 260 }} />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Btn onClick={() => setStep(0)}><ChevronLeft size={15} /> Back</Btn>
              <Btn variant="primary" onClick={() => setStep(2)}>Next: Contacts <ChevronRight size={15} /></Btn>
            </div>
          </Card>
        )}

        {/* ── STEP 2: CONTACTS ────────────────────────────── */}
        {step === 2 && (
          <Card style={{ padding: 28 }} className="fade-up">
            <h3 style={{ fontSize: 17, marginBottom: 8 }}>Upload Contacts</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>
              CSV must have columns:{' '}
              <code style={{ background: 'var(--paper-3)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>name</code>,{' '}
              <code style={{ background: 'var(--paper-3)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>email</code>,{' '}
              <code style={{ background: 'var(--paper-3)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>company</code>
            </p>
            <DropZone label="Drop contacts.csv here" hint="or click to browse" accept=".csv"
              onFile={handleCSV} file={csvName} onClear={() => { setContacts([]); setCsvName('') }} />

            {contacts.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 10 }}>{contacts.length} contacts loaded</p>
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ background: 'var(--paper-2)' }}>
                        {['Name', 'Email', 'Company'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--paper-3)' }}>
                          <td style={{ padding: '7px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                          <td style={{ padding: '7px 12px', color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</td>
                          <td style={{ padding: '7px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <Btn onClick={() => setStep(1)}><ChevronLeft size={15} /> Back</Btn>
              <Btn variant="primary" onClick={() => setStep(3)} disabled={contacts.length === 0}>
                Next: Send <ChevronRight size={15} />
              </Btn>
            </div>
          </Card>
        )}

        {/* ── STEP 3: SEND ────────────────────────────────── */}
        {step === 3 && (
          <div className="fade-up">
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Total',   val: summary.total,   color: 'var(--ink)' },
                  { label: 'Sent',    val: summary.sent,    color: 'var(--green)' },
                  { label: 'Failed',  val: summary.failed,  color: 'var(--red)' },
                  { label: 'Skipped', val: summary.skipped, color: 'var(--amber)' },
                ].map(s => (
                  <Card key={s.label} style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.label}</p>
                    <p style={{ fontSize: 32, fontFamily: 'DM Serif Display', color: s.color, marginTop: 4 }}>{s.val}</p>
                  </Card>
                ))}
              </div>
            )}

            <Card style={{ padding: 28, marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, marginBottom: 16 }}>Launch Campaign</h3>
              <div style={{ marginBottom: 20 }}>
                <Toggle checked={dryRun} onChange={setDryRun} label="Dry run — simulate only, no real emails sent" />
              </div>

              <div style={{
                background: 'var(--paper-2)', borderRadius: 'var(--radius-sm)',
                padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12, maxHeight: 180, overflowY: 'auto', marginBottom: 16
              }}>
                {logs.length === 0
                  ? <span style={{ color: 'var(--ink-3)' }}>Logs will appear here…</span>
                  : logs.map((l, i) => (
                    <div key={i} style={{ padding: '1px 0', color: l.type === 'ok' ? 'var(--green)' : l.type === 'err' ? 'var(--red)' : l.type === 'warn' ? 'var(--amber)' : 'var(--ink-3)' }}>
                      <span style={{ color: 'var(--ink-3)' }}>[{l.t}]</span> {l.msg}
                    </div>
                  ))
                }
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Btn onClick={() => setStep(2)}><ChevronLeft size={15} /> Back</Btn>
                <Btn variant={dryRun ? 'default' : 'accent'} onClick={startSend} loading={sending} disabled={sending}>
                  <Send size={14} /> {dryRun ? 'Run dry simulation' : 'Send emails now'}
                </Btn>
              </div>
            </Card>

            {results.length > 0 && (
              <Card style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 15 }}>Results</h3>
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ background: 'var(--paper-2)' }}>
                        {['Name', 'Email', 'Company', 'Status'].map(h => (
                          <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-3)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--paper-3)' }}>
                          <td style={{ padding: '8px 14px' }}>{r.name}</td>
                          <td style={{ padding: '8px 14px', color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</td>
                          <td style={{ padding: '8px 14px' }}>{r.company}</td>
                          <td style={{ padding: '8px 14px' }}><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}