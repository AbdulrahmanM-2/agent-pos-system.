export const isValidPhone = (p) => /^255\d{9}$/.test(p.replace(/\s/g, ''))

export const isValidAmount = (a) => {
  const n = Number(String(a).replace(/,/g, ''))
  return !isNaN(n) && n > 0
}

export const isValidAccount = (a) => a.trim().length >= 8

export const parseAmount = (a) => Number(String(a).replace(/,/g, ''))
