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

import {
  REPORTSCONTROLNAME,
  REPORTSINDEX,
  APIDATEFORMAT,
  DATETIMEDISPLAYFORMAT,
  DEFAULTTIMEZONE,
} from '@lib/constants'

import {
  TABLE_LOCATION_HEADER,
  REPORTS_USER_ALLOCATED_HEADER,
  REPORTS_SYSTEMS_ALLOCATED_HEADER,
  REPORTS_TOTAL_PATIENT_TESTS_HEADER,
  REPORTS_FAILED_PATIENT_TESTS_HEADER,
  REPORTS_TOTAL_QC_TESTS_HEADER,
  REPORTS_FAILED_QC_TESTS_HEADER,
  SEARCH_PLACEHOLDER_LOCATIONS,
} from '@lib/Strings'

const LocationsReportSummary = () => {
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
        <LocationsReportHeader
          start={startDateInput}
          startFocused={startDateFocused}
          startDateId="reportStart"
          startDatePlaceHolder="Report Start Date"
          end={endDateInput}
          endFocused={endDateFocused}
          endDateId="reportEnd"
          endDatePlaceHolder="Report End Date"
        />
        <LocationReportBody
          start={startDateInput.value}
          end={endDateInput.value}
        />
      </ErrorBoundary>
    </DashboardShell>
  )
}

const LocationsReportHeader = props => {
  return (
    <HeaderWithStartEndDates
      // headerTitle={'Locations Summary'}
      {...props}
    />
  )
}

const LocationReportBody = ({start, end}) => {
  const {data: locationsReportSummaryData, error: locationReportSummaryError} =
    useDataLib([
      `facility/summary?startdate=${start.format(
        APIDATEFORMAT,
      )}&enddate=${end.format(APIDATEFORMAT)}`,
    ])

  return (
    <Fragment>
      {locationReportSummaryError && (
        <OnError error={locationReportSummaryError} />
      )}
      {!locationsReportSummaryData && !locationReportSummaryError && (
        <ListLoading />
      )}
      {locationsReportSummaryData && (
        <LocationsReportGrid data={locationsReportSummaryData} />
      )}
    </Fragment>
  )
}

const LocationsReportGrid = ({data}) => {
  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'LocationReports:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )
    const columnNames = getExcelColumnHeaders(excelColumns)
    const rowData = getRowDataUsingAccessor(excelColumns, rows)

    FileDownload(rowData, columnNames, {
      filename: `locationreports`,
      header: 'location reports list',
      sheetname: `location reports`,
    })
  }

  const locationData = useMemo(() => data, [data])
  const tableColumns = useLocationReportsTableColumns()

  //TODO: same for filtering and setting column widths to be used in column Resizing and
  //      column ordering
  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  return (
    <Table
      columns={columns}
      data={locationData}
      initialState={initialState}
      onDocumentDownloadClick={handleDocumentDownloadClick}
      rowHeight={60}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_LOCATIONS}
    />
  )
}

const useLocationReportsTableColumns = () => {
  const screenSize = useScreenSize()

  const defaultCellFunc = ({value}) => {
    return <CountBadge value={value} />
  }

  const largeScreenColumns = [
    {
      Header: TABLE_LOCATION_HEADER,
      accessor: 'facilityName',
      Cell: function cellFunc({value}) {
        return <div className="whitespace-normal">{value}</div>
      },
      width: 250,
    },
    {
      Header: REPORTS_USER_ALLOCATED_HEADER,
      accessor: 'userCount',
      Cell: defaultCellFunc,
      width: 200,
    },
    {
      Header: REPORTS_SYSTEMS_ALLOCATED_HEADER,
      accessor: 'deviceCount',
      Cell: defaultCellFunc,
      width: 200,
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
  ]

  const smallScreenColumns = [
    {
      Header: TABLE_LOCATION_HEADER,
      id: 'location',
      accessor: d => {
        return `${d.facilityName}`
      },
    },
  ]

  const initialState = {
    sortBy: [
      {
        id: 'location',
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
  LocationsReportSummary,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
