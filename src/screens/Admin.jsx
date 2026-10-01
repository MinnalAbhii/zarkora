import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, LogOut } from 'lucide-react'
import { useApp } from '../store'
import { Glass, Button, Bar, Avatar, Pill, Modal, Stat } from '../ui'

const Sec = ({ t, children }) => <><div className="lbl" style={{ margin: '18px 0 10px' }}>{t}</div>{children}</>
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function useAct() {
  const [busy, setBusy] = useState(null), [err, setErr] = useState('')
  const run = async (key, fn) => {
    if (busy) return
    setBusy(key); setErr('')
    try { await fn() } catch (e) { setErr(e.message || 'Something went wrong.') } finally { setBusy(null) }
  }
  return [run, busy, err && <p style={{ color: '#e59090', fontSize: 13, margin: '8px 0' }}>{err}</p>]
}

function useUndo(run) {
  const { A } = useApp(), [id, setId] = useState(null)
  const dlg = <Modal open={!!id} onClose={() => setId(null)}>
    <h2 className="h1" style={{ fontSize: 28, margin: '0 0 8px' }}>Undo this payment?</h2>
    <p className="dim" style={{ marginBottom: 18 }}>This will change the payment back to Pending.</p>
    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="ghost" onClick={() => setId(null)}>CANCEL</Button>
      <Button onClick={() => { const x = id; setId(null); if (x) run('u' + x, () => A.undoPayment(x)) }}>YES, UNDO</Button>
    </div>
  </Modal>
  return [setId, dlg]
}

export function AdminDash({ go }) {
  const { s, A, st, MONTH, currentPayments } = useApp()
  const [run, busy, errEl] = useAct(), [ask, dlg] = useUndo(run)
  const nameOf = uid => s.members.find(m => String(m.id) === String(uid))?.name || 'Member'
  const pending = currentPayments.filter(p => p.status === 'pending')
  const paidNow = currentPayments.filter(p => p.status === 'paid')
  const unpaid = s.members.filter(m => !currentPayments.some(p => String(p.user_id) === String(m.id)))
  const Line = ({ p, pill, children }) => <motion.div layout className="row" style={{ flexWrap: 'wrap' }}>
    <Avatar name={nameOf(p.user_id)} size={34} />
    <div><b>{nameOf(p.user_id)}</b><div className="dim">{p.month} {p.year} · ₹{p.amount} · {p.method}</div></div>{pill}
    <div style={{ width: '100%' }}>{children}</div>
  </motion.div>

  return <>
    <h1 className="h1">Zarkora Control</h1>
    <Glass className="hero">
      <div className="lbl">{MONTH}</div>
      <div className="big" style={{ margin: '8px 0' }}>₹{st.collected} <span className="dim">/ ₹{st.goal}</span></div>
      <Bar v={st.pct} />
      <div className="stats"><Stat label="PAID" value={`${st.paid}/${st.total}`} /><Stat label="PENDING" value={st.pending} /></div>
    </Glass>

    <div style={{ display: 'flex', gap: 8 }}>
      <Button variant="ghost" onClick={() => go('admin-members')}>MEMBERS</Button>
      <Button variant="ghost" onClick={() => go('admin-fund')}>FUND</Button>
    </div>

    <Sec t="Payment Management">
      {errEl}
      <p className="dim" style={{ marginBottom: 4 }}>Pending verification · {pending.length}</p>
      <AnimatePresence initial={false}>
        {pending.map(p => <Line key={p.id} p={p} pill={<span className="pill wait">PENDING</span>}>
          <Button variant="sm" style={{ width: '100%' }} disabled={!!busy} onClick={() => run('v' + p.id, () => A.markPaid(p.id))}>
            {busy === 'v' + p.id ? 'VERIFYING…' : 'VERIFY & MARK PAID'}</Button>
        </Line>)}
      </AnimatePresence>
      {!pending.length && <p className="dim" style={{ marginBottom: 8 }}>No payments waiting for verification.</p>}
      <p className="dim" style={{ margin: '16px 0 4px' }}>Paid · {MONTH}</p>
      {paidNow.map(p => <Line key={p.id} p={p} pill={<span className="pill ok">✓ PAID</span>}>
        <Button variant="ghost sm" style={{ width: '100%' }} disabled={!!busy} onClick={() => ask(p.id)}>UNDO PAYMENT</Button>
      </Line>)}
    </Sec>

    <Sec t="Not Paid Yet">
      {unpaid.map(m => <motion.div layout key={m.id} className="row">
        <Avatar name={m.name} size={34} />
        <div><b>{m.name}</b><div className="dim">₹{s.target}</div></div>
        <Button variant="sm" disabled={!!busy} onClick={() => run('c' + m.id, () => A.markCashPaid(m.id))}>MARK CASH PAID</Button>
      </motion.div>)}
      {!unpaid.length && <p className="dim">Everyone has submitted. 🎉</p>}
    </Sec>

    <Button variant="ghost" style={{ marginTop: 20 }} onClick={A.logout}>
      <LogOut size={15} style={{ verticalAlign: -2 }} /> LOG OUT
    </Button>
    {dlg}
  </>
}

const blank = { name: '', username: '', birthday: '', password: '', status: 'pending' }

export function AdminMembers() {
  const { s, A } = useApp()
  const [f, setF] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const set = k => e => setF({ ...f, [k]: e.target.value })

  const save = async () => {
    if (!f?.name.trim() || !f?.username.trim() || (!f.id && !f.password.trim())) return
    setBusy(true)
    setErr('')
    try {
      if (f.id) {
        await A.editMember(f.id, {
          name: f.name.trim(),
          username: f.username.trim().toLowerCase(),
          birthday: f.birthday || null,
        })
        const cur = s.members.find(m => m.id === f.id)
        if (f.status === 'paid' && !cur?.verified) await A.markCashPaid(f.id)
        else if (f.status === 'pending' && cur?.verified) await A.undo(f.id)
      } else {
        const result = await A.addMember({
          name: f.name.trim(),
          username: f.username.trim().toLowerCase(),
          birthday: f.birthday || null,
          password: f.password,
        })
        if (f.status === 'paid' && result?.profile?.id) await A.markCashPaid(result.profile.id)
      }
      setF(null)
    } catch (e) {
      setErr(e.message || 'Could not save member.')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <h1 className="h1">Members</h1>
    <Button onClick={() => { setErr(''); setF(blank) }}>+ ADD MEMBER</Button>

    <div style={{ marginTop: 10 }}>
      {s.members.map(m => <div className="row" key={m.id} onClick={() => setF({
        ...m,
        birthday: m.birthday || '',
        status: m.verified ? 'paid' : 'pending',
        password: '',
      })}>
        <Avatar name={m.name} size={36} />
        <div><b>{m.name}</b><div className="dim">@{m.username} · {fmtDate(m.birthday)}</div></div>
        <Pill m={m} />
      </div>)}
    </div>

    <Modal open={!!f} onClose={() => !busy && setF(null)}>
      {f && <>
        <div className="lbl" style={{ marginBottom: 12 }}>{f.id ? 'Edit member' : 'Add member'}</div>
        <input placeholder="Full name" value={f.name} onChange={set('name')} />
        <input placeholder="Username" autoCapitalize="none" value={f.username} onChange={set('username')} />
        <input type="date" value={f.birthday || ''} onChange={set('birthday')} />
        {!f.id && <input type="password" placeholder="Initial password" value={f.password} onChange={set('password')} />}
        <select value={f.status} onChange={set('status')}>
          <option value="pending">Pending</option>
          <option value="paid">Paid (cash)</option>
        </select>
        {err && <p style={{ color: '#e59090', fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <Button disabled={busy} onClick={save}>{busy ? 'SAVING…' : 'SAVE'}</Button>
      </>}
    </Modal>
  </>
}

export function AdminFund() {
  const { s, A, st, currentPayments } = useApp()
  const [run, busy, errEl] = useAct(), [ask, dlg] = useUndo(run), [last, setLast] = useState(null)
  const [a, setA] = useState('')
  const [u, setU] = useState('')
  const [l, setL] = useState('')
  const [amt, setAmt] = useState('')
  const [ann, setAnn] = useState(s.announcement)

  const pend = s.members.filter(m => !currentPayments.some(p => String(p.user_id) === String(m.id)))
  const paid = s.members.filter(m => currentPayments.some(p => String(p.user_id) === String(m.id) && p.status === 'paid'))
  const unv = s.members.filter(m => currentPayments.some(p => String(p.user_id) === String(m.id) && p.status === 'pending'))

  return <>
    <h1 className="h1">Fund Control</h1>
    {errEl}

    <Glass>
      <div className="lbl">Monthly target per member (₹)</div>
      <input type="number" inputMode="numeric" value={s.target}
        onChange={e => A.setTarget(e.target.value)} style={{ marginTop: 10 }} />
      <p className="dim">Goal ₹{st.goal} · Balance ₹{st.balance}</p>
    </Glass>

    <Glass>
      <div className="lbl">Cash payment</div>
      <select value={a || pend[0]?.id || ''} onChange={e => setA(e.target.value)}>
        {pend.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <Button disabled={!pend.length || !!busy} onClick={() => { const m = pend.find(x => String(x.id) === String(a)) || pend[0]; run('cash', async () => { await A.markCashPaid(m.id); setLast(m.id); setA('') }) }}>ADD CASH PAYMENT</Button>
      {last && (() => { const p = currentPayments.find(x => String(x.user_id) === String(last) && x.status === 'paid'); return p && <div className="row"><div>✓ {s.members.find(m => String(m.id) === String(last))?.name} marked paid</div><Button variant="ghost sm" onClick={() => ask(p.id)}>UNDO PAYMENT</Button></div> })()}

      <div className="lbl" style={{ margin: '16px 0 10px' }}>Undo payment</div>
      <select value={u || paid[0]?.id || ''} onChange={e => setU(e.target.value)}>
        {paid.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <Button variant="ghost" disabled={!paid.length} onClick={() => { const m = paid.find(x => String(x.id) === String(u)) || paid[0]; ask(currentPayments.find(p => String(p.user_id) === String(m.id) && p.status === 'paid')?.id); setU('') }}>UNDO PAYMENT</Button>
    </Glass>

    <Glass>
      <div className="lbl">Verify payments ({unv.length})</div>
      {unv.map(m => <div className="row" key={m.id}><div><b>{m.name}</b></div><Button variant="sm" disabled={!!busy} onClick={() => run('v' + m.id, () => A.verify(m.id))}>VERIFY & MARK PAID</Button></div>)}
      {!unv.length && <p className="dim" style={{ marginTop: 8 }}>Nothing to verify.</p>}
    </Glass>

    <Glass>
      <div className="lbl">Expenses · ₹{st.spent}</div>
      {s.expenses.map(e => <div className="row" key={e.id}>
        <div>{e.title}</div><b>₹{e.amount}</b>
        <Trash2 size={18} color="#e59090" onClick={() => A.delExpense(e.id)} />
      </div>)}
      <input placeholder="Expense title" value={l} onChange={e => setL(e.target.value)} style={{ marginTop: 12 }} />
      <input placeholder="Amount ₹" type="number" inputMode="numeric" value={amt} onChange={e => setAmt(e.target.value)} />
      <Button variant="ghost" onClick={() => { if (l && +amt > 0) { A.addExpense(l, amt); setL(''); setAmt('') } }}>ADD EXPENSE</Button>
    </Glass>

    <Glass>
      <div className="lbl">Announcement</div>
      <textarea value={ann} onChange={e => setAnn(e.target.value)} style={{ margin: '10px 0' }} />
      <Button onClick={() => A.setAnnouncement(ann)}>POST ANNOUNCEMENT</Button>
    </Glass>
    {dlg}
  </>
}
