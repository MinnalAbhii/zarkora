import { useEffect, useReducer, useRef, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'
import { Glass, Button } from '../ui'
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
function TicTacToe() {
  const [b, setB] = useState(Array(9).fill('')), [x, setX] = useState(true)
  const w = LINES.find(([a, c, d]) => b[a] && b[a] === b[c] && b[a] === b[d]), full = b.every(Boolean)
  const tap = i => { if (b[i] || w) return; const n = [...b]; n[i] = x ? 'X' : 'O'; setB(n); setX(!x) }
  return <><p className="lbl">{w ? `${b[w[0]]} WINS` : full ? 'DRAW' : `${x ? 'X' : 'O'} TO PLAY`}</p>
    <div className="grid3">{b.map((v, i) => <div key={i} className="cell" onClick={() => tap(i)}>{v}</div>)}</div>
    <Button variant="ghost" onClick={() => { setB(Array(9).fill('')); setX(true) }}>RESET</Button></>
}
const init = () => ({ sn: [[7, 7]], d: [1, 0], f: [3, 3], sc: 0, dead: false }), G = 14
const rnd = () => [Math.random() * G | 0, Math.random() * G | 0]
function snakeR(s, a) {
  if (a === 'reset') return init()
  if (a.dir) return a.dir[0] === -s.d[0] && a.dir[1] === -s.d[1] ? s : { ...s, d: a.dir }
  if (s.dead) return s
  const h = [s.sn[0][0] + s.d[0], s.sn[0][1] + s.d[1]]
  if (h[0] < 0 || h[1] < 0 || h[0] >= G || h[1] >= G || s.sn.some(c => c[0] === h[0] && c[1] === h[1])) return { ...s, dead: true }
  const eat = h[0] === s.f[0] && h[1] === s.f[1]
  return { ...s, sn: [h, ...(eat ? s.sn : s.sn.slice(0, -1))], f: eat ? rnd() : s.f, sc: s.sc + (eat ? 1 : 0) }
}
function Snake() {
  const [s, d] = useReducer(snakeR, null, init)
  useEffect(() => { const t = setInterval(() => d('tick'), 170); return () => clearInterval(t) }, [])
  const cells = []; for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) cells.push(s.sn.some(c => c[0] === x && c[1] === y) ? 's' : s.f[0] === x && s.f[1] === y ? 'f' : '')
  const B = ({ I, dir }) => <Button variant="ghost" onClick={() => d({ dir })} style={{ minHeight: 56 }}><I /></Button>
  return <><p className="lbl" style={{ marginBottom: 10 }}>{s.dead ? `GAME OVER · ` : ''}SCORE {s.sc}</p>
    <div className="sn">{cells.map((c, i) => <i key={i} className={c} />)}</div>
    <div className="grid3"><span /><B I={ArrowUp} dir={[0, -1]} /><span /><B I={ArrowLeft} dir={[-1, 0]} /><B I={ArrowDown} dir={[0, 1]} /><B I={ArrowRight} dir={[1, 0]} /></div>
    {s.dead && <Button onClick={() => d('reset')}>PLAY AGAIN</Button>}</>
}
function Reaction() {
  const [st, setSt] = useState('idle'), [ms, setMs] = useState(null), t0 = useRef(0), to = useRef()
  useEffect(() => () => clearTimeout(to.current), [])
  const tap = () => {
    if (st === 'idle' || st === 'res') { setSt('wait'); to.current = setTimeout(() => { t0.current = performance.now(); setSt('go') }, 1500 + Math.random() * 2500) }
    else if (st === 'wait') { clearTimeout(to.current); setSt('early') }
    else if (st === 'go') { setMs(Math.round(performance.now() - t0.current)); setSt('res') }
    else setSt('idle')
  }
  const txt = { idle: 'TAP TO START', wait: 'WAIT…', go: 'TAP NOW', early: 'TOO EARLY · TAP', res: `${ms} ms · TAP TO RETRY` }[st]
  return <div onClick={tap} className="glass ctr" style={{ minHeight: 280, background: st === 'go' ? 'rgba(214,171,94,.35)' : undefined }}><div className="h1" style={{ fontSize: 30 }}>{txt}</div></div>
}
function RPS() {
  const O = ['ROCK', 'PAPER', 'SCISSORS'], [r, setR] = useState(null), [sc, setSc] = useState([0, 0])
  const play = i => { const c = Math.random() * 3 | 0, o = (i - c + 3) % 3; setR([i, c, o]); setSc(s => [s[0] + (o === 1), s[1] + (o === 2)]) }
  return <><p className="lbl">YOU {sc[0]} — {sc[1]} CPU</p>
    {r && <Glass style={{ marginTop: 12 }}><p>{O[r[0]]} vs {O[r[1]]}</p><div className="h1" style={{ margin: '6px 0 0' }}>{['DRAW', 'YOU WIN', 'CPU WINS'][r[2]]}</div></Glass>}
    <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>{O.map((n, i) => <Button key={n} variant="ghost" onClick={() => play(i)}>{n}</Button>)}</div></>
}
const GAMES = [['Tic Tac Toe', TicTacToe], ['Snake', Snake], ['Reaction Test', Reaction], ['Rock Paper Scissors', RPS]]
export default function Arcade() {
  const [g, setG] = useState(null)
  if (g !== null) { const [n, C] = GAMES[g]; return <><Button variant="ghost" onClick={() => setG(null)} style={{ marginBottom: 14 }}>← ARCADE</Button><h1 className="h1">{n}</h1><C /></> }
  return <><h1 className="h1">Zarkora Arcade</h1><p className="dim" style={{ marginBottom: 16 }}>Take a break.</p>
    {GAMES.map(([n], i) => <Glass key={n} onClick={() => setG(i)}><div className="h1" style={{ margin: 0, fontSize: 28 }}>{n}</div></Glass>)}</>
}
