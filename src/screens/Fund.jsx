import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useApp } from '../store'
import { Glass, Bar, Avatar, Pill, Button } from '../ui'
import { fmtB } from '../data'
import PaymentCard from './PaymentCard'
const inr = n => '₹' + n.toLocaleString('en-IN')
export function Fund() {
  const { s, st, MONTH } = useApp()
  return <>
    <h1 className="h1">Fund</h1>
    <Glass className="hero"><div className="lbl">{MONTH}</div>
      <div style={{ margin: '10px 0 2px' }}><span className="big">{inr(st.collected)}</span> <span className="dim">/ {inr(st.goal)} · {st.pct}%</span></div>
      <Bar v={st.pct} /><p className="dim">Members paid: {st.paid} / {st.total}</p></Glass>
    <PaymentCard />
    <Glass><div className="lbl">Current Month</div>
      {s.members.map(m => <div className="row" key={m.id}><Avatar name={m.name} size={34} /><div>{m.name}</div><span className="dim">{m.method || ''}</span><Pill m={m} /></div>)}</Glass>
    <Glass>{[['Total Collected', st.totalIn], ['Total Expenses', st.spent], ['Current Balance', st.balance]].map(([l, v]) =>
      <div key={l} style={{ marginBottom: 14 }}><div className="lbl">{l}</div><div className="big" style={{ fontSize: 38 }}>{inr(v)}</div></div>)}</Glass>
    <Glass><div className="lbl">Fund History</div>
      {[[MONTH, st.collected]].map(([m, a]) => <div className="row" key={m}><div><b>{m}</b></div><b style={{ color: 'var(--gold)' }}>{inr(a)}</b></div>)}</Glass>
  </>
}
export function Members({ go }) {
  const { s } = useApp(), [q, setQ] = useState(''), l = q.toLowerCase()
  const list = s.members.filter(m => m.name.toLowerCase().includes(l) || m.username.includes(l))
  return <>
    <h1 className="h1">Class Members</h1><p className="lbl" style={{ marginBottom: 12 }}>{s.members.length} MEMBERS</p>
    <input placeholder="Search members" value={q} onChange={e => setQ(e.target.value)} />
    {list.map(m => <Glass key={m.id} onClick={() => go('profile', { id: m.id })} style={{ padding: 12 }}>
      <div className="row" style={{ border: 0, padding: 0 }}><Avatar name={m.name} size={44} />
        <div><b style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>{m.name}</b><div className="dim">@{m.username} · {inr(m.total)} contributed</div></div>
        <Pill m={m} /></div></Glass>)}
  </>
}
export function Profile({ id }) {
  const { s, A, me } = useApp(), m = s.members.find(x => x.id === id)
  if (!m) return null
  const hist = [[MONTH, m.paid ? m.method : null], ['August 2026', 'Cash'], ['July 2026', 'GPay']]
  return <>
    <div style={{ textAlign: 'center', margin: '8px 0 18px' }}><div style={{ display: 'grid', placeItems: 'center' }}><Avatar name={m.name} size={96} /></div>
      <h1 className="h1" style={{ margin: '14px 0 2px' }}>{m.name}</h1><p className="dim">@{m.username} · Joined {m.joined}</p></div>
    <div className="stats">{[['CONTRIBUTED', inr(m.total)], ['MONTHS PAID', m.months], ['STREAK', m.streak + ' MO']].map(([l, v]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <Glass><div className="lbl">Birthday</div><p style={{ marginTop: 6 }}>{fmtB(m.birthday)}</p></Glass>
    <Glass><div className="lbl">Payment History</div>
      {hist.map(([mo, me2]) => <div className="row" key={mo}><div><b>{mo}</b></div><span className={me2 ? 'dim' : 'pill no'}>{me2 ? `✓ ${me2} — ₹${s.target}` : '⏳ PENDING'}</span></div>)}</Glass>
    {me?.id === m.id && <Button variant="ghost" onClick={A.logout}><LogOut size={15} style={{ verticalAlign: -2 }} /> LOG OUT</Button>}
  </>
}
