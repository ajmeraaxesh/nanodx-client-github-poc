import {Fragment, useMemo} from 'react'
import {Dialog, Disclosure, Transition} from '@headlessui/react'
import {useRouter} from 'next/router'
import Link from 'next/link'
import ReactLoading from 'react-loading'

import {SingleCalendar} from '@components/DatePickers'
import {formStates} from '@hooks/use-form-handing'

import {XCircleIcon, CheckCircleIcon, BellIcon} from '@heroicons/react/solid'
import {ArrowSmLeftIcon, ExclamationIcon, XIcon} from '@heroicons/react/outline'
import {COVIDTESTTYPE, HOMEPAGE, TBITESTTYPE} from '@lib/constants'
import {CUSTOMER, PORTAL} from '@lib/Strings'
import Table from './Table'

export const SubmitFormButton = ({
  submitButtonText = 'Save',
  currentForm,
  error,
  extraButtons = null,
  // can be 'start', 'center', 'around', 'evenly' and 'end'
  buttonsPosition = 'center',
}) => {
  const {formProcessingState} = currentForm

  return (
    <div>
      {formProcessingState === formStates.ERROR && (
        <OnError error={error.current} />
      )}

      {(formProcessingState === formStates.DEFAULT ||
        formProcessingState === formStates.ERROR ||
        formProcessingState === formStates.SUBMITTED) && (
        <div
          className={`flex flex-row justify-${buttonsPosition} items-center space-x-4`}
        >
          <button type="submit" className="btn">
            {(formProcessingState === formStates.DEFAULT ||
              formProcessingState === formStates.ERROR) &&
              submitButtonText}
            {formProcessingState === formStates.SUBMITTED && (
              <div className="flex flex-row space-x-2 cursor-wait">
                <svg
                  className=" animate-spin h-5 w-5 text-brand-light-blue group-hover:text-white transition ease-in-out duration-150"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing</span>
              </div>
            )}
          </button>
          {extraButtons !== null &&
            (formProcessingState === formStates.DEFAULT ||
              formProcessingState === formStates.ERROR) &&
            extraButtons}
        </div>
      )}

      {formProcessingState === formStates.SUCCESS && (
        <OnSuccess message="Success" />
      )}
    </div>
  )
}

export const DeleteModal = ({
  open,
  setOpen,
  headerTitle = '',
  message = '',
  onDelete = null,
}) => (
  <Transition.Root show={open} as={Fragment}>
    <Dialog
      as="div"
      static
      className="fixed z-10 inset-0 overflow-y-auto"
      open={open}
      onClose={setOpen}
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enterTo="opacity-100 translate-y-0 sm:scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 translate-y-0 sm:scale-100"
          leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
        >
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className="bg-white rounded-md text-brand-dark-blue hover:text-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-dark-blue"
                onClick={() => setOpen(false)}
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationIcon
                  className="h-6 w-6 text-red-600"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 font-medium text-brand-dark-blue"
                >
                  {headerTitle}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-brand-blue">{message}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium  font-tradegothic-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => {
                  if (onDelete) {
                    onDelete()
                  }
                  setOpen(false)
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Transition.Child>
      </div>
    </Dialog>
  </Transition.Root>
)

export const OnSuccess = ({message}) => {
  return (
    <div className="rounded-md bg-brand-light-green p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-brand-green" />
        </div>
        <p className="text-sm leading-5 font-medium text-brand-green">
          {message}
        </p>
      </div>
    </div>
  )
}

export const OnError = ({header = 'Error', error}) => {
  return (
    <div className="rounded-md bg-red-50 p-4 mb-2">
      <div className="flex items-center space-x-2">
        <XCircleIcon className="h-5 w-5 text-red-400" />
        <h3 className="text-sm leading-5 font-medium text-red-800">{header}</h3>
      </div>
      <div className="ml-4">
        <div className="mt-2 text-sm leading-5 text-red-700">
          <ul className="list-disc pl-5">
            {error.message ? <li>{error.message}</li> : <li>{error}</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

export const DetailsHeader = ({
  headerTitle,
  addonComponent = null,
  backButtonUrl = null,
}) => {
  return (
    <div className="flex justify-between">
      <BackButton url={backButtonUrl} />
      <div className="sm:text-center sm:align-middle">
        {typeof headerTitle === 'string' ? (
          <h1 className="text-brand-dark-blue">{headerTitle}</h1>
        ) : (
          {headerTitle}
        )}
      </div>
      {!addonComponent ? <div></div> : addonComponent}
    </div>
  )
}

export const BackButton = ({url, text = '', onClick = null}) => {
  const router = useRouter()
  const defaultOnClick = () => {
    if (url) {
      router.push(url)
    } else {
      router.back()
    }
  }

  return (
    <span className="rounded-md shadow-sm">
      <button
        className={`btn flex items-center space-x-2 px-2 py-1 text-brand-dark-blue `}
        onClick={onClick ? onClick : defaultOnClick}
      >
        <ArrowSmLeftIcon className="w-6 h-6" />
        {text ? <div>{text}</div> : null}
      </button>
    </span>
  )
}

export const AuditTrailButton = ({onClick}) => {
  return (
    <span className="inline-flex items-center rounded-md shadow-sm w-full ">
      <button
        onClick={() => onClick()}
        className="btn relative inline-flex items-center  w-full text-sm font-medium leading-5  tracking-wider"
      >
        <span className="mt-1">Audit Trail</span>
        <svg
          className=" ml-2 w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </span>
  )
}

export const NoticesButton = ({count = null, onClick}) => {
  // const displayCount = count > 10 ? '9' : '' + count
  return (
    <span className="sm:mt-3 inline-flex  rounded-md shadow-sm w-44">
      <button
        onClick={() => onClick()}
        className="btn relative inline-flex justify-center items-center w-full rounded-md"
      >
        <span className="text-brand-dark-blue">Notices</span>
        <NoticeBell count={count} />

        {/* <svg
                            className=" ml-2 w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg> */}
      </button>
    </span>
  )
}

export const NoticeBell = ({count, bellClassName = '', showCount = false}) => {
  const displayCount = count > 9 ? '9+' : '' + count
  return (
    <div className="relative">
      <BellIcon
        className={`ml-2 w-10 h-10 px-0 text-brand-blue ${bellClassName}`}
      />

      {count > 0 && (
        <Fragment>
          <span
            // className="absolute -top-2 right-0 block h-5 w-6 pt-0.5 -mr-1"
            className="absolute -top-1 right-1 block h-3 w-3"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-blue opacity-75" />
            <span
              className="relative inline-flex justify-center items-center rounded-full
                            h-3 w-3 bg-brand-dark-blue
                            font-montserrat-regular
                            text-[10px] text-white text-center
                             ring-2 ring-white"
            >
              {/* {displayCount || ''}
                <span className="inline-block mb-2">
                  {count > 10 ? '+' : ''}
                </span>*/}
            </span>
            {/**TODO:FIXME: Uncomment below to add the count in the circle */}
            {/**{displayCount || ''} */}
            {/**   rounded-full shadow-solid bg-brand-red
                            text-xs text-white text-center
                            font-montserrat-regular font-thin */}
          </span>
        </Fragment>
      )}
      {/** Display for count inside bell */}
      {showCount && (
        <span
          // className="absolute -top-2 right-0 block h-5 w-6 pt-0.5 -mr-1"
          className={`absolute top-[9px] ${
            displayCount === '9+' ? 'left-[21px]' : 'left-[24px]'
          } text-white font-medium top-`}
        >
          {displayCount}
        </span>
      )}
    </div>
  )
}

export const NameID = ({name, id}) => {
  return (
    <div className="flex items-center">
      {/* <div className="flex-shrink-0 h-6 w-6 rounded-full overflow-hidden bg-blue-100">
                <UserIcon className="h-full w-full text-brand-dark-blue" />
            </div> */}

      <div>
        <div className="text-xs leading-5 font-medium text-brand-dark-blue">
          {name}
        </div>
        <div className="text-xs leading-5 text-brand-blue">ID: {id}</div>
      </div>
    </div>
  )
}

export const ScreenHeader = ({children}) => (
  <h1 className="text-center text-2xl text-brand-dark-blue font-bold ">
    {children}
  </h1>
)

export const HeaderWithStartEndDates = ({
  headerTitle = '',
  children,
  start,
  startDateId = 'testStartId',
  startDatePlaceHolder = 'Start Date',
  startFocused,
  end,
  endDateId = 'testEndId',
  endFocused,
  endDatePlaceHolder = 'End Date',
}) => (
  <>
    {headerTitle && (
      <div className="flex items-center justify-center">
        <div className="h-8">
          <ScreenHeader>{headerTitle}</ScreenHeader>
        </div>
      </div>
    )}

    <div className="flex flex-col justify-between items-center md:justify-center md:flex-row py-1">
      <div className="mt-3 sm:mt-0 ">
        <span>
          <span className="mr-4">Start Date:</span>
          <SingleCalendar
            id={startDateId}
            dateInput={start}
            focusedInput={startFocused}
            placeholder={startDatePlaceHolder}
          />
        </span>
      </div>

      <div className="mt-3 sm:mt-0 ">
        <span>
          <span className="">End Date:</span>
          <SingleCalendar
            id={endDateId}
            dateInput={end}
            focusedInput={endFocused}
            disabled={!start.value}
            isOutsideRange={day => {
              return !day.isAfter(start.value)
            }}
            placeholder={endDatePlaceHolder}
          />
        </span>
      </div>
    </div>
    {children}
  </>
)

export const CartridgeImage = ({testType, imageClassName = ''}) => {
  let cartridgeImage = null
  let cartridgeImageAlt = null
  switch (testType) {
    case COVIDTESTTYPE:
      cartridgeImage = '/images/covid-cartridge.png'
      // '/images/covid-cartridge.png'
      cartridgeImageAlt = COVIDTESTTYPE
      break
    case TBITESTTYPE:
    default:
      cartridgeImage = '/images/tbit-cartridge.png'
      // '/images/tbit-cartridge.png'
      cartridgeImageAlt = TBITESTTYPE
  }

  return (
    <img
      className={`h-auto w-6 ${imageClassName}`}
      src={cartridgeImage}
      alt={cartridgeImageAlt}
    />
  )
}

export const CountBadge = ({value}) => (
  <div style={{width: '4em', marginLeft: '1.5em'}}>
    <span className="inline-block py-0.5 px-3 text-xs leading-4 rounded-full bg-blue-100 text-brand-dark-blue font-tradegothic-bold group-focus:bg-blue-200 transition ease-in-out duration-150">
      {value}
    </span>
  </div>
)

export const FixSizeBadge = ({text, color, className = ''}) => (
  <div
    className={`rounded-full px-2 text-xs tracking-wider font-medium leading-6 text-center  capitalize ${color} ${className}`}
  >
    {text}
  </div>
)

export const CardFooter = ({children}) => (
  <div className="border-t border-gray-200 px-4 py-4 sm:px-6 ">
    {/* Content goes here
     *   We use less vertical padding on card footers at all sizes than on headers or body sections
     */}
    {children}
  </div>
)

export const CardBody = ({children}) => (
  <div className="px-4 py-5 sm:p-6">
    {/* Content goes here */}
    {children}
  </div>
)

export const CardHeader = ({children}) => (
  <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
    {/* Content goes here
            We use less vertical padding on card headers on desktop than on body sections
             */}
    {children}
  </div>
)

export const Card = ({children}) => (
  <div className="bg-white overflow-hidden shadow rounded-lg max-w-2xl mx-auto">
    {children}
  </div>
)

export const ErrorFallback = ({error, componentStack, resetErrorBoundary}) => {
  return (
    <div className="rounded-md bg-red-100 p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="mt-2 text-sm leading-5 text-red-700">
          <ul className="list-disc pl-5">
            <li>
              <pre>{error.message ? error.message : error}</pre>
            </li>
            <li>
              <pre>{componentStack}</pre>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export const UnAuthorizedAccess = () => {
  return (
    <div className="rounded-md bg-red-50 p-4 mb-2">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <ExclamationIcon
            className="h-5 w-5 text-red-400"
            aria-hidden="true"
          />
        </div>

        <h3 className="text-sm leading-5 font-medium text-red-800">
          UnAuthorized Access to the current page
        </h3>
      </div>
    </div>
  )
}

export const Loading = () => {
  return (
    <div className="flex justify-center items-center space-x-4">
      <div>Loading</div>
      <ReactLoading type="bubbles" color={'#005d7d'} height={64} width={64} />
    </div>
  )
}
export const ListLoading = () => <Loading />

// const TableLoading = () => {
//    const emptyData = Array(5).fill({
//      column1: '',
//      column2: '',
//      column3: '',
//      column4: '',
//      column5: '',
//    })

//    const data = useMemo(() => emptyData, [emptyData])
//    const tableColumns = useListloadingColumns()
//    const columns = useMemo(() => tableColumns.columns, [tableColumns])
//    const initialState = tableColumns.initialState
//    return (
//      <Table
//        columns={columns}
//        data={data}
//        initialState={initialState}
//        rowHeight={75}
//        searchPlaceHolderText={' '}
//      />
//    )
// }

// const BlinkingData = () => (
//   <div className="animate-pulse h-4 w-20 bg-brand-blue rounded" />
// )

// const useListloadingColumns = () => {
//   const column1Obj = {
//     Header: () => <BlinkingData />,
//     accessor: 'column1',
//     Cell: () => <BlinkingData />,
//   }

//   const column2Obj = {
//     ...column1Obj,
//     accessor: 'column2',
//   }

//   const column3Obj = {
//     ...column1Obj,
//     accessor: 'column3',
//   }
//   const column4Obj = {
//     ...column1Obj,
//     accessor: 'column4',
//   }
//   const column5Obj = {
//     ...column1Obj,
//     accessor: 'column5',
//   }
//   const columns = [column1Obj, column2Obj, column3Obj, column4Obj, column5Obj]

//   return {
//     columns,
//     initialState: {},
//   }
// }

export const AuthenticationLoading = () => {
  return (
    <Fragment>
      <Disclosure as="nav" className="bg-white border-b border-gray-200">
        {({open}) => (
          <Fragment>
            <div className="max-w-8xl mx-auto px-4 sm:px-6">
              <div className="flex justify-between h-12 sm:h-16">
                {/** Left Company Icon */}
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
                </div>
                {/** Loaders
              <div className="hidden animate-pulse sm:-my-px sm:ml-12 sm:flex sm:space-x-2 sm:items-center">
                {Array(5)
                  .fill(null)
                  .map((u, i) => {
                    return (
                      <div key={i} className="flex items-center space-x-2">
                        <div className="h-4 w-20 bg-brand-blue rounded">
                          {'  '}
                        </div>
                        <div className="text-brand-blue font-semibold h-6">
                          |
                        </div>
                      </div>
                    )
                  })}
              </div>
              */}

                <div></div>
              </div>
            </div>
          </Fragment>
        )}
      </Disclosure>
      <main>
        <div className="flex justify-center items-center space-x-4">
          <div>Authenticating</div>
          <ReactLoading
            type="bubbles"
            color={'#005d7d'}
            height={64}
            width={64}
          />
        </div>
      </main>
    </Fragment>
  )
}
