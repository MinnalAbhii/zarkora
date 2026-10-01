import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../store'
import { Button } from '../ui'

export const Splash = () => <div className="ctr">
  <motion.h1 className="logo" initial={{ opacity: 0, letterSpacing: '.4em', filter: 'blur(12px)' }} animate={{ opacity: 1, letterSpacing: '.22em', filter: 'blur(0px)' }} transition={{ duration: 1.3 }}>ZARKORA</motion.h1>
  <motion.p className="tag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: .6 }}>ONE CLASS. ONE JOURNEY.</motion.p>
  <motion.small className="dim" style={{ marginTop: 22, letterSpacing: '.3em' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>2026 — 2031</motion.small>
</div>

export function Login() {
  const { A, s } = useApp()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const ok = await A.login(u, p)
    if (!ok) setErr('Incorrect username or password.')
    setBusy(false)
  }

  return <form className="ctr" onSubmit={submit} style={{ padding: '24px 28px' }}>
    <h1 className="logo">ZARKORA</h1>
    <p className="tag" style={{ marginBottom: 44 }}>One Class. One Journey.</p>
    <div style={{ width: '100%', textAlign: 'left' }}>
      <input placeholder="Username" autoCapitalize="none" autoComplete="username" value={u}
        onChange={e => { setU(e.target.value); setErr('') }} />
      <input type="password" placeholder="Password" autoComplete="current-password" value={p}
        onChange={e => { setP(e.target.value); setErr('') }} />
      {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ color: '#e59090', fontSize: 13, margin: '0 0 10px' }}>{err}</motion.p>}
      <Button type="submit" disabled={busy}>{busy ? 'SIGNING IN…' : 'ENTER ZARKORA'}</Button>
      {s.error && <p className="dim tiny" style={{ marginTop: 10 }}>{s.error}</p>}
    </div>
    <p className="tag" style={{ marginTop: 28, fontSize: 11 }}>31 JULY 2031</p>
    <p className="dim tiny" style={{ marginTop: 18 }}>Private class app · secure Supabase login</p>
  </form>
}
