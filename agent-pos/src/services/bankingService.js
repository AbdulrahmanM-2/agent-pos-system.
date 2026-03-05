// Simulated banking API
export const processBanking = async ({ account, bank, amount, type }) => {
  await new Promise(r => setTimeout(r, 1100))
  return {
    success: true,
    ref: 'BK' + Math.floor(Math.random() * 900000 + 100000),
    account,
    bank,
    amount,
    type,
  }
}
