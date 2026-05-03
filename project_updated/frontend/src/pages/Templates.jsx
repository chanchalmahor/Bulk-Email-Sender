import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, FileText, Tag } from 'lucide-react'
import { PageHeader, Card, Btn, Field, Input, Textarea, Badge, Spinner } from '../components/UI.jsx'

const TAGS = ['general', 'data-analyst', 'software', 'marketing', 'finance', 'hr']
const TAG_COLORS = { general: 'default', 'data-analyst': 'accent', software: 'blue', marketing: 'green', finance: 'amber', hr: 'red' }

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [selected, setSelected]   = useState(null)
  const [title, setTitle]         = useState('')
  const [subject, setSubject]     = useState('')
  const [body, setBody]           = useState('')
  const [tag, setTag]             = useState('general')
  const [saving, setSaving]       = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await axios.get('/api/templates/')
    setTemplates(r.data)
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    await axios.post('/api/templates/', { title, subject, body, tag })
    setShowForm(false); setTitle(''); setSubject(''); setBody(''); setTag('general')
    await load()
    setSaving(false)
  }

  async function del(id) {
    if (!confirm('Delete this template?')) return
    await axios.delete(`/api/templates/${id}`)
    if (selected?.id === id) setSelected(null)
    await load()
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        subtitle="Save and reuse your best email formats."
        action={<Btn variant="primary" onClick={() => setShowForm(true)}><Plus size={15} /> New Template</Btn>}
      />
      <div style={{ padding: '28px 36px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

        {/* left: list */}
        <div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><Spinner /></div>
          : templates.length === 0 ? (
            <Card style={{ padding: 32, textAlign: 'center' }}>
              <FileText size={28} color="var(--ink-3)" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>No templates yet</p>
              <Btn variant="primary" style={{ marginTop: 14 }} onClick={() => setShowForm(true)}>Create first template</Btn>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templates.map(t => (
                <div key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    padding: '14px 16px', borderRadius: 'var(--radius)', cursor: 'pointer',
                    background: selected?.id === t.id ? 'var(--ink)' : '#fff',
                    color: selected?.id === t.id ? '#fff' : 'var(--ink)',
                    border: `1px solid ${selected?.id === t.id ? 'var(--ink)' : 'var(--border)'}`,
                    transition: 'all .15s'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{t.title}</p>
                    <button onClick={e => { e.stopPropagation(); del(t.id) }} style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                      color: selected?.id === t.id ? 'rgba(255,255,255,.5)' : 'var(--ink-3)',
                      opacity: .7
                    }}><Trash2 size={13} /></button>
                  </div>
                  <p style={{ fontSize: 12, marginTop: 4, opacity: .7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</p>
                  <div style={{ marginTop: 8 }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                      background: selected?.id === t.id ? 'rgba(255,255,255,.15)' : 'var(--paper-3)',
                      color: selected?.id === t.id ? '#fff' : 'var(--ink-3)'
                    }}>{t.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* right: preview or form */}
        <div>
          {showForm ? (
            <Card style={{ padding: 28 }} className="fade-up">
              <h3 style={{ fontSize: 17, marginBottom: 20 }}>New Template</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Template name"><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Data Analyst — Concise" /></Field>
                <Field label="Category">
                  <select value={tag} onChange={e => setTag(e.target.value)} style={{
                    width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', background: 'var(--paper)', fontSize: 14
                  }}>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Subject"><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Application for {role} | Your Name" /></Field>
              <Field label="Body"><Textarea value={body} onChange={e => setBody(e.target.value)} style={{ minHeight: 200 }} placeholder="Use {name} and {company} as merge fields" /></Field>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Btn onClick={() => setShowForm(false)}>Cancel</Btn>
                <Btn variant="primary" onClick={save} loading={saving} disabled={!title || !body}>Save template</Btn>
              </div>
            </Card>
          ) : selected ? (
            <Card style={{ padding: 28 }} className="fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 19 }}>{selected.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                    Created {new Date(selected.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge color={TAG_COLORS[selected.tag] || 'default'}><Tag size={11} /> {selected.tag}</Badge>
              </div>
              <div style={{ background: 'var(--paper-2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 2 }}>SUBJECT</p>
                <p style={{ fontSize: 14, fontWeight: 500 }}>{selected.subject}</p>
              </div>
              <div style={{ background: 'var(--paper-2)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>BODY</p>
                <pre style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'DM Sans, sans-serif', color: 'var(--ink-2)' }}>{selected.body}</pre>
              </div>
            </Card>
          ) : (
            <Card style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
              <FileText size={32} style={{ margin: '0 auto 12px', opacity: .4 }} />
              <p>Select a template to preview it</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
