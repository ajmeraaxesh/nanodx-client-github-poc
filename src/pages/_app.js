import Head from 'next/head'
import Router from 'next/router'
import {Auth0Provider} from '@auth0/auth0-react'

import '@styles/globals.css'
import 'react-dates/initialize'
import 'react-dates/lib/css/_datepicker.css'
import '@styles/react_dates_overrides.css'
import {TESTINDEX} from '@lib/constants'

const onRedirectCallback = appState => {
  console.log('OnRedirectCallback() => ', {appState})
  Router.replace(appState?.returnTo || `${window.location.origin}${TESTINDEX}`)
}

function MyApp({Component, pageProps}) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
      clientId={process.env.NEXT_PUBLIC_CLIENT_ID}
      audience={process.env.NEXT_PUBLIC_AUTH0_AUDIENCE}
      redirectUri={
        typeof window !== 'undefined' && `${window.location.origin}${TESTINDEX}`
      }
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens
    >
      <Head>
        <meta name="viewport" content="width=device-width" />
        <meta charSet="utf-8" />
        <link rel="icon" type="image/png" href="/images/favicon.ico" />
      </Head>

      <Component {...pageProps} />
    </Auth0Provider>
  )
}

export default MyApp
