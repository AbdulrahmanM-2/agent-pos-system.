// Simulated airtime API — replace with real provider SDK
export const sendAirtime = async ({ phone, network, amount }) => {
  await new Promise(r => setTimeout(r, 900))
  return {
    success: true,
    ref: 'AT' + Math.floor(Math.random() * 900000 + 100000),
    phone,
    network,
    amount,
  }
}
