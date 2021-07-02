import {AuthenticationLoading} from '@components/CommonComponents'

import {CUSTOMER, PORTAL} from '@lib/Strings'

export const isBrowser = typeof window !== 'undefined'

export const getRedirecting = authReturnToUrl => {
  return {
    onRedirecting: function onRedirectingFunc() {
      return <AuthenticationLoading />
    },
    returnTo: authReturnToUrl,
    loginOptions: {
      portalType: `${CUSTOMER} ${PORTAL}`,
    },
  }
}
