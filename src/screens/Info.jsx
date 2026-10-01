import { Cake, Wallet, CalendarDays, Bell } from 'lucide-react'
import { useApp } from '../store'
import { Glass } from '../ui'
import { bday, fmtB, rel } from '../data'
const Row = ({ m }) => <Glass style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
  <Cake color="#d6ab5e" /><div style={{ flex: 1 }}><b style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>{m.name}</b><div className="dim">{fmtB(m.birthday)}</div></div><span className="lbl">{rel(bday(m))}</span></Glass>
export function Birthdays() {
  const { s } = useApp(), now = new Date(), l = [...s.members].sort((a, b) => bday(a) - bday(b))
  const today = l.filter(m => bday(m) === 0), month = l.filter(m => { const d = bday(m); return d > 0 && new Date(+now + d * 864e5).getMonth() === now.getMonth() })
  const up = l.filter(m => !today.includes(m) && !month.includes(m)).slice(0, 8)
  return <><h1 className="h1">Birthdays</h1>
    {[['Today', today], ['This Month', month], ['Upcoming', up]].map(([t, a]) => a.length > 0 && <div key={t}><div className="lbl" style={{ margin: '14px 0 10px' }}>{t}</div>{a.map(m => <Row key={m.id} m={m} />)}</div>)}</>
}
export function Updates() {
  const { s, st } = useApp(), b = s.members.filter(m => bday(m) <= 1)
  const items = [['FUND UPDATE', s.announcement, Wallet], ['EVENT', 'Class meetup scheduled for October 12.', CalendarDays],
    ['REMINDER', `${st.pending} members still have pending contributions.`, Bell],
    ...b.map(m => ['BIRTHDAY', bday(m) ? `Tomorrow is ${m.name}'s birthday 🎂` : `Today is ${m.name}'s birthday 🎂`, Cake])]
  return <><h1 className="h1">Updates</h1>{items.map(([k, t, I], i) => <Glass key={i} className={'upd ' + k.split(' ')[0]}>
    <div className="lbl" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><I size={14} />{k}</div><p style={{ marginTop: 8 }}>{t}</p></Glass>)}</>
}
