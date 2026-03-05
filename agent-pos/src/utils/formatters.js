export const formatTZS = (n) =>
  'TZS ' + Number(n).toLocaleString('en-TZ')

export const formatDate = (d = new Date()) =>
  d.toLocaleDateString('en-TZ', { day: '2-digit', month: 'short', year: 'numeric' })

export const formatTime = (d = new Date()) =>
  d.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' })

export const formatPhone = (p = '') =>
  p.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')
