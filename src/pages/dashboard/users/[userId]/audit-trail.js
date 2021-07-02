import {useMemo, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {useRouter} from 'next/router'
import moment from 'moment-timezone'

// import useScreenSize from '@hooks/use-screen-size'
import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'
import useDateTimeFormat from '@hooks/use-date-time-formats'

import {getRedirecting, isBrowser} from '@lib/utils'
import Table from '@components/Table'
import DashboardShell from '@components/DashboardShell'
import {ErrorBoundary} from 'react-error-boundary'
import {
  UnAuthorizedAccess,
  ErrorFallback,
  HeaderWithStartEndDates,
  OnError,
  ListLoading,
  FixSizeBadge,
  BackButton,
} from '@components/CommonComponents'

import {
  USERCONTROLNAME,
  USERSINDEX,
  APIDATEFORMAT,
  DATETIMEDISPLAYFORMAT,
  DEFAULTTIMEZONE,
  NEUTRALBACKGROUND_WITH_NEUTRALTEXT,
  REDBACKGROUND_WITH_DARKREDTEXT,
} from '@lib/constants'
import {
  TABLE_TIME_HEADER,
  TABLE_INFO_HEADER,
  TABLE_TAG_HEADER,
  SEARCH_PLACEHOLDER_USER_AUDIT,
} from '@lib/Strings'

import useInput from '@hooks/use-input'
import {FileDownload} from '@components/ExcelFileDownload'

const UserAuditTrail = () => {
  const {userScreenAccess} = useValidatePermissions(USERCONTROLNAME)

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
        <UserAuditTrailHeader
          start={startDateInput}
          startFocused={startDateFocused}
          startDateId="auditStart"
          startDatePlaceHolder="Audit Start Date"
          end={endDateInput}
          endFocused={endDateFocused}
          endDateId="auditEnd"
          endDatePlaceHolder="Audit End Date"
        />
        <UserAuditTrailList
          start={startDateInput.value}
          end={endDateInput.value}
        />
      </ErrorBoundary>
    </DashboardShell>
  )
}

const UserAuditTrailHeader = props => {
  const router = useRouter()
  const {userId} = router.query

  return (
    <div className="flex flex-col items-center sm:flex-row sm:justify-between ">
      <BackButton url={`${USERSINDEX}/${userId}`} />
      <HeaderWithStartEndDates headerTitle={'Audit Trail'} {...props} />
      <div></div>
    </div>
  )
}

const UserAuditTrailList = ({start, end}) => {
  const router = useRouter()
  const {userId} = router.query
  const {data: userAuditTrailData, error: userAuditTrailError} = useDataLib([
    `Activity/user-activity?StartDate=${start.format(
      APIDATEFORMAT,
    )}&EndDate=${end.format(APIDATEFORMAT)}&UserID=${userId}`,
  ])

  return (
    <Fragment>
      {userAuditTrailError && <OnError error={userAuditTrailError} />}
      {!userAuditTrailData && !userAuditTrailError && <ListLoading />}
      {userAuditTrailData && <UserAuditTrailGrid data={userAuditTrailData} />}
    </Fragment>
  )
}

const UserAuditTrailGrid = ({data}) => {
  const {firstName, lastName} =
    data.length > 0 ? data[0] : {firstName: '', lastName: ''}
  const auditData = useMemo(() => data, [data])
  const tableColumns = useAuditTrailTableColumns()
  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  // TODO:FIXME:  Get the datetime form settings store
  // const dateTimeFormat = useDateTimeFormat()

  const handleDocumentDownloadClick = rows => {
    const downloadFileHeader = `Audit Trail - ${firstName} ${lastName}`
    // console.log(
    //     'handleDocumentDownloadClick:: ',
    //     rows,
    //     ' excelColumns:: ',
    //     excelColumns
    // )
    const columnNames = ['Time', 'Tag', 'Info']
    const rowAccessor = ['activityTime', 'messageType', 'description']

    let rowData = rows.map(row => {
      return rowAccessor.map(accessor => {
        //TODO: if timeone and timeformats are implemented,
        // then we should checkfor the accessor value matching
        // that column and convert it accordingly

        if (accessor === 'activityTime') {
          return moment
            .tz(row.original[accessor], DEFAULTTIMEZONE)
            .format(`${DATETIMEDISPLAYFORMAT}`)
        }

        return row.original[accessor]
      })
    })

    FileDownload(rowData, columnNames, {
      filename: `audittrail - ${firstName} ${lastName}`,
      header: downloadFileHeader,
      sheetname: `audit trail - ${firstName} ${lastName}`,
    })
  }

  return (
    <Table
      columns={columns}
      data={auditData}
      initialState={initialState}
      // TODO:FIXME: Uncomment me
      onDocumentDownloadClick={handleDocumentDownloadClick}
      rowHeight={50}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_USER_AUDIT}
    />
  )
}

const useAuditTrailTableColumns = () => {
  //const screenSize = useScreenSize()

  const {formatTime} = useDateTimeFormat()

  const dateTimeHeaderObj = {
    Header: TABLE_TIME_HEADER,
    id: 'time',
    //TODO: use the date component that will be set as per timezone
    accessor: d => {
      return d.activityTime ? moment(d.activityTime).format('x') : ''
    },
    Cell: function cellFunc({value}) {
      if (value.length < 1) {
        return <div>Invalid date</div>
      }
      const intValue = parseInt(value)
      const formattedValue = formatTime(intValue)
      const [date, ...rest] = formattedValue.split(' ')
      return (
        <div>
          <div>{date}</div>
          <div>{rest.join(' ')}</div>
        </div>
      )
    },

    width: 210,
  }

  const tagObj = {
    Header: TABLE_TAG_HEADER,
    accessor: 'messageType',
    Cell: function cellFunc({value}) {
      let tagCss = ''
      switch (value) {
        case 'Error':
          tagCss = REDBACKGROUND_WITH_DARKREDTEXT
          break
        case 'Warning':
          tagCss = NEUTRALBACKGROUND_WITH_NEUTRALTEXT
          break
        default:
          tagCss = 'bg-gray-600 text-white'
          break
      }

      return <FixSizeBadge color={tagCss} text={value} />
    },
    width: 150,
  }

  const auditInfo = {
    Header: TABLE_INFO_HEADER,
    id: 'description',
    accessor: d => {
      let tagCss = ''
      switch (d.messageType) {
        case 'Error':
          tagCss = 'text-red-800'
          break
        case 'Warning':
          tagCss = 'text-gray-800'
          break
        default:
          tagCss = 'text-brand-dark-blue'
          break
      }

      const obj = {
        description: d.description,
        tagCss,
      }
      return JSON.stringify(obj)
    },
    Cell: function cellFunc({value}) {
      let obj = JSON.parse(value)

      return (
        <p
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                                    text-xs font-medium leading-4 max-w-md whitespace-normal break-all
                                     ${obj.tagCss}`}
        >
          {obj.description}
        </p>
      )
    },
    width: 350,
  }

  const largeScreenColumns = [
    {
      ...dateTimeHeaderObj,
    },
    {
      ...tagObj,
    },
    {
      ...auditInfo,
    },
  ]
  const initialState = {
    sortBy: [
      {
        id: 'time',
        desc: true,
      },
    ],
  }

  return {
    columns: largeScreenColumns,
    initialState: initialState,
  }
}

export default withAuthenticationRequired(
  UserAuditTrail,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
