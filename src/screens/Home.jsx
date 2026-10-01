import { ShieldCheck } from 'lucide-react'
import { useApp } from '../store'
import { Glass, Button, Bar, Countdown, Stat } from '../ui'
import PaymentCard from './PaymentCard'
import { START, END, bday, rel } from '../data'
export default function Home({ go }) {
  const { s, A, me, st, MONTH } = useApp()
  const h = new Date().getHours(), g = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  const prog = (Date.now() - START) / (END - START) * 100
  const next = [...s.members].sort((a, b) => bday(a) - bday(b))[0]

  return <>
    <p className="dim" style={{ margin: '8px 0 16px' }}>Good {g}, {me ? me.name : 'Admin'}.</p>
    <Glass className="hero">
      <div className="lbl">Our Journey</div><p className="dim">Until 31 July 2031</p>
      <Countdown />
      <div className="lbl" style={{ marginTop: 16 }}>Journey Progress · {prog.toFixed(1)}%</div><Bar v={prog} />
    </Glass>
    <Glass>
      <div className="lbl">{MONTH}</div>
      <div style={{ margin: '10px 0 2px' }}><span className="big">₹{st.collected}</span> <span className="dim">of ₹{st.goal}</span></div>
      <Bar v={st.pct} />
      <div className="stats"><Stat label="PAID" value={st.paid} /><Stat label="PENDING" value={st.pending} /><Stat label="MEMBERS" value={st.total} /></div>
      {me?.role === 'admin' && <Button onClick={() => go('admin')}><ShieldCheck size={16} style={{ verticalAlign: -3 }} /> OPEN ZARKORA CONTROL</Button>}
    </Glass>
    {me && me.role !== 'admin' && <PaymentCard />}
    <Glass><div className="lbl">Latest Update</div><p style={{ marginTop: 8 }}>{s.announcement}</p></Glass>
    <Glass onClick={() => go('birthdays')}><div className="lbl">Upcoming Birthday</div><p style={{ marginTop: 8 }}>{next.name} — {rel(bday(next))} 🎂</p></Glass>
    <Button variant="ghost" onClick={() => go('updates')}>VIEW ALL UPDATES →</Button>
  </>
}
