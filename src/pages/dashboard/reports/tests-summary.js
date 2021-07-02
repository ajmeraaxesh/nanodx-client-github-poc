import {useMemo, Fragment} from 'react'
import moment from 'moment-timezone'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {ErrorBoundary} from 'react-error-boundary'
import {useAuth0} from '@auth0/auth0-react'

import {
  HeaderWithStartEndDates,
  OnError,
  ErrorFallback,
  ListLoading,
  FixSizeBadge,
  NameID,
  UnAuthorizedAccess,
  CartridgeImage,
} from '@components/CommonComponents'

import Table from '@components/Table'

import FileDownload from '@components/ExcelFileDownload'

import useInput from '@hooks/use-input'
import useDataLib from '@hooks/use-data-lib'
import useScreenSize from '@hooks/use-screen-size'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {getRedirecting, isBrowser} from '@lib/utils'
import DashboardShell from '@components/DashboardShell'

import {
  REPORTSCONTROLNAME,
  APIDATEFORMAT,
  GREENBACKROUND_WITH_DARKGREENTEXT,
  REDBACKGROUND_WITH_DARKREDTEXT,
  NEUTRALBACKGROUND_WITH_NEUTRALTEXT,
  COVIDTESTTYPE,
  TBITESTTYPE,
  ELECTRONICQCTESTDISPLAYTEXT,
} from '@lib/constants'
import {
  TABLE_DATE_TIME_HEADER,
  TABLE_TEST_INFO_HEADER,
  TABLE_TEST_RESULT_HEADER,
  TABLE_ANALYTES_HEADER,
  TABLE_LOCATION_HEADER,
  TABLE_PATIENT_INFO_HEADER,
  TABLE_DEVICE_INFO_HEADER,
} from '@lib/Strings'

import useDateTimeFormat from '@hooks/use-date-time-formats'

const TestReportSummary = () => {
  const userScreenAccess = useValidatePermissions(REPORTSCONTROLNAME)
  const {user} = useAuth0()
  const userRole = user[`${process.env.NEXT_PUBLIC_SERVER_URL}/userRole`]
  const startDateInput = useInput(moment().subtract(7, 'days'))
  const startDateFocused = useInput(null)
  const endDateInput = useInput(moment())
  const endDateFocused = useInput(null)

  const testTypeInput = useInput(() => {
    switch (userRole) {
      case 'QC Manager':
        return 'qc'
      case 'Reviewer':
        return 'patient'
      default:
        return 'all'
    }
  })

  if (!userScreenAccess) {
    return (
      <DashboardShell>
        <UnAuthorizedAccess />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <TestsReportHeader
          start={startDateInput}
          startFocused={startDateFocused}
          startDateId="reportStart"
          startDatePlaceHolder="Report Start Date"
          end={endDateInput}
          endFocused={endDateFocused}
          endDateId="reportEnd"
          endDatePlaceHolder="Report End Date"
          type={testTypeInput}
        />
        <TestReportBody
          start={startDateInput.value}
          end={endDateInput.value}
          type={testTypeInput.value}
        />
      </ErrorBoundary>
    </DashboardShell>
  )
}

const TestsReportHeader = ({type, ...props}) => {
  return (
    <div className="flex flex-col justify-between items-center md:justify-center md:flex-row md:space-x-2  py-3">
      <HeaderWithStartEndDates
        //  headerTitle={'Tests Summary'}
        {...props}
      />
      <div className=" ">
        <span>
          <span className="">Test Type:</span>
        </span>
        <div>
          <select
            className="form-select block w-full py-3"
            onChange={e => type.setValue(e.target.value)}
            value={type.value}
          >
            <option value="all">All Tests</option>
            <option value="patient">Patient Tests</option>
            <option value="qc">QC Tests</option>
          </select>
        </div>
      </div>
    </div>
  )
}

const TestReportBody = ({start, end, type}) => {
  const testUrl = `patienttest/summary?startdate=${start.format(
    APIDATEFORMAT,
  )}&enddate=${end.format(APIDATEFORMAT)}`
  console.log('TestReportUrl: ', testUrl)

  const {data: allTestsReportSummaryData, error: allTestsReportSummaryError} =
    useDataLib([testUrl])

  let filteredData = allTestsReportSummaryData
  if ((type === 'qc' || type === 'patient') && filteredData) {
    filteredData = allTestsReportSummaryData.filter(test =>
      test.patientQCTest.toLowerCase().includes(type),
    )
  }

  return (
    <Fragment>
      {allTestsReportSummaryError && (
        <OnError error={allTestsReportSummaryError} />
      )}
      {!filteredData && !allTestsReportSummaryError && <ListLoading />}
      {filteredData && <TestReportGrid data={filteredData} />}
    </Fragment>
  )
}

const TestReportGrid = ({data}) => {
  const {formatTime} = useDateTimeFormat()

  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'AllTestsReports:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )
    const allTestsReportExcelColumns = [
      'analysisStartTime',
      'patientQCTest',
      'testResult',
      'analytes',
      'devicePatientID',
      'patientName',
      'cartridgeID',
      'handheldSerialNumber',
      'analyzerSerialNumber',
      'facilityName',
      'noticeCount',
    ]

    const excelColumnHeader = [
      'Date & Time',
      'Test Type',
      'Test Result',
      'Analytes',
      'Patient ID',
      'Patient Name',
      'Cartridge ID',
      'Handheld Serial',
      'Analyzer Serial',
      'Location',
      'Notices',
    ]

    const accessorColumns = [
      'analysisStartTime',
      'patientQCTest',
      'testResult',
      'analytes',
      'noticeCount',
    ]

    const columnNames = excelColumnHeader
    // const rowData = getRowDataUsingOriginalValues(
    //     allTestsReportExcelColumns,
    //     rows,
    //     accessorColumns
    // )
    // const columnNames = getExcelColumnHeaders(excelColumns)
    // const rowData = getRowDataUsingAccessor(excelColumns, rows)

    const excelRows = () => {
      return rows.map(row => {
        let rowData = allTestsReportExcelColumns.map(column => {
          if (accessorColumns && accessorColumns.indexOf(column) > -1) {
            // Added switch cases for values where, exact use-cases do not exist
            switch (column) {
              case 'patientQCTest':
                return `${row.original['patientQCTest']}  ${
                  row.original['patientQCTest'] !== ELECTRONICQCTESTDISPLAYTEXT
                    ? `- ${row.original['testTypeDisplayText']}`
                    : ''
                }`
              case 'analysisStartTime':
                const intValue = parseInt(row.values[column])
                const formattedValue = formatTime(intValue)

                return formattedValue
              default:
                return row.values[column]
            }
          }

          return row.original[column] || ''
        })
        return rowData
      })
    }

    //console.log('All Tests:: ', excelRows())

    FileDownload(excelRows(), columnNames, {
      filename: `alltests`,
      header: 'all tests reports list',
      sheetname: `all tests reports`,
    })
  }

  const testData = useMemo(() => data, [data])
  const tableColumns = useAllTestsReportsTableColumns()

  //TODO: same for filtering and setting column widths to be used in column Resizing and
  //      column ordering
  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  return (
    <Table
      columns={columns}
      data={testData}
      initialState={initialState}
      onDocumentDownloadClick={handleDocumentDownloadClick}
      rowHeight={90}
    />
  )
}

const useAllTestsReportsTableColumns = () => {
  const screenSize = useScreenSize()
  const {formatTime} = useDateTimeFormat()
  //console.log('TestColumns:: currentDateFormat:: ', dateTimeFormats)

  const dateTimeObj = {
    Header: TABLE_DATE_TIME_HEADER,
    id: 'analysisStartTime',
    //TODO: use the date component that will be set as per timezone
    // 'MM/DD/YYYY HH:MM:ss'
    accessor: d => {
      let dateTime = ''
      if (d.patientQCTest.toLowerCase() === 'patient') {
        dateTime = d.patientScanTime ? d.patientScanTime : d.analysisStartTime
      } else {
        dateTime = d.analysisStartTime
          ? d.analysisStartTime
          : d.cartridgeScanTime
      }
      return moment(dateTime).format('x')
    },
    Cell: function cellFunc({value}) {
      const intValue = parseInt(value)

      const formattedValue = formatTime(intValue)
      const [date, time, timeZone] = formattedValue.split(' ')
      const fullTime = timeZone !== undefined ? time + ' ' + timeZone : time
      return (
        <div>
          <div>{date}</div>
          <div>{fullTime}</div>
        </div>
      )
    },

    width: 120,
  }

  const testInfoObj = {
    Header: TABLE_TEST_INFO_HEADER,
    id: 'testInfo',
    accessor: d => {
      return (
        d.patientQCTest +
        '___' +
        d.testType +
        '___' +
        d.cartridgeID +
        '___' +
        d.testTypeDisplayText
      )
    },
    Cell: function cellFunc({value}) {
      let [patientQC, testType, cartridgeID, testTypeDisplayText] =
        value.split('___')

      return (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-6">
            <CartridgeImage
              testType={testType}
              imageClassName="h-auto w-6 rounded-full"
            />
          </div>
          <div className="ml-4 whitespace-normal">
            <div className="text-xs leading-5 font-medium">{patientQC}</div>

            {patientQC !== ELECTRONICQCTESTDISPLAYTEXT ? (
              <div className="text-xs leading-5 text-brand-blue">
                Test: {testTypeDisplayText}
              </div>
            ) : null}

            <div className="text-xs leading-5 text-brand-blue">
              Cartridge: {cartridgeID}
            </div>
          </div>
        </div>
      )
    },
    width: 230,
  }

  // const testTypeObj = {
  //     Header: 'Test Type',
  //     accessor: 'patientQCTest',
  //     width: 80,
  // }

  //TODO:FIXME: Fix the outcome for QC Tests and see if the testType also plays a role
  // in show the testOutcome for QC based tests or a general is applicable for QCTests
  // in case of not pass fail
  const testResultObj = {
    Header: TABLE_TEST_RESULT_HEADER,
    id: 'testResult',
    accessor: d => {
      return d.testResult || '-'
    },
    Cell: function cellFunc({row, value}) {
      const patientQCTest = row.original.patientQCTest
      const currentTestType = row.original.testType
      let resultClassName = ''

      value = value.toLowerCase()

      // if (!patientQCTest) {
      //     console.log('Original Row:: ', row)
      // }

      if (patientQCTest.toLowerCase() === 'patient') {
        switch (currentTestType) {
          case COVIDTESTTYPE:
            if (value === 'positive') {
              resultClassName = REDBACKGROUND_WITH_DARKREDTEXT
            } else if (value === 'negative') {
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
            } else if (value === 'negative') {
              resultClassName = REDBACKGROUND_WITH_DARKREDTEXT
            } else {
              resultClassName = NEUTRALBACKGROUND_WITH_NEUTRALTEXT
            }
            break
        }
      } else {
        /**
         * It is a QC Test so different TestTypes like (TBI or COVID) do not matter
         *  when displaying result
         */
        switch (value) {
          case 'pass':
            resultClassName = GREENBACKROUND_WITH_DARKGREENTEXT
            break
          case 'fail':
            resultClassName = REDBACKGROUND_WITH_DARKREDTEXT
            break
          default:
            resultClassName = NEUTRALBACKGROUND_WITH_NEUTRALTEXT
        }
      }
      return <FixSizeBadge color={`${resultClassName}`} text={value} />
    },
    width: 120,
  }

  const analytesObj = {
    Header: TABLE_ANALYTES_HEADER,
    id: 'analytes',
    accessor: d => {
      // console.log('ReportAll: Analytes: ', typeof d.analytes)
      // console.log(
      //     'Analytes:: ',
      //     d.testType === 'TBI'
      //         ? Object.keys().map(
      //               (parameter) => {
      //                   return `${parameter.toUpperCase()}: ${
      //                       d.analytes[parameter]
      //                   }`
      //               }
      //           )
      //         : null
      // )

      if (d.analytes.length === 0) {
        return d.analytes
      }

      switch (d.testType) {
        case 'TBI':
          // console.log(
          //     'type:: ',
          //     typeof d.analytes,
          //     'analytes: ',
          //     d.analytes
          // )
          let obj = JSON.parse(JSON.stringify(d.analytes))
          //console.log('type:: ', typeof obj, 'obj:: ', obj)
          if (typeof obj !== 'object') {
            return d.analytes
          }
          let value = Object.keys(obj).map(parameter => {
            return `${parameter.toUpperCase()}: ${obj[parameter]}`
          })
          return value.join(',')
        default:
          return d.analytes
      }
    },
    Cell: function cellFunc({row, value}) {
      if (row.original.testType === 'TBI') {
        let values = value.split(',')
        return (
          <div className="flex-col flex-wrap whitespace-normal">
            {values.map(cellValue => (
              <div key={row.original.cartridgeID} className="text-xs  ">
                {cellValue}
              </div>
            ))}
          </div>
        )
      }
      return <div className="text-xs whitespace-normal ">{value}</div>
    },
    width: 150,
  }

  const locationObj = {
    Header: TABLE_LOCATION_HEADER,
    accessor: 'facilityName',
    width: 180,
    Cell: function cellFunc({value}) {
      return <div className="whitespace-normal">{value}</div>
    },
  }

  const patientInfoObj = {
    Header: TABLE_PATIENT_INFO_HEADER,
    id: 'devicePatientID',
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
    width: 220,
  }

  const deviceInfoObj = {
    Header: TABLE_DEVICE_INFO_HEADER,
    id: 'deviceInfo',
    accessor: d => {
      return d.analyzerSerialNumber + '___' + d.deviceKey
    },
    Cell: function cellFunc({value}) {
      const [analyzerSerial, deviceSerial] = value.split('___')
      return (
        <div className="text-brand-blue whitespace-normal">
          <dt>Handheld: {deviceSerial}</dt>
          <dd>Analyzer: {analyzerSerial}</dd>
        </div>
      )
    },
  }

  // const cartridgeIdObj = {
  //     Header: 'Cartridge ID',
  //     accessor: 'cartridgeID',
  //     width: 150,
  // }

  const largeScreenColumns = [
    {
      ...dateTimeObj,
    },
    {
      ...testInfoObj,
    },
    {
      ...testResultObj,
    },
    {
      ...analytesObj,
    },

    // {
    //     Header: 'Patient Name',
    //     accessor: 'patientName',
    //     width: 180,
    // },

    {
      ...patientInfoObj,
    },

    // {
    //     Header: 'Analyzer Serial',
    //     accessor: 'analyzerSerialNumber',
    //     Cell: ({ value }) => {
    //         return <div className="whitespace-normal truncate">{value}</div>
    //     },
    //     width: 120,
    // },
    // {
    //     Header: 'Device Name',
    //     accessor: 'deviceKey',
    //     Cell: ({ value }) => {
    //         return <div className="whitespace-normal truncate">{value}</div>
    //     },
    //     width: 120,
    // },
    {
      ...deviceInfoObj,
    },

    {
      ...locationObj,
    },

    // //FIXME: Keep the user name or user ID
    // {
    //     Header: 'User',
    //     accessor: 'deviceUserKey',
    //     width: 120,
    // },
    //TODO:FIXME: When implementing notices
    // {
    //     Header: 'Notices',
    //     accessor: 'noticeCount',
    //     width: 100,
    //     Cell: ({ value }) => <CountBadge value={value} />,
    // },
  ]

  const midScreenColumns = [
    {
      ...dateTimeObj,
    },
    {
      ...testInfoObj,
    },
    {
      ...testResultObj,
    },
    {
      ...analytesObj,
    },
  ]

  const smallScreenColumns = [
    {
      ...dateTimeObj,
    },
    {
      ...testInfoObj,
    },
    {
      ...testResultObj,
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

export default withAuthenticationRequired(
  TestReportSummary,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
