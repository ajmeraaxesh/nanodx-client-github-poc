import {useRouter} from 'next/router'
import {useAuth0} from '@auth0/auth0-react'

import UnAuthenticatedApp from '@components/UnauthenticatedApp'
import {AuthenticationLoading} from '@components/CommonComponents'
import {TESTINDEX} from '@lib/constants'

export function AuthHandler() {
  const {isAuthenticated, isLoading, error, logout} = useAuth0()
  const router = useRouter()

  if (error) {
    console.log('AuthHandler Error: ', error.message)
    // display the unauthorized error message and force the user to logout
    // When a deleted or a non existent user is trying to login
    if (error.message.includes('Unauthorized')) {
      setTimeout(() => {
        logout()
      }, 10000)
    }
    return (
      <div className="mx-auto max-w-xl whitespace-normal rounded-lg bg-rose-100 text-rose-700 px-6 py-3">
        Error from Auth0:
        <div>Error Name: {error.name}</div>
        <div>Error Description:{error.error_description}</div>
        <div>Error Message: {error.message}</div>
        <div>
          Error Stack:
          <dd className="break-normal">{error.stack.toString()}</dd>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <AuthenticationLoading />
  }

  console.log('AuthHandler:: ', isAuthenticated)

  if (isAuthenticated) {
    router.push(TESTINDEX)
    return null
  } else {
    return <UnAuthenticatedApp />
  }
}
