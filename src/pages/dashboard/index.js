import {withAuthenticationRequired} from '@auth0/auth0-react'
// import DashboardShell from '@components/DashboardShell'
import {useRouter} from 'next/router'
import {TESTINDEX} from '@lib/constants'
import {useEffect} from 'react'

const Dashboard = () => {
  // const router = useRouter()
  // useEffect(() => {
  //   router.push(TESTINDEX)
  // }, [router])
  return <div>Dashboard homepage</div>
}

// NOTE: not using withAuthenticationRequired for Dashboard
//  as dashboard is redirecting to tests page which does have that check as well as user screen access
// The reason is to avoid unnecessary layers of authentication, when a similar check is taking place
export default withAuthenticationRequired(Dashboard)
