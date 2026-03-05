import AirtimeCard from '../components/airtime/AirtimeCard'
import MobileMoneyCard from '../components/mobilemoney/MobileMoneyCard'
import BankingCard from '../components/banking/BankingCard'

export default function Dashboard() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 20,
      animation: 'fadeUp .3s ease',
    }}>
      <AirtimeCard />
      <MobileMoneyCard />
      <BankingCard />
    </div>
  )
}
