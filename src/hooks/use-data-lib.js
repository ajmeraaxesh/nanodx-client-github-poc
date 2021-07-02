import useSWR from 'swr'
import fetcherLib from '@lib/fetcher'
import {useAuth0} from '@auth0/auth0-react'

const useDataLib = (parameters, swrOption = {}) => {
  const {isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0()

  const fetcher = async (url, clientConfig, ...rest) => {
    const token = await getAccessTokenSilently()
    // console.log('useDataLib:: Token: ', token)

    // console.log(
    //     'fetcher::  ',
    //     {url},
    //     {clientConfig},
    //     'rest:: ',
    //     rest
    // )

    try {
      const data = await fetcherLib(url, token, clientConfig)
      return data
    } catch (error) {
      // console.error('DataLib error', error)
      let errorMsg = 'Could not fetch data'
      // TODO:FIXME: Decide for API access in case of
      // Unauthorized request

      if (error.message) {
        errorMsg = error.message
      }

      throw new Error(errorMsg)
      // return error
    }
  }

  // setup useSWROptions
  return useSWR(isLoading || !isAuthenticated ? null : parameters, fetcher, {
    revalidateOnFocus: false,
    errorRetryCount: 3,
    ...swrOption,
  })
}

export default useDataLib
