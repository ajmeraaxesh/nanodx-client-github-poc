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
  TABLE_NAME_HEADER,
  REPORTS_TEST_COMPLETED_HEADER,
  REPORTS_FAILED_TEST_HEADER,
  REPORTS_SYSTEMS_ALLOCATED_HEADER,
  SEARCH_PLACEHOLDER_USERS,
} from '@lib/Strings'

const UsersReportSummary = () => {
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
        <UsersReportHeader
          start={startDateInput}
          startFocused={startDateFocused}
          startDateId="reportStart"
          startDatePlaceHolder="Report Start Date"
          end={endDateInput}
          endFocused={endDateFocused}
          endDateId="reportEnd"
          endDatePlaceHolder="Report End Date"
        />
        <UsersReportBody
          start={startDateInput.value}
          end={endDateInput.value}
        />
      </ErrorBoundary>
    </DashboardShell>
  )
}

const UsersReportHeader = props => {
  return (
    <HeaderWithStartEndDates
      //  headerTitle={'Users Summary'}
      {...props}
    />
  )
}

const UsersReportBody = ({start, end}) => {
  const {data: usersReportSummaryData, error: usersReportSummaryError} =
    useDataLib([
      `user/summary?startdate=${start.format(
        APIDATEFORMAT,
      )}&enddate=${end.format(APIDATEFORMAT)}`,
    ])

  return (
    <Fragment>
      {usersReportSummaryError && <OnError error={usersReportSummaryError} />}
      {!usersReportSummaryData && !usersReportSummaryError && <ListLoading />}
      {usersReportSummaryData && (
        <UsersReportGrid data={usersReportSummaryData} />
      )}
    </Fragment>
  )
}

const UsersReportGrid = ({data}) => {
  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'UsersList:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )
    const columnNames = getExcelColumnHeaders(excelColumns)
    const rowData = getRowDataUsingAccessor(excelColumns, rows)

    FileDownload(rowData, columnNames, {
      filename: `userreports`,
      header: 'user reports list',
      sheetname: `users`,
    })
  }
  const testData = useMemo(() => data, [data])
  const tableColumns = useUserReportTableColumns()

  // TODO: same for filtering and setting column widths to be used in column Resizing and
  //      column ordering
  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  return (
    <Table
      columns={columns}
      data={testData}
      initialState={initialState}
      onDocumentDownloadClick={handleDocumentDownloadClick}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_USERS}
    />
  )
}

const useUserReportTableColumns = () => {
  const screenSize = useScreenSize()

  const countBadgeCellFunc = ({value}) => {
    return <CountBadge value={value} />
  }

  const largeScreenColumns = [
    {
      Header: TABLE_NAME_HEADER,
      id: 'name',
      accessor: d => {
        return `${d.firstName} ${d.lastName}`
      },
      width: 200,
    },
    {
      Header: REPORTS_TEST_COMPLETED_HEADER,
      accessor: 'testCount',
      Cell: countBadgeCellFunc,
      width: 200,
    },
    {
      Header: REPORTS_FAILED_TEST_HEADER,
      accessor: 'failedTestCount',
      Cell: countBadgeCellFunc,
      width: 150,
    },
    {
      Header: REPORTS_SYSTEMS_ALLOCATED_HEADER,
      accessor: 'deviceCount',
      Cell: countBadgeCellFunc,
      width: 210,
    },
    //TODO:FIXME: Uncomment me when displaying notices
    // {
    //     Header: 'Notices',
    //     accessor: 'noticeCount',
    //     Cell: ({ value }) => <CountBadge value={value} />,
    //     width: 150,
    // },
  ]

  const smallScreenColumns = [
    {
      Header: TABLE_NAME_HEADER,
      id: 'name',
      accessor: d => {
        return `${d.firstname} ${d.lastname}`
      },
    },
  ]

  const initialState = {
    sortBy: [
      {
        id: 'name',
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
  UsersReportSummary,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
