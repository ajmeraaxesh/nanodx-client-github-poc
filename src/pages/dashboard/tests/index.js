import {useMemo, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {useRouter} from 'next/router'
// import Image from 'next/image'

import useScreenSize from '@hooks/use-screen-size'
import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {
  TEST_HEADER,
  TEST_START_DATE,
  TEST_END_DATE,
  TABLE_DATE_TIME_HEADER,
  TABLE_PATIENT_INFO_HEADER,
  TABLE_TEST_INFO_HEADER,
  TABLE_DEVICE_INFO_HEADER,
  TABLE_RESULTS_HEADER,
  TABLE_USER_ID_HEADER,
  TABLE_LOCATION_HEADER,
  SEARCH_PLACEHOLDER_TESTS,
} from '@lib/Strings'

import {getRedirecting} from '@lib/utils'
import create from 'zustand'
import moment from 'moment-timezone'
import {
  APIDATEFORMAT,
  DATETIMEDISPLAYFORMAT,
  TESTSCONTROLNAME,
  TESTINDEX,
  DEFAULTTIMEZONE,
  COVIDTESTTYPE,
  TBITESTTYPE,
  REDBACKGROUND_WITH_DARKREDTEXT,
  GREENBACKROUND_WITH_DARKGREENTEXT,
  NEUTRALBACKGROUND_WITH_NEUTRALTEXT,
} from '@lib/constants'
import {
  UnAuthorizedAccess,
  ErrorFallback,
  HeaderWithStartEndDates,
  OnError,
  ListLoading,
  NameID,
  FixSizeBadge,
  CartridgeImage,
} from '@components/CommonComponents'
import {FileDownload} from '@components/ExcelFileDownload'
import Table from '@components/Table'
import DashboardShell from '@components/DashboardShell'
import shallow from 'zustand/shallow'
import {ErrorBoundary} from 'react-error-boundary'
import useInput from '@hooks/use-input'
import useDateTimeFormat from '@hooks/use-date-time-formats'

// import covidCartridge from '@images/covid-cartridge.png'
// import tbitCartridge from '@images/tbit-cartridge.png'

const useTestDateStore = create(set => ({
  startDate: moment().subtract(7, 'days'),
  endDate: moment(),
  setStartDate: value => set({startDate: moment(value)}),
  setEndDate: value => set({endDate: moment(value)}),
  updateDate: (dateType, value) => {
    if (dateType === 'start') {
      return set({
        startDate: moment(value),
      })
    } else {
      return set({
        endDate: moment(value),
      })
    }
  },
}))

// const useDateInput = (initialValue, type) => {
//   const [value, setValue] = useState(initialValue)
//   const updateDate = useTestDateStore(state => state.updateDate)
//   //TODO:FIXME: Calling the settings store with current dateFormat

//   const handleChange = date => {
//     setValue(date)

//     //TODO:FIXME: Replace the DATEDISPLAYFORMAT with
//     updateDate(type, moment(value).format(DATEDISPLAYFORMAT))
//   }

//   return {
//     value,
//     setValue: handleChange,
//   }
// }

const TestsList = props => {
  console.log('TestList:: Props:: ', props)
  const {userScreenAccess} = useValidatePermissions(TESTSCONTROLNAME)

  if (!userScreenAccess) {
    return (
      <DashboardShell>
        <UnAuthorizedAccess />
      </DashboardShell>
    )
  }

  // TODO: FIXME: Call Next Router useEffect for when Navigating to a different page
  // and unsusbcribe the settings dateFormat subscription in order to avoid memoryLeaks

  console.log('TestList::  rendering')
  return (
    <DashboardShell>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestHeader />
        <TestData />
      </ErrorBoundary>
    </DashboardShell>
  )
}

const TestHeader = () => {
  const [startDate, setStartDate, endDate, setEndDate] = useTestDateStore(
    state => [
      state.startDate,
      state.setStartDate,
      state.endDate,
      state.setEndDate,
    ],
    shallow,
  )

  const startFocusedInput = useInput(null)
  const endFocusedInput = useInput(null)

  console.log({startDate}, {endDate})
  return (
    <HeaderWithStartEndDates
      // headerTitle={TEST_HEADER}
      start={{value: startDate, setValue: setStartDate}}
      startFocused={startFocusedInput}
      startDateId="patientTestStart"
      startDatePlaceHolder={TEST_START_DATE}
      end={{value: endDate, setValue: setEndDate}}
      endFocused={endFocusedInput}
      endDateId="patientTestEnd"
      endDatePlaceHolder={TEST_END_DATE}
    />
  )
}

export const TestData = () => {
  const [startDate, endDate] = useTestDateStore(
    state => [state.startDate, state.endDate],
    shallow,
  )
  const testDataUrl = `PatientTest?startDate=${startDate.format(
    APIDATEFORMAT,
  )}&&endDate=${endDate.format(APIDATEFORMAT)}`
  const {data: patientTestData, error: patientTestError} = useDataLib([
    testDataUrl,
  ])

  let processedPatientData = null

  // TODO:FIXME: set the condition when the data exists and its of 0 length

  if (patientTestData && patientTestData.length > 0) {
    processedPatientData = patientTestData.map(patient => {
      const {facilityPatientKey} = patient
      const [facilityId, patientId] = facilityPatientKey.split('_')

      return {
        ...patient,
        facilityId,
        patientId,
      }
    })
  } else if (patientTestData && patientTestData.length === 0) {
    processedPatientData = []
  }

  return (
    <>
      {patientTestError && <OnError error={patientTestError} />}
      {!processedPatientData && !patientTestError && <ListLoading />}
      {processedPatientData && <TestsGrid data={processedPatientData} />}
    </>
  )

  // return <TestsGrid data={dummyTestData} />
}

const TestsGrid = ({data}) => {
  const {edit} = useValidatePermissions(TESTSCONTROLNAME)
  console.log('TestGrid: ', edit)
  const router = useRouter()

  const testData = useMemo(() => data, [data])
  const tableColumns = useTestTableColumns()

  const handleDetailCLick = testId => {
    router.push(`${TESTINDEX}/${testId}`)
  }

  const handleDocumentDownloadClick = rows => {
    //FIXME: 'testResults' is not received from the server via API call
    const originalColumns = [
      'analysisStartTime',
      'patientName',
      'facilityPatientKey',
      'testTypeDisplayText',
      'cartridgeID',
      'outcome',
      'handheldSerialNumber',
      'analyzerSerialNumber',
      'facilityName',
      'deviceUserKey',
      //'notices',
    ]
    //console.log('Excel rows:: ', rows, 'excelColumns:: ', excelColumns)
    const columnNames = [
      'Date & Time',
      'Patient Name',
      'Patient ID',
      'Test Type',
      'Catridge ID',
      'Test Results',
      'Handheld Serial Number',
      'Analyzer Serial Number',
      'Location',
      'User',
      //'Notices',
    ]
    //getExcelColumnHeaders(excelColumns)
    const accessorColumns = ['analysisStartTime', 'outcome']

    // The third parameter the column where the data is modified for displayed purposes
    // or modified because of settings
    // const rowData = getRowDataUsingOriginalValues(
    //     originalColumns,
    //     rows,
    //     accessorColumns
    // )
    const excelRows = () => {
      return rows.map(row => {
        let rowData = originalColumns.map(column => {
          //console.log('getRowDataUsingOriginalValues:: ', row)

          if (accessorColumns && accessorColumns.indexOf(column) > -1) {
            switch (column) {
              case 'analysisStartTime':
                //TODO:FIXME: Set the datetime format as per
                return `${moment(parseInt(row.values[column]))
                  .utc()
                  .tz(`${DEFAULTTIMEZONE}`)
                  .format(`${DATETIMEDISPLAYFORMAT}`)}`
              case 'outcome':
                if (row.original.testType === COVIDTESTTYPE) {
                  return row.original.outcome
                } else if (row.original.testType === TBITESTTYPE) {
                  const tbiResult = row.original.outcome.toLowerCase()
                  if (tbiResult === 'positive') {
                    return 'CT Scan'
                  } else if (tbiResult === 'negative') {
                    return 'No CT Scan'
                  } else {
                    return row.original.outcome
                  }
                }
                break
              default:
                return row.values[column]
            }
          }
          return row.original[column] || ''
        })
        return rowData
      })
    }

    FileDownload(excelRows(), columnNames, {
      filename: `Patient Test`,
      header: 'patient test list',
      sheetname: `patienttest`,
    })
  }

  // TODO: for columnHiding useMediaQuery hook and react-table setups for column hiding
  // TODO: same for filtering and setting column widths to be used in column Resizing and
  //       column ordering

  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  return (
    <Table
      columns={columns}
      data={testData}
      initialState={initialState}
      onRowClick={handleDetailCLick}
      onDocumentDownloadClick={edit ? handleDocumentDownloadClick : null}
      rowHeight={75}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_TESTS}
    />
  )
}

const useTestTableColumns = () => {
  //const largeScreen = useMediaType()
  const screenSize = useScreenSize()
  const {formatTime} = useDateTimeFormat()
  //console.log('TestColumns:: currentDateFormat:: ', dateTimeFormats)

  const dateTimeObj = {
    Header: TABLE_DATE_TIME_HEADER,
    id: 'analysisStartTime',

    // Using the patient scan time as the handheld app displays patient scan time in final result
    // in case the analysis time wasn't sent across?
    accessor: d => {
      const analysisTime = d.patientScanTime
        ? d.patientScanTime
        : d.analysisStartTime

      return moment(analysisTime).format('x')
    },
    Cell: function cellFunc({value}) {
      const intValue = parseInt(value)

      //TODO:FIXME: Get the data from the settings store
      const formattedValue = formatTime(intValue)
      const [date, ...rest] = formattedValue.split(' ')
      // const fullTime = timeZone !== undefined ? time + ' ' + timeZone : time
      return (
        <div>
          <div>{date}</div>
          <div>{rest.join(' ')}</div>
        </div>
      )
    },
    width: 140,
  }

  // const patientNameObj = {
  //     Header: 'Patient Name',
  //     accessor: 'patientName',
  //     width: 150,
  // }
  // const patientIDObj = {
  //     Header: 'Patient ID',
  //     accessor: 'facilityPatientKey',
  //     width: 120,
  // }

  const patientInfoObj = {
    Header: TABLE_PATIENT_INFO_HEADER,
    id: 'patientInfo',
    accessor: d => {
      return d.patientName + '___' + d.facilityPatientKey
    },
    Cell: function cellFunc({value}) {
      let [patientName, patientID] = value.split('___')
      return (
        <div className="whitespace-normal">
          <NameID name={patientName} id={patientID} />
        </div>
      )
    },
    width: 180,
  }

  // const cartridgeIdObj = {
  //     Header: 'Cartridge ID',
  //     accessor: 'cartridgeID',
  //     width: 150,
  //     Cell: ({ value }) => (
  //         <div className="whitespace-normal break-words">{value}</div>
  //     ),
  // }

  //TODO:FIXME: Add different test types outcome as results comeby
  const testResultsObj = {
    Header: TABLE_RESULTS_HEADER,
    accessor: 'outcome',
    Cell: function cellFunc({row, value}) {
      let currentTestType = row.original.testType
      let resultClassName = ''
      let resultText = null
      switch (currentTestType) {
        case COVIDTESTTYPE:
          resultText = value.toLowerCase()
          if (resultText === 'positive') {
            resultClassName = REDBACKGROUND_WITH_DARKREDTEXT
          } else if (resultText === 'negative') {
            resultClassName = GREENBACKROUND_WITH_DARKGREENTEXT
          } else {
            resultClassName = NEUTRALBACKGROUND_WITH_NEUTRALTEXT
          }
          break
        case TBITESTTYPE:
        default:
          value = value.toLowerCase()
          if (value === 'positive') {
            resultClassName = GREENBACKROUND_WITH_DARKGREENTEXT
            resultText = 'CT Scan'
          } else if (value === 'negative') {
            resultClassName = REDBACKGROUND_WITH_DARKREDTEXT
            resultText = 'No CT Scan'
          } else {
            resultClassName = NEUTRALBACKGROUND_WITH_NEUTRALTEXT
            resultText = value
          }
      }

      return <FixSizeBadge color={`${resultClassName}`} text={resultText} />
    },
    width: 150,
  }

  const testInfoObj = {
    Header: TABLE_TEST_INFO_HEADER,
    id: 'testInfo',
    accessor: d => {
      return d.cartridgeID + '___' + d.testType + '___' + d.testTypeDisplayText
    },
    Cell: function cellFunc({value}) {
      let [cartridgeID, testType, testTypeDisplayText] = value.split('___')

      return (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 h-auto w-6 rounded-full">
            <CartridgeImage
              testType={testType}
              imageClassName="h-auto w-6 rounded-full"
            />
            {/* <img
              className="h-auto w-6 rounded-full"
              src={cartridgeImage}
              alt={cartridgeImageAlt}
            /> */}
            {/* <Image
              src={cartridgeImage}
              alt={cartridgeImageAlt}
              placeholder="blur"
            /> */}
          </div>
          <div className=" whitespace-normal">
            <div className="text-xs leading-5 font-medium">
              {testTypeDisplayText}
            </div>
            <div className="text-xs leading-5 text-brand-blue">
              <dt>Cartridge ID:</dt>
              <dd>{cartridgeID}</dd>
            </div>
          </div>
        </div>
      )
    },
    width: 200,
  }

  const deviceInfoObj = {
    Header: TABLE_DEVICE_INFO_HEADER,
    accessor: d => {
      return d.handheldSerialNumber + '___' + d.analyzerSerialNumber
    },
    Cell: function cellFunc({value}) {
      const [deviceSerial, analyzerSerial] = value.split('___')
      return (
        <div className="text-brand-blue whitespace-normal">
          <dt>Handheld: {deviceSerial}</dt>
          <dd>Analyzer: {analyzerSerial}</dd>
        </div>
      )
    },
  }

  const userIdObj = {
    Header: TABLE_USER_ID_HEADER,
    accessor: d => {
      return d.deviceUserKey
      //return d.deviceUserKey+"___"+d.deviceKey
    },
    Cell: function cellFunc({value}) {
      //const [userId, deviceId] = value.split('___')
      const userId = value
      return (
        <div className="whitespace-normal">
          <dt>{userId}</dt>
          {/* <dd className="hidden">{deviceId}</dd> */}
        </div>
      )
    },
    width: 140,
  }

  const locationObj = {
    Header: TABLE_LOCATION_HEADER,
    accessor: 'facilityName',

    Cell: function cellFunc({value}) {
      return <div className="whitespace-normal">{value}</div>
    },
    width: 180,
  }

  const moreObj = {
    Header: () => '',
    id: 'More',
    accessor: d => d.patientTestID,
    disableSortBy: true,
    width: 10,
    Cell: function cellFunc() {
      return <Fragment />
    },
  }

  const largeScreenColumns = [
    {
      ...dateTimeObj,
    },
    {
      ...patientInfoObj,
    },
    {
      ...testInfoObj,
    },
    {
      ...testResultsObj,
    },
    {
      ...deviceInfoObj,
    },
    {
      ...locationObj,
    },
    {
      ...userIdObj,
    },

    // {
    //     Header: 'Notices',
    //     accessor: '',
    //     width: 60,
    // },
    {
      ...moreObj,
    },
  ]

  const midScreenColumns = [
    {
      ...dateTimeObj,
    },
    {
      ...patientInfoObj,
    },
    {
      ...testInfoObj,
    },
    {
      ...testResultsObj,
    },
    {
      ...moreObj,
    },
  ]

  const smallScreenColumns = [
    {
      ...dateTimeObj,
    },
    {
      ...patientInfoObj,
    },
    {
      ...testInfoObj,
    },
    {
      ...moreObj,
    },
  ]

  const initialState = {
    sortBy: [
      {
        id: 'analysisStartTime',
        desc: true,
      },
    ],
  }

  let columns = largeScreenColumns
  switch (screenSize) {
    case 'sm':
      columns = smallScreenColumns
      break
    case 'md':
      columns = midScreenColumns
      break
    case 'lg':
    case 'xl':
      columns = largeScreenColumns
      break
    default:
      break
  }

  return {
    columns,
    initialState,
  }
}

export default withAuthenticationRequired(TestsList, getRedirecting(TESTINDEX))
