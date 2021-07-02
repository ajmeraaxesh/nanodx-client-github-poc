import {useEffect} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {useRouter} from 'next/router'
import {TESTINDEX} from '@lib/constants'

const UnAuthenticatedApp = () => {
  const {loginWithRedirect} = useAuth0()
  const router = useRouter()

  useEffect(() => {
    router.prefetch(TESTINDEX)
    loginWithRedirect({
      portalType: 'Client Portal',
    })
  }, [loginWithRedirect, router])

  return null
  {
    /* // <div className="w-screen">
        //     <div className="min-h-screen flex flex-col justify-center items-center">
        //         <Image
        //             src="/images/nanodx-logo.png"
        //             alt="NanoDx"
        //             className="pt-5 pb-1"
        //             width="300"
        //             height="100"
        //         />
        //         <div className="mt-4 w-80 rounded-lg shadow-lg text-center py-12 px-4">
        //             <div className="text-3xl leading-9 font-semibold font-venera ">
        //                 <dt className="text-brand-dark-gray">Partner</dt>
        //                 <dd className="text-brand-blue">Portal</dd>
        //             </div>
        //             <button
        //                 className="mt-2 btn w-full text-xl"
        //                 onClick={() => loginWithRedirect()}
        //             >
        //                 Sign In
        //             </button>
        //         </div>
        //     </div>
        // </div> */
  }
}

export default UnAuthenticatedApp
