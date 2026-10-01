import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'

const C = createContext()
export const useApp = () => useContext(C)

const now = new Date()
const MONTH_NAME = now.toLocaleString('en-US', { month: 'long' })
const YEAR = now.getFullYear()
const MONTH_LABEL = `${MONTH_NAME} ${YEAR}`

const normalizeProfile = p => ({
  ...p,
  joined: p.joined_at ? new Date(p.joined_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—',
  paid: false,
  method: null,
  verified: false,
  months: 0,
  streak: 0,
  total: 0,
})

export function AppProvider({ children }) {
  const [s, setS] = useState({
    user: null,
    session: null,
    profiles: [],
    payments: [],
    expenses: [],
    announcements: [],
    settings: null,
    goals: [],
    loading: true,
    error: '',
  })

  const load = async session => {
    if (!session?.user) {
      setS(x => ({ ...x, user: null, session: null, loading: false }))
      return
    }

    setS(x => ({ ...x, loading: true, error: '' }))

    const uid = session.user.id
    const [
      profileRes,
      profilesRes,
      paymentsRes,
      expensesRes,
      announcementsRes,
      settingsRes,
      goalsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('auth_user_id', uid).maybeSingle(),
      supabase.from('profiles').select('*').order('name'),
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('spent_at', { ascending: false }),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('fund_settings').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('fund_goals').select('*').eq('is_active', true).order('deadline'),
    ])

    const firstError = [
      profileRes, profilesRes, paymentsRes, expensesRes,
      announcementsRes, settingsRes, goalsRes,
    ].find(r => r.error)

    if (firstError?.error) {
      setS(x => ({ ...x, loading: false, error: firstError.error.message }))
      return
    }

    const profiles = (profilesRes.data || []).map(normalizeProfile)
    const payments = paymentsRes.data || []
    const currentPayments = payments.filter(p => p.month === MONTH_NAME && Number(p.year) === YEAR)

    const enriched = profiles.map(m => {
      const mine = payments.filter(p => p.user_id === m.id)
      const current = currentPayments.find(p => p.user_id === m.id)
      const paidHistory = mine.filter(p => p.status === 'paid')
      const total = paidHistory.reduce((a, p) => a + Number(p.amount || 0), 0)
      return {
        ...m,
        paid: current?.status === 'paid' || current?.status === 'pending',
        method: current?.method || null,
        verified: current?.status === 'paid',
        months: paidHistory.length,
        total,
      }
    })

    setS({
      user: profileRes.data ? normalizeProfile(profileRes.data) : null,
      session,
      profiles: enriched,
      payments,
      expenses: expensesRes.data || [],
      announcements: announcementsRes.data || [],
      settings: settingsRes.data || null,
      goals: goalsRes.data || [],
      loading: false,
      error: '',
    })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const refresh = async () => {
    const { data } = await supabase.auth.getSession()
    await load(data.session)
  }

  const callCreateMember = async payload => {
    const { data, error } = await supabase.functions.invoke('create-member', {
      body: payload,
    })
    if (error) throw error
    if (data?.error) throw new Error(data.error)
    await refresh()
    return data
  }

  const currentPayments = s.payments.filter(p => p.month === MONTH_NAME && Number(p.year) === YEAR)
  const target = Number(s.settings?.monthly_amount ?? 20)
  const profiles = s.profiles
  const me = s.user
  const paidCount = currentPayments.filter(p => p.status === 'paid').length
  const pendingCount = currentPayments.filter(p => p.status === 'pending').length
  const totalMembers = profiles.length
  const collected = currentPayments.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount || 0), 0)
  const goal = totalMembers * target
  const spent = s.expenses.reduce((a, e) => a + Number(e.amount || 0), 0)
  const totalIn = s.payments.filter(p => p.status === 'paid').reduce((a, p) => a + Number(p.amount || 0), 0)
  const st = {
    paid: paidCount,
    pending: Math.max(0, totalMembers - paidCount),
    total: totalMembers,
    collected,
    goal,
    pct: goal ? Math.round(collected / goal * 100) : 0,
    spent,
    totalIn,
    balance: totalIn - spent,
  }

  const admin = () => { if (me?.role !== 'admin') throw new Error('Admin only.') }
  const touch = async (pid, from, patch) => {
    const { data, error } = await supabase.from('payments').update(patch).eq('id', pid).eq('status', from).select('id')
    if (error) throw error
    if (!data?.length) throw new Error('Payment was not updated. Refresh and try again.')
    await refresh()
  }
  const same = (a, b) => String(a) === String(b)

  const A = {
    async login(username, password) {
      const u = username.trim().toLowerCase()
      if (!u || !password) return false

      // Members created by ZARKORA use an internal Auth email.
      // The admin account can use VITE_ADMIN_EMAIL.
      const email = u === 'abhinav'
        ? (import.meta.env.VITE_ADMIN_EMAIL || `${u}@zarkora.app`)
        : `${u}@zarkora.app`

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return !error
    },

    logout: async () => {
      await supabase.auth.signOut()
      setS(x => ({ ...x, user: null, session: null }))
    },

    pay: async (id, method = 'UPI') => {
      if (!me || (!same(me.id, id) && me.role !== 'admin')) throw new Error('Not allowed.')
      if (currentPayments.some(p => same(p.user_id, id))) throw new Error('A payment for this month already exists.')
      const { error } = await supabase.from('payments').insert({
        user_id: id, amount: target, month: MONTH_NAME, year: YEAR, method, status: 'pending', created_at: new Date().toISOString(),
      })
      if (error) throw new Error(error.code === '23505' ? 'A payment for this month already exists.' : error.message)
      await refresh()
    },

    markPaid: async pid => {
      admin(); const t = new Date().toISOString()
      await touch(pid, 'pending', { status: 'paid', paid_at: t, verified_at: t, verified_by: me.id })
    },

    undoPayment: async pid => {
      admin()
      await touch(pid, 'paid', { status: 'pending', paid_at: null, verified_at: null, verified_by: null })
    },

    markCashPaid: async uid => {
      admin()
      const ex = currentPayments.find(p => same(p.user_id, uid))
      if (ex) { if (ex.status === 'pending') await A.markPaid(ex.id); return }
      const t = new Date().toISOString()
      const { error } = await supabase.from('payments').insert({
        user_id: uid, amount: target, month: MONTH_NAME, year: YEAR, method: 'Cash', status: 'paid',
        paid_at: t, verified_at: t, verified_by: me.id, created_at: t,
      })
      if (error) throw error
      await refresh()
    },

    verify: async uid => { const p = currentPayments.find(x => same(x.user_id, uid) && x.status === 'pending'); if (p) await A.markPaid(p.id) },
    undo: async uid => { const p = currentPayments.find(x => same(x.user_id, uid) && x.status === 'paid'); if (p) await A.undoPayment(p.id) },

    setTarget: async amount => {
      if (!me || me.role !== 'admin') return
      const existing = s.settings
      const payload = {
        monthly_amount: Math.max(0, Number(amount) || 0),
        fund_name: existing?.fund_name || 'Class Fund',
        journey_start: existing?.journey_start || '2026-09-01',
        journey_end: existing?.journey_end || '2031-07-31',
      }
      let result
      if (existing?.id) result = await supabase.from('fund_settings').update(payload).eq('id', existing.id)
      else result = await supabase.from('fund_settings').insert(payload)
      if (result.error) throw result.error
      await refresh()
    },

    addExpense: async (title, amount) => {
      const { error } = await supabase.from('expenses').insert({
        title,
        amount: Number(amount),
        added_by: me?.id || null,
      })
      if (error) throw error
      await refresh()
    },

    delExpense: async id => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      await refresh()
    },

    setAnnouncement: async text => {
      const { error } = await supabase.from('announcements').insert({
        title: 'Fund Update',
        content: text,
        type: 'GENERAL',
        created_by: me?.id || null,
      })
      if (error) throw error
      await refresh()
    },

    editMember: async (id, patch) => {
      const allowed = {}
      if (patch.name !== undefined) allowed.name = patch.name
      if (patch.username !== undefined) allowed.username = patch.username
      if (patch.birthday !== undefined) allowed.birthday = patch.birthday
      const { error } = await supabase.from('profiles').update(allowed).eq('id', id)
      if (error) throw error
      await refresh()
    },

    addMember: callCreateMember,
  }

  const announcement = s.announcements[0]?.content || 'No announcements yet.'

  const value = useMemo(() => ({
    s: {
      ...s,
      members: profiles,
      target,
      announcement,
      history: [],
      prior: 0,
    },
    A,
    me,
    st,
    MONTH: MONTH_LABEL,
    MONTH_NAME,
    YEAR,
    currentPayments,
  }), [s, profiles, target, announcement, me, st.paid, st.pending, st.collected, st.goal, st.total, st.spent, st.totalIn, st.balance, currentPayments.length])

  return <C.Provider value={value}>{children}</C.Provider>
}
