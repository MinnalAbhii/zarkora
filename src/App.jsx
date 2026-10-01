import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home as HomeI, Wallet, Users, Gamepad2, ArrowLeft } from 'lucide-react'
import { AppProvider, useApp } from './store'
import { Avatar } from './ui'
import { Splash, Login } from './screens/Auth'
import Home from './screens/Home'
import { Fund, Members, Profile } from './screens/Fund'
import { Birthdays, Updates } from './screens/Info'
import Arcade from './screens/Arcade'
import { AdminDash, AdminMembers, AdminFund } from './screens/Admin'

const S = { home: Home, fund: Fund, members: Members, profile: Profile, birthdays: Birthdays, updates: Updates, arcade: Arcade, admin: AdminDash, 'admin-members': AdminMembers, 'admin-fund': AdminFund }
const TABS = [['home', 'HOME', HomeI], ['fund', 'FUND', Wallet], ['members', 'MEMBERS', Users], ['arcade', 'ARCADE', Gamepad2]]

export default function App() { return <AppProvider><Root /></AppProvider> }

function Root() {
  const { s, me } = useApp()
  const [splash, setSplash] = useState(true)
  const [stack, setStack] = useState([{ n: 'home' }])

  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => setStack([{ n: 'home' }]), [s.user?.id])

  if (splash || s.loading) return <div className="app"><Splash /></div>
  if (!s.user) return <div className="app"><Login /></div>

  const top = stack[stack.length - 1]
  const go = (n, p = {}) => setStack(x => [...x, { n, ...p }])
  const Scr = S[top.n]
  const admin = me?.role === 'admin'

  return <div className="app">
    <div className="hdr">
      <span className="wm">ZARKORA</span>
      {stack.length > 1
        ? <motion.button whileTap={{ scale: .9 }} onClick={() => setStack(x => x.slice(0, -1))}
            style={{ background: 'none', border: 0, color: 'var(--gold)', padding: 10 }}><ArrowLeft /></motion.button>
        : <motion.button whileTap={{ scale: .9 }}
            onClick={() => admin ? go('admin') : go('profile', { id: me.id })}
            style={{ background: 'none', border: 0 }}><Avatar name={admin ? 'AD' : me.name} /></motion.button>}
    </div>

    <div className="scroll">
      <AnimatePresence mode="wait">
        <motion.div key={top.n + (top.id || '')} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: .22 }}>
          <Scr go={go} id={top.id} />
        </motion.div>
      </AnimatePresence>
    </div>

    <nav className="bn">
      {TABS.map(([k, l, I]) =>
        <button key={k} className={stack[0].n === k ? 'on' : ''} onClick={() => setStack([{ n: k }])}>
          <I size={21} />{l}
        </button>
      )}
    </nav>
  </div>
}
