export const END = new Date('2031-07-31T23:59:59')
export const START = new Date('2026-09-01T00:00:00')

export function until(now = new Date()) {
  let y = END.getFullYear() - now.getFullYear()
  let m = END.getMonth() - now.getMonth()
  let d = END.getDate() - now.getDate()
  if (d < 0) {
    m--
    d += new Date(END.getFullYear(), END.getMonth(), 0).getDate()
  }
  if (m < 0) {
    y--
    m += 12
  }
  return { y: Math.max(0, y), m: Math.max(0, m), d: Math.max(0, d) }
}

function birthdayParts(value) {
  if (!value) return [1, 1]
  const parts = String(value).split('-').map(Number)
  return parts.length === 3 ? [parts[1], parts[2]] : [parts[0], parts[1]]
}

export function bday(mem, now = new Date()) {
  const [month, day] = birthdayParts(mem.birthday)
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let d = new Date(t.getFullYear(), month - 1, day)
  if (d < t) d = new Date(t.getFullYear() + 1, month - 1, day)
  return Math.round((d - t) / 864e5)
}

export const fmtB = b => {
  const [month, day] = birthdayParts(b)
  return new Date(2000, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export const rel = d => d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `in ${d} days`
