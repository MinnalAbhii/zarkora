import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { until } from './data'
export const Glass = ({ children, className = '', onClick, style }) =>
  <motion.div className={'glass ' + className} style={style} onClick={onClick} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4 }} whileTap={onClick ? { scale: .985 } : undefined}>{children}</motion.div>
export const Button = ({ children, variant = '', ...p }) => <motion.button whileTap={{ scale: .96 }} className={'btn ' + variant} {...p}>{children}</motion.button>
export const Bar = ({ v }) => <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, v))}%` }} transition={{ duration: 1, ease: 'easeOut' }} /></div>
export const Avatar = ({ name, size = 40 }) => <div className="av" style={{ width: size, height: size, fontSize: size / 2.6 }}>{name.slice(0, 2).toUpperCase()}</div>
export const Pill = ({ m }) => m.paid ? (m.verified ? <span className="pill ok">✓ PAID</span> : <span className="pill wait">VERIFY</span>) : <span className="pill no">⏳ PENDING</span>
export const Stat = ({ label, value }) => <div><motion.b key={value} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{value}</motion.b><span>{label}</span></div>
export const Modal = ({ open, onClose, children }) => <AnimatePresence>{open &&
  <motion.div className="mbg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.div className="sheet" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }} onClick={e => e.stopPropagation()}>{children}</motion.div>
  </motion.div>}</AnimatePresence>
export function Countdown() {
  const [n, setN] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setN(new Date()), 1000); return () => clearInterval(t) }, [])
  const { y, m, d } = until(n), p = x => String(x).padStart(2, '0')
  return <div><div className="cd">{[[y, 'YEARS'], [m, 'MONTHS'], [d, 'DAYS']].map(([v, l]) => <div key={l}><b>{v}</b><span>{l}</span></div>)}</div>
    <div className="dim tiny">{p(23 - n.getHours())}:{p(59 - n.getMinutes())}:{p(59 - n.getSeconds())} left today</div></div>
}
