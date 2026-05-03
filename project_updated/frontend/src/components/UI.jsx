import { useState, useRef } from 'react'
import { Upload, X, FileText, Check, AlertCircle, Clock } from 'lucide-react'

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      padding: '32px 36px 24px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
    }}>
      <div>
        <h1 style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1.1 }}>{title}</h1>
        {subtitle && <p style={{ color: 'var(--ink-3)', marginTop: 6, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', ...style
    }}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, color = 'var(--ink)', icon, sub }) {
  return (
    <Card style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 36, fontFamily: 'DM Serif Display', color, marginTop: 4, lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</p>}
        </div>
        {icon && <div style={{ color, opacity: .15, marginTop: 2 }}>{icon}</div>}
      </div>
    </Card>
  )
}

export function Btn({ children, onClick, variant = 'default', disabled, loading, style = {}, type = 'button' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
    borderRadius: 'var(--radius-sm)', fontWeight: 500, fontSize: 14, cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid', transition: 'all .15s', opacity: disabled ? .45 : 1, ...style
  }
  const variants = {
    default: { background: 'var(--paper-2)', color: 'var(--ink)', borderColor: 'var(--border)' },
    primary: { background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' },
    accent:  { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' },
    ghost:   { background: 'transparent', color: 'var(--ink-2)', borderColor: 'transparent' },
    danger:  { background: 'var(--red-bg)', color: 'var(--red)', borderColor: 'transparent' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} style={{ ...base, ...variants[variant] }}>
      {loading && <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />}
      {children}
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 5 }}>{label}</label>}
      {children}
      {hint && <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

export function Input({ style = {}, ...props }) {
  return (
    <input style={{
      width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', background: 'var(--paper)', color: 'var(--ink)',
      outline: 'none', transition: 'border .15s', fontSize: 14, ...style
    }}
    onFocus={e => e.target.style.borderColor = 'var(--ink-3)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
    {...props} />
  )
}

export function Textarea({ style = {}, ...props }) {
  return (
    <textarea style={{
      width: '100%', padding: '10px 12px', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', background: 'var(--paper)', color: 'var(--ink)',
      outline: 'none', transition: 'border .15s', fontSize: 14, resize: 'vertical',
      fontFamily: 'DM Sans, sans-serif', lineHeight: 1.65, ...style
    }}
    onFocus={e => e.target.style.borderColor = 'var(--ink-3)'}
    onBlur={e => e.target.style.borderColor = 'var(--border)'}
    {...props} />
  )
}

export function DropZone({ label, hint, accept, onFile, file, onClear }) {
  const [over, setOver] = useState(false)
  const ref = useRef()

  function handleDrop(e) {
    e.preventDefault(); setOver(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return file ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
      background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)'
    }}>
      <FileText size={16} color='var(--accent)' />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{file}</span>
      <button onClick={onClear} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)',
        display: 'flex', alignItems: 'center', padding: 2
      }}><X size={15} /></button>
    </div>
  ) : (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => ref.current.click()}
      style={{
        border: `1.5px dashed ${over ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)', padding: '28px 20px', textAlign: 'center',
        cursor: 'pointer', transition: 'all .15s',
        background: over ? 'var(--accent-bg)' : 'var(--paper-2)'
      }}>
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
      <Upload size={22} color={over ? 'var(--accent)' : 'var(--ink-3)'} style={{ margin: '0 auto 8px' }} />
      <p style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>{label}</p>
      {hint && <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{hint}</p>}
    </div>
  )
}

export function Badge({ children, color = 'default' }) {
  const colors = {
    default: { bg: 'var(--paper-3)', tx: 'var(--ink-2)' },
    green:   { bg: 'var(--green-bg)', tx: 'var(--green)' },
    red:     { bg: 'var(--red-bg)', tx: 'var(--red)' },
    amber:   { bg: 'var(--amber-bg)', tx: 'var(--amber)' },
    blue:    { bg: 'var(--blue-bg)', tx: 'var(--blue)' },
    accent:  { bg: 'var(--accent-bg)', tx: 'var(--accent)' },
  }
  const c = colors[color] || colors.default
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      background: c.bg, color: c.tx
    }}>{children}</span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    sent:    { color: 'green', icon: <Check size={11} />, label: 'Sent' },
    failed:  { color: 'red',   icon: <AlertCircle size={11} />, label: 'Failed' },
    skipped: { color: 'amber', icon: <AlertCircle size={11} />, label: 'Skipped' },
    scheduled:{ color: 'blue', icon: <Clock size={11} />, label: 'Scheduled' },
  }
  const m = map[status] || { color: 'default', icon: null, label: status }
  return <Badge color={m.color}>{m.icon}{m.label}</Badge>
}

export function Spinner() {
  return <span style={{
    display: 'inline-block', width: 18, height: 18,
    border: '2px solid var(--border)', borderTopColor: 'var(--ink)',
    borderRadius: '50%', animation: 'spin .7s linear infinite'
  }} />
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 40, height: 22, borderRadius: 11, position: 'relative',
        background: checked ? 'var(--ink)' : 'var(--border)', transition: 'background .2s'
      }}>
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)'
        }} />
      </div>
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{label}</span>
    </label>
  )
}
