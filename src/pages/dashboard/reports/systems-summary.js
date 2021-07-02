import {useMemo, Fragment} from 'react'
import moment from 'moment'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {ErrorBoundary} from 'react-error-boundary'

import {
  CountBadge,
  HeaderWithStartEndDates,
  OnError,
  ErrorFallback,
  ListLoading,
  UnAuthorizedAccess,
} from '@components/CommonComponents'

import Table from '@components/Table'

import FileDownload, {
  getExcelColumnHeaders,
  getRowDataUsingAccessor,
} from '@components/ExcelFileDownload'

import useInput from '@hooks/use-input'
import useDataLib from '@hooks/use-data-lib'
import useScreenSize from '@hooks/use-screen-size'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {getRedirecting, isBrowser} from '@lib/utils'
import DashboardShell from '@components/DashboardShell'

import {REPORTSCONTROLNAME, APIDATEFORMAT} from '@lib/constants'

import {
  REPORTS_DEVICE_TYPE_HEADER,
  TABLE_NAME_HEADER,
  REPORTS_USER_ALLOCATED_HEADER,
  REPORTS_TOTAL_PATIENT_TESTS_HEADER,
  REPORTS_FAILED_PATIENT_TESTS_HEADER,
  REPORTS_TOTAL_QC_TESTS_HEADER,
  REPORTS_FAILED_QC_TESTS_HEADER,
  SEARCH_PLACEHOLDER_SYSTEMS,
} from '@lib/Strings'

const SystemsReportSummary = () => {
  const {userScreenAccess} = useValidatePermissions(REPORTSCONTROLNAME)

  const startDateInput = useInput(moment().subtract(7, 'days'))
  const startDateFocused = useInput(null)
  const endDateInput = useInput(moment())
  const endDateFocused = useInput(null)

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
        <SystemsReportHeader
          start={startDateInput}
          startFocused={startDateFocused}
          startDateId="reportStart"
          startDatePlaceHolder="Report Start Date"
          end={endDateInput}
          endFocused={endDateFocused}
          endDateId="reportEnd"
          endDatePlaceHolder="Report End Date"
        />
        <SystemsReportBody
          start={startDateInput.value}
          end={endDateInput.value}
        />
      </ErrorBoundary>
    </DashboardShell>
  )
}

const SystemsReportHeader = props => {
  return (
    <HeaderWithStartEndDates
      // headerTitle={'Systems Summary'}
      {...props}
    />
  )
}

const SystemsReportBody = ({start, end}) => {
  const {data: systemReportSummaryData, error: systemReportSummaryError} =
    useDataLib([
      `device/summary?startdate=${start.format(
        APIDATEFORMAT,
      )}&enddate=${end.format(APIDATEFORMAT)}`,
    ])

  return (
    <Fragment>
      {systemReportSummaryError && <OnError error={systemReportSummaryError} />}
      {!systemReportSummaryData && !systemReportSummaryError && <ListLoading />}
      {systemReportSummaryData && (
        <SystemsReportGrid data={systemReportSummaryData} />
      )}
    </Fragment>
  )
}

const SystemsReportGrid = ({data}) => {
  const systemReportsData = useMemo(() => data, [data])
  const tableColumns = useSystemReportsTableColumns()

  //TODO: same for filtering and setting column widths to be used in column Resizing and
  //      column ordering
  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'SystemReports:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )
    const columnNames = getExcelColumnHeaders(excelColumns)
    const rowData = getRowDataUsingAccessor(excelColumns, rows)

    FileDownload(rowData, columnNames, {
      filename: `systemreports`,
      header: 'system reports list',
      sheetname: `system reports`,
    })
  }

  return (
    <Table
      columns={columns}
      data={systemReportsData}
      initialState={initialState}
      onDocumentDownloadClick={handleDocumentDownloadClick}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_SYSTEMS}
    />
  )
}

const useSystemReportsTableColumns = () => {
  //const largeScreen = useMediaType()
  const screenSize = useScreenSize()

  const defaultCellFunc = ({value}) => {
    return <CountBadge value={value} />
  }

  const largeScreenColumns = [
    {
      Header: REPORTS_DEVICE_TYPE_HEADER,
      accessor: 'deviceType',
      width: 120,
    },
    {
      Header: TABLE_NAME_HEADER,
      accessor: 'deviceKey',
      Cell: function cellFunc({value}) {
        return <div className="whitespace-normal truncate">{value}</div>
      },
      width: 300,
    },
    {
      Header: REPORTS_USER_ALLOCATED_HEADER,
      accessor: 'userCount',
      Cell: defaultCellFunc,
      width: 160,
    },
    {
      Header: REPORTS_TOTAL_PATIENT_TESTS_HEADER,
      accessor: 'testCount',
      Cell: defaultCellFunc,
      width: 150,
    },
    {
      Header: REPORTS_FAILED_PATIENT_TESTS_HEADER,
      accessor: 'failedTestCount',
      Cell: defaultCellFunc,
      width: 150,
    },
    {
      Header: REPORTS_TOTAL_QC_TESTS_HEADER,
      id: 'qcTestCount',
      accessor: d => d.passedQCTestCount + d.failedQCTestCount,
      Cell: defaultCellFunc,
      width: 150,
    },

    {
      Header: REPORTS_FAILED_QC_TESTS_HEADER,
      accessor: 'failedQCTestCount',
      Cell: defaultCellFunc,
      width: 150,
    },
    //TODO:FIXME: Uncomment me when displaying notices
    // {
    //     Header: 'Notices',
    //     accessor: 'noticeCount',
    //     Cell: ({ value }) => <CountBadge value={value} />,
    //     width: 120,
    // },
  ]

  const smallScreenColumns = [
    {
      Header: TABLE_NAME_HEADER,
      accessor: 'deviceKey',
      Cell: function cellFunc({value}) {
        return <div className="whitespace-normal truncate">{value}</div>
      },
      width: 300,
    },
  ]

  const initialState = {
    sortBy: [
      {
        id: 'deviceKey',
        desc: false,
      },
    ],
  }

  let columns = largeScreenColumns
  switch (screenSize) {
    case 'mobile':
      columns = smallScreenColumns
      break
    case 'sm':
    case 'md':
      columns = largeScreenColumns
      break
    case 'lg':
      columns = largeScreenColumns
      break
    default:
      columns = largeScreenColumns
  }

  return {
    // for columnHiding useMediaQuery hook and react-table setups for column hiding
    columns,
    initialState,
  }
}

export default withAuthenticationRequired(
  SystemsReportSummary,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
