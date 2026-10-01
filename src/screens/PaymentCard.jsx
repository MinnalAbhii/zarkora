import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Banknote, QrCode, Upload, MessageCircle } from 'lucide-react'
import { useApp } from '../store'
import { Glass, Button, Modal } from '../ui'

const WA = '919048236654'
// Shares the screenshot + message via the Web Share API when the browser can share files; otherwise opens the wa.me deep link (no attachment).
async function sendWhatsApp(file, text) {
  if (file && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'ZARKORA Payment', text }); return 'shared' }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; if (e?.name === 'NotAllowedError') return 'blocked' }
  }
  return window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank') ? 'link' : 'blocked'
}
const NOTE = {
  shared: 'In the share sheet choose WhatsApp and send it to the admin (+91 9048236654).',
  link: 'Attach your payment screenshot before sending.',
  cancelled: 'Not sent yet — tap below to send it to the admin on WhatsApp.',
  blocked: 'WhatsApp did not open — tap below to send it. Attach your payment screenshot before sending.',
}
const back = { width: '100%', marginTop: 10, background: 'none', border: 0, color: 'var(--dim)', padding: 10 }
const Err = ({ t }) => t ? <p style={{ color: '#e59090', fontSize: 13, margin: '10px 0' }}>{t}</p> : null

export default function PaymentCard() {
  const { s, A, me, MONTH, currentPayments } = useApp()
  const mine = currentPayments.find(p => String(p.user_id) === String(me?.id))
  const [open, setOpen] = useState(false), [mode, setMode] = useState(null), [done, setDone] = useState(null)
  const [file, setFile] = useState(null), [preview, setPreview] = useState(''), [busy, setBusy] = useState(false)
  const [err, setErr] = useState(''), [wa, setWa] = useState(''), ref = useRef()
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u)
  }, [file])
  const msg = `ZARKORA Monthly Payment\n\nName: ${me.name}\nUsername: @${me.username}\nMonth: ${MONTH}\nAmount: ₹${s.target}\nPayment Method: UPI\n\nPayment screenshot attached.`
  const openSheet = () => { setOpen(true); setMode(null); setDone(null); setFile(null); setErr(''); setWa('') }
  const close = () => { setOpen(false); setTimeout(() => { setMode(null); setDone(null); setFile(null); setWa('') }, 300) }
  const submit = async method => {
    if (busy || (method === 'UPI' && !file)) return
    setBusy(true); setErr('')
    try { await A.pay(me.id, method) } catch (e) { setErr(e.message || 'Could not submit payment.'); setBusy(false); return }
    setBusy(false); setDone(method)
    if (method === 'UPI') setWa(await sendWhatsApp(file, msg))
  }
  return <>
    {mine?.status === 'paid' ? <Glass><div className="lbl">{MONTH}</div>
      <div className="h1" style={{ margin: '8px 0 4px', color: 'var(--gold)' }}>✓ PAID</div><p className="dim">{MONTH} contribution completed</p></Glass>
    : mine ? <Glass><div className="lbl">{MONTH}</div>
      <div className="h1" style={{ margin: '8px 0 4px', fontSize: 30 }}>PAYMENT SUBMITTED</div><p className="dim">Awaiting admin verification.</p></Glass>
    : <Glass><div className="lbl">{MONTH}</div>
      <div style={{ margin: '8px 0 4px' }}><span className="big">₹{s.target}</span></div><p className="dim" style={{ marginBottom: 14 }}>Monthly Contribution</p>
      <Button onClick={openSheet}>MAKE THIS MONTH'S PAYMENT</Button></Glass>}

    <Modal open={open} onClose={() => !busy && close()}>
      {done ? <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}><CheckCircle2 size={64} color="#d6ab5e" /></motion.div>
        <h2 className="h1" style={{ margin: '12px 0 4px', fontSize: 30 }}>{done === 'Cash' ? 'CASH PAYMENT SUBMITTED' : 'PAYMENT SUBMITTED'}</h2>
        <p className="dim" style={{ marginBottom: 18 }}>{done === 'Cash' ? 'Waiting for admin verification.' : 'PENDING VERIFICATION — the admin will mark it paid once checked.'}</p>
        {done === 'UPI' && <>
          {wa && <p className="dim" style={{ marginBottom: 12 }}>{NOTE[wa]}</p>}
          <Button variant="ghost" style={{ marginBottom: 10 }} onClick={async () => setWa(await sendWhatsApp(file, msg))}><MessageCircle size={16} style={{ verticalAlign: -3 }} /> SEND ON WHATSAPP</Button></>}
        <Button onClick={close}>DONE</Button>
      </div> : <>
        {!mode && <>
          <div className="lbl">MONTHLY CONTRIBUTION</div>
          <div className="h1" style={{ margin: '8px 0 14px', fontSize: 30 }}>{MONTH}</div>
          <div className="lbl">Amount</div><div className="big" style={{ margin: '6px 0 18px' }}>₹{s.target}</div>
          <div className="lbl" style={{ marginBottom: 10 }}>Choose Payment Method</div>
          <div style={{ display: 'grid', gap: 10 }}>
            <Button onClick={() => setMode('upi')}><QrCode size={17} style={{ verticalAlign: -3 }} /> PAY BY UPI</Button>
            <Button variant="ghost" onClick={() => setMode('cash')}><Banknote size={17} style={{ verticalAlign: -3 }} /> PAY BY CASH</Button>
          </div></>}

        {mode === 'upi' && <>
          <div className="lbl">UPI PAYMENT · {MONTH}</div>
          <div className="big" style={{ margin: '10px 0' }}>PAY ₹{s.target}</div>
          <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
            <img src="/zarkora-upi-qr.jpg" alt="ZARKORA UPI QR" style={{ width: 'min(100%, 300px)', borderRadius: 16, display: 'block', margin: '0 auto', background: '#080707' }} /></div>
          <div className="glass" style={{ padding: 12, marginBottom: 12 }}><div className="lbl">UPI ID</div><b style={{ fontSize: 18, letterSpacing: '.04em' }}>9048236654@fam</b></div>
          <p className="dim" style={{ marginBottom: 12 }}>Scan the QR using any UPI app. After paying, upload a screenshot of the successful payment (required).</p>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] || null)} />
          <Button variant="ghost" onClick={() => ref.current?.click()}><Upload size={16} style={{ verticalAlign: -3 }} /> {file ? 'CHANGE SCREENSHOT' : 'UPLOAD PAYMENT SCREENSHOT'}</Button>
          {preview && <img src={preview} alt="Payment screenshot preview" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 12, marginTop: 10, border: '1px solid var(--line)' }} />}
          <Err t={err} />
          <Button disabled={busy || !file} onClick={() => submit('UPI')} style={{ marginTop: 10 }}>{busy ? 'SUBMITTING…' : 'SUBMIT PAYMENT'}</Button>
          <button onClick={() => setMode(null)} style={back}>← Choose another method</button></>}

        {mode === 'cash' && <>
          <div className="lbl">CASH PAYMENT</div>
          <div className="lbl" style={{ margin: '14px 0 4px', color: 'var(--dim)' }}>Monthly Contribution</div>
          <div className="big" style={{ margin: '0 0 12px' }}>₹{s.target}</div>
          <div className="glass" style={{ padding: 14, marginBottom: 14 }}><p>Give ₹{s.target} to the class fund/admin.</p></div>
          <Err t={err} />
          <Button disabled={busy} onClick={() => submit('Cash')}>{busy ? 'SUBMITTING…' : 'SUBMIT CASH PAYMENT'}</Button>
          <button onClick={() => setMode(null)} style={back}>← Choose another method</button></>}
      </>}
    </Modal>
  </>
}
