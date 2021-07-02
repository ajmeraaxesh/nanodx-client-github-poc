const fetcher = (endpoint, token = null, {body, ...customConfig} = {}) => {
  const headers = {'content-type': 'application/json'}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  }

  // console.log('request headers: ', headers)
  if (body) {
    config.body = JSON.stringify(body)
  }

  let API_URL = typeof window !== undefined ? window.location.host : null
  if (process.env.NODE_ENV !== 'production') {
    API_URL = process.env.NEXT_PUBLIC_SERVER_URL
  }

  // console.log('Fetcher Lib request config: ', config)

  return fetch(`https://${API_URL}/api/${endpoint}`, config)
    .then(async response => {
      // console.log('Fetcher Lib::', 'response: ', response)
      // Logging out the user and
      // refreshing the page so that user will be redirected to the login
      if (response.status === 401 && headers.Authorization) {
        console.log('FetcherLib:: Unauthorized API access')
        return Promise.reject({
          message: 'UnAuthorized Access',
        })
      }

      const data = await response.json()
      if (response.ok) {
        console.log('FetcherLib:: data::  ', data)
        return data
      } else {
        console.log('FetcherLib:: error:: ', data)
        return Promise.reject(data)
      }
    })
    .catch(err => {
      throw err
    })
}

export default fetcher
