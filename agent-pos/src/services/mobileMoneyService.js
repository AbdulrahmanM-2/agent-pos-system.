// Simulated M-Pesa / Mobile Money API
export const processMobileMoney = async ({ customer, service, amount, type }) => {
  await new Promise(r => setTimeout(r, 1400))
  return {
    success: true,
    ref: 'MM' + Math.floor(Math.random() * 900000 + 100000),
    customer,
    service,
    amount,
    type,
    status: 'Success',
  }
}
