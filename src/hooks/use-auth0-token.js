import {useAuth0} from '@auth0/auth0-react'
import {useRef, useEffect} from 'react'

const useAuth0Token = () => {
  const tokenRef = useRef(null)
  const {getAccessTokenSilently} = useAuth0()

  useEffect(() => {
    const getToken = async () => {
      tokenRef.current = await getAccessTokenSilently()
    }
    getToken()
  }, [getAccessTokenSilently])

  return tokenRef
}

export default useAuth0Token
