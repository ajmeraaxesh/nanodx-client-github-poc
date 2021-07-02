/* This example requires Tailwind CSS v2.0+
  Application > Application Shells >  Light nav with bottom border
*/
import {useEffect, Fragment} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/router'

import {useAuth0} from '@auth0/auth0-react'
import {Disclosure} from '@headlessui/react'
import {MenuIcon, XIcon} from '@heroicons/react/outline'
import {HomeIcon, XCircleIcon} from '@heroicons/react/solid'
import shallow from 'zustand/shallow'
import {useIdleTimer} from 'react-idle-timer'

import useNavbarStore from '@hooks/use-navigation-store'
import {HOMEPAGE} from '@lib/constants'
import {NANODX, CUSTOMER, PORTAL} from '@lib/Strings'
import useSettingstore from '@hooks/use-settings-store'
// import useDataLib from '@hooks/use-data-lib'
import PageHead from '@components/pagehead'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function DashboardShell({
  pageTitle = `${NANODX} - ${CUSTOMER} ${PORTAL}`,
  children,
}) {
  const {user, isAuthenticated} = useAuth0()
  const router = useRouter()

  const {
    navigationLinks,
    updateNavigationLinks,
    // setCurrentLink
  } = useNavbarStore(
    state => ({
      navigationLinks: state.navigationLinks,
      updateNavigationLinks: state.updateNavigationLinks,
      // setCurrentLink: state.setCurrentLink,
    }),
    shallow,
  )

  const {settings, updateSettings} = useSettingstore(
    state => ({
      settings: state.settings,
      updateSettings: state.updateSettings,
    }),
    shallow,
  )

  //console.log('Initial:: Settings:: ', settings, ' udpate:: ', updateSettings)

  // Trying to fetch initial settings for a user account
  // const {data: settingsData, error: settingsError} = useDataLib(
  //   Object.keys(settings).length === 0
  //     ? [`Distributor/settings-with-lists`]
  //     : null,
  // )

  // sideeffect for populating navigation links
  useEffect(() => {
    if (navigationLinks.length < 1 && isAuthenticated) {
      console.log('DashboardShell: navigationLink:: useEffect:: ', user)
      updateNavigationLinks(
        user[`https://${process.env.NEXT_PUBLIC_SERVER_URL}/userScreenAccess`],
      )
    }
  }, [navigationLinks.length, updateNavigationLinks, isAuthenticated, user])

  // side effect for updating link thereby causing the link
  //  to be higlighted
  // useEffect(() => {
  //   setCurrentLink(router.pathname)
  // }, [router.pathname, setCurrentLink])

  // sideeffect for populating the initialSettings
  useEffect(() => {
    if (Object.keys(settings).length <= 0) {
      // console.log(
      //   'DashboardShell: settings:: useEffect:: ',
      //   user[
      //     `https://${process.env.NEXT_PUBLIC_DEVELOPMENT_SERVER_URL}/settings`
      //   ],
      // )
      console.log(
        'Bypasses Settings condition:: Default user settings: ',
        user[`https://${process.env.NEXT_PUBLIC_SERVER_URL}/settings`],
      )
      updateSettings(
        user[`https://${process.env.NEXT_PUBLIC_SERVER_URL}/settings`],
      )
    }
  }, [settings, updateSettings, user])

  // console.log('Dashboard shell: ', {navigationLinks})

  return (
    <div className="min-h-screen bg-white">
      <PageHead title={pageTitle} />
      {/** Navbar  for desktop and mobile */}
      <Disclosure as="nav" className="bg-white border-b border-gray-200">
        {({open}) => (
          <Fragment>
            <div className="max-w-8xl mx-auto px-4 sm:px-6">
              <div className="flex justify-between h-12 sm:h-16">
                <div className="flex ">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href={HOMEPAGE}>
                      <a className="flex flex-row sm:flex-col items-center ">
                        <img
                          className=" my-1 h-6 w-auto mx-auto"
                          src="/images/nanodx-logo.png"
                          alt="NanoDiagnosticsTM, Inc logo"
                        />

                        <div className="mt-1 sm:mt-0 font-venera font-semibold text-base">
                          <span className="text-brand-dark-gray">
                            {CUSTOMER}
                          </span>
                          <span className="ml-1 text-brand-blue">{PORTAL}</span>
                        </div>
                      </a>
                    </Link>
                  </div>

                  {/** Desktop Navigation Menu */}
                  <div className="hidden sm:-my-px sm:ml-12 sm:flex sm:space-x-2 sm:items-center">
                    {navigationLinks.map(item => {
                      const isCurrent = router.pathname.includes(item.path)
                      return (
                        <div
                          key={item.screenID}
                          className=" flex items-center space-x-2"
                        >
                          <Link href={`/${item.path}`}>
                            <a
                              className={classNames(
                                isCurrent
                                  ? ' text-brand-blue'
                                  : ' text-brand-dark-blue  hover:text-brand-blue',
                                'block px-1 pt-1  text-sm font-semibold leading-7 tracking-wider',
                              )}
                              aria-current={isCurrent ? 'page' : undefined}
                              // onClick={() => setCurrentLink(item)}
                            >
                              {item.screenName}
                            </a>
                          </Link>
                          <div className=" text-brand-blue font-semibold h-6">
                            |
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Home, FAQ  and Logout for Mobile  */}
                <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                  <SideIconNavigation />
                </div>
                {/* TODO: Uncomment Me: If user profile and notifications UI needs to be show Profile dropdown */}
                {/* <Menu as="div" className="ml-3 relative">
                  {({open}) => (
                    <>
                      <div>
                        <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          <span className="sr-only">Open user menu</span>
                          <img
                            className="h-8 w-8 rounded-full"
                            src={user.imageUrl}
                            alt=""
                          />
                        </Menu.Button>
                      </div>
                      <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items
                          static
                          className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                        >
                          {userNavigation.map(item => (
                            <Menu.Item key={item.name}>
                              {({active}) => (
                                <a
                                  href={item.href}
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700',
                                  )}
                                >
                                  {item.name}
                                </a>
                              )}
                            </Menu.Item>
                          ))}
                        </Menu.Items>
                      </Transition>
                    </>
                  )}
                </Menu> */}

                <div className="-mr-2 flex items-center sm:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="bg-white inline-flex items-center justify-center p-2 rounded-md text-brand-blue   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-blue">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            {/** Mobile Navigation menu */}
            <Disclosure.Panel className="sm:hidden">
              <div className="pt-2  divide-y divide-gray-100 ">
                {navigationLinks.map(item => {
                  const isCurrentLink = router.pathname.includes(item.path)
                  return (
                    <Link key={item.screenID} href={`/${item.path}`}>
                      <a
                        href={item.href}
                        className={classNames(
                          isCurrentLink
                            ? 'brand-light-gray-50  text-brand-blue  hover:bg-brand-light-gray-50'
                            : ' text-brand-dark-blue hover:bg-brand-light-gray-50  hover:text-brand-blue',
                          'block pl-3 pr-4 py-2  text-base font-medium font-tradegothic-bold capitalize',
                        )}
                        aria-current={
                          isCurrentLink ? item.screenName : undefined
                        }
                        // onClick={() => setCurrentLink(item)}
                      >
                        {item.screenName}
                      </a>
                    </Link>
                  )
                })}
              </div>

              {/** This is where the Home, FAQ  and Logout for Mobile Menu */}
              <div className="pt-2 pb-3 border-t border-gray-200">
                {/* TODO:FIXME: In case we want to display logged in users info,
                   Uncomment this code

                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.imageUrl}
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.name}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user.email}
                    </div>
                  </div>
                  <button className="ml-auto bg-white flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span className="sr-only">View notifications</span>
                    <BellIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div> */}
                <div className=" flex flex-row items-center space-x-4">
                  <SideIconNavigation />
                </div>
              </div>
            </Disclosure.Panel>
          </Fragment>
        )}
      </Disclosure>

      {/** Content Bar */}
      <div className="">
        {/* <header>
          <div className="max-w-8xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Dashboard
            </h1>
          </div>
        </header> */}
        <main>
          {navigationLinks.length > 0 && (
            <div className="max-w-8xl mx-auto sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          )}
        </main>
      </div>

      {/* TODO:FIXME: Enable when setting idle timer*/}
      {Object.keys(settings).length > 0 && <CustomIdleTimer />}
    </div>
  )
}

const SideIconNavigation = () => {
  const {logout} = useAuth0()
  const sideIconClassName =
    'bg-white p-1 rounded-full text-brand-dark-blue hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-blue'

  return (
    <Fragment>
      <Link href={HOMEPAGE}>
        <a className={sideIconClassName}>
          <HomeIcon className="h-6 w-auto" />
        </a>
      </Link>
      <Link href=" " passHref>
        <button
          type="button"
          className={sideIconClassName}
          onClick={() =>
            logout({
              returnTo:
                typeof 'window' !== 'undefined' && window.location.origin,
            })
          }
        >
          <XCircleIcon className="h-6 w-auto" />
        </button>
      </Link>
    </Fragment>
  )
}

const CustomIdleTimer = () => {
  const {logout} = useAuth0()
  const settings = useSettingstore(state => state.settings)

  const handleOnIdle = event => {
    console.log('user is idle', event, 'last active', getLastActiveTime())
    console.log('Logging user out...because of idleTimeout')
    logout({
      returnTo: typeof 'window' !== 'undefined' && window.location.origin,
    })
  }

  const handleOnActive = event => {
    // console.log('user is active', event)
    // console.log('time remaining', getRemainingTime())
  }

  const handleOnAction = event => {
    // console.log('user did something', event)
  }

  const {getRemainingTime, getLastActiveTime} = useIdleTimer({
    timeout: 1000 * 60 * parseInt(settings.loginTimeout),
    onIdle: handleOnIdle,
    onActive: handleOnActive,
    onAction: handleOnAction,
    debounce: 500,
    events: [
      'keydown',
      'wheel',
      'DOMMouseScroll',
      'mouseWheel',
      'mousedown',
      'touchstart',
      'touchmove',
      'MSPointerDown',
      'MSPointerMove',
    ],
  })

  return null
}

// TODO: In case user profile needs to be displayed get the value from ID token
// const user = {
//   name: 'Tom Cook',
//   email: 'tom@example.com',
//   imageUrl:
//     'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
// }

// const extraNavigation = [
//   {
//     name: 'Go Home',
//     href: '',
//     icon: <HomeIcon className="h-6 w-auto" />,
//     onClick: () => {
//       alert('home clicked')
//       Router.replace('/dashboard/')
//     },
//   },
//   // {name: 'Settings', href: '#', icon: <},
//   {
//     name: 'Sign out',
//     href: '',
//     icon: <XCircleIcon className="h-6 w-auto" />,
//     onClick: () => {},
//   },
// ]

// const navigation = [
//   {name: 'Dashboard', href: '#', current: true},
//   {name: 'Team', href: '#', current: false},
//   {name: 'Projects', href: '#', current: false},
//   {name: 'Calendar', href: '#', current: false},
// ]
