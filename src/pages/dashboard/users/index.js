import {useMemo, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {useRouter} from 'next/router'
import moment from 'moment-timezone'

import useScreenSize from '@hooks/use-screen-size'
import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {
  USERCONTROLNAME,
  USERSINDEX,
  REDBACKGROUND_WITH_DARKREDTEXT,
  GREENBACKROUND_WITH_DARKGREENTEXT,
} from '@lib/constants'

import {
  UnAuthorizedAccess,
  ErrorFallback,
  OnError,
  ListLoading,
  NameID,
  FixSizeBadge,
} from '@components/CommonComponents'
import {getRedirecting} from '@lib/utils'
import Table from '@components/Table'
import DashboardShell from '@components/DashboardShell'
import {ErrorBoundary} from 'react-error-boundary'
import {
  TABLE_NAME_HEADER,
  TABLE_ID_HEADER,
  TABLE_USER_INFO_HEADER,
  TABLE_DEPARTMENT_HEADER,
  TABLE_LOCATION_HEADER,
  TABLE_NOTICES_HEADER,
  TABLE_USER_ROLE_HEADER,
  TABLE_USER_DATE_TRAINED_HEADER,
  TABLE_USER_DATE_EXPIRES_HEADER,
  TABLE_STATUS_HEADER,
  SEARCH_PLACEHOLDER_USERS,
} from '@lib/Strings'
import {FileDownload} from '@components/ExcelFileDownload'
import useDateTimeFormat from '@hooks/use-date-time-formats'

/**
 * NOTE: That the  parent component needs to be wrapped
 * with withAuthenticationRequired which is a higher order components and
 * it helps is making sure that unauthenticated users cannot access this page
 *
 * There by making this a protected route
 */

const UsersList = () => {
  const {userScreenAccess} = useValidatePermissions(USERCONTROLNAME)

  const {data: userData, error: userError} = useDataLib(
    userScreenAccess ? [`user`] : null,
  )

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
        {userError && <OnError error={userError} />}
        {!userError && !userData && <ListLoading />}
        {userData && <UsersGrid data={userData} />}
      </ErrorBoundary>
    </DashboardShell>
  )
}

const UsersGrid = ({data}) => {
  console.log('Users Grid: ', data)
  const {edit, add} = useValidatePermissions(USERCONTROLNAME)

  const portalColumns = usePortalUsersColumns()
  const testData = useMemo(() => data, [data])
  const tableColumns = portalColumns
  const router = useRouter()

  // TODO: same for filtering and setting column widths to be used in column Resizing and
  //      column ordering
  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  const handleNewUserClick = () => {
    console.log('Adding a new users:: ')
    router.push(`${USERSINDEX}/00000000-0000-0000-0000-000000000000`)
  }

  const handleDetailClick = userID => {
    console.log('Details clicked for UserList:: ', userID)
    router.push(`${USERSINDEX}/${userID}`)
  }

  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'UsersList:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )

    const portalUserColumns = {
      headers: [
        'Name',
        'ID',
        'Location',
        'Role',
        'Department',
        'Status',
        'Date Trained',
        'Date Expires',
        'Notices',
      ],
      originalColumns: [
        'name',
        'id',
        'facilitiesCsv',
        'portalRole',
        'department',
        'status',
        'dateTrained',
        'trainingExpiration',
        'notices',
      ],
      accessorColumns: ['name', 'dateTrained', 'trainingExpiration'],
    }

    // const deviceUserColumns = {
    //     headers: [
    //         'Name',
    //         'ID',
    //         'Location',
    //         'Department',
    //         'Date Trained',
    //         'Date Expires',
    //         'Status',
    //         'Notices',
    //     ],
    //     originalColumns: [
    //         'name',
    //         'id',
    //         'facilitiesCsv',
    //         'department',
    //         'dateTrained',
    //         'trainingExpiration',
    //         'status',
    //         'notices',
    //     ],
    //     accessorColumns: ['name', 'dateTrained', 'trainingExpiration'],
    // }

    let originalColumns = portalUserColumns.originalColumns
    let accessorColumns = portalUserColumns.accessorColumns
    let columnHeaders = portalUserColumns.headers
    let fileName = 'users'
    let fileHeader = 'User List'
    let fileSheetname = 'users'

    const excelRows = () => {
      return rows.map(row => {
        const excelRowData = originalColumns.map(column => {
          //console.log('getRowDataUsingOriginalValues:: ', row)

          if (accessorColumns && accessorColumns.indexOf(column) > -1) {
            switch (column) {
              case 'name':
                return `${row.original['lastname']} , ${row.original['firstname']}`
              default:
                return row.values[column]
            }
          }
          return row.original[column] || ''
        })
        return excelRowData
      })
    }

    const rowData = excelRows()

    FileDownload(rowData, columnHeaders, {
      filename: fileName,
      header: fileHeader,
      sheetname: fileSheetname,
    })
  }

  return (
    <Table
      columns={columns}
      data={testData}
      initialState={initialState}
      rowHeight={60}
      onAddClick={add ? handleNewUserClick : null}
      onDocumentDownloadClick={handleDocumentDownloadClick}
      onRowClick={edit ? handleDetailClick : null}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_USERS}
    />
  )
}

const usePortalUsersColumns = () => {
  const screenSize = useScreenSize()
  const commonColumns = getCommonObjForPortalAndDeviceUsers()

  const {formatTime} = useDateTimeFormat()

  const roleObj = {
    Header: TABLE_USER_ROLE_HEADER,
    accessor: 'portalRole',
    Cell: function cellFunc({value}) {
      return <div className="whitespace-normal">{value}</div>
    },
    width: 150,
  }
  const moreObj = {
    Header: ' ',
    id: 'More',
    accessor: d => d.userId,
    width: 10,
    Cell: function cellFunc({value}) {
      return <Fragment />
    },
  }

  const dateTrainedObj = {
    // No timezone involved in date trained, so only consider the date format
    Header: TABLE_USER_DATE_TRAINED_HEADER,
    id: 'dateTrained',

    accessor: d => {
      return d.dateTrained ? moment(d.dateTrained).format('x').toString() : 'NA'
    },
    Cell: function cellFunc({value}) {
      if (value !== 'NA') {
        const intValue = parseInt(value)
        value = formatTime(intValue)
        let [date] = value.split(' ')
        return <div>{date}</div>
      } else {
        return <div className="w-full">{value}</div>
      }
    },
    width: 150,
  }

  const dateExpiredObj = {
    // No timezone involved in date expired, so only consider the date format
    Header: TABLE_USER_DATE_EXPIRES_HEADER,
    id: 'trainingExpiration',
    accessor: d => {
      return d.trainingExpiration
        ? moment(d.trainingExpiration).format('x').toString()
        : 'NA'
    },
    Cell: function cellFunc({value}) {
      if (value !== 'NA') {
        const intValue = parseInt(value)
        value = formatTime(intValue)
        let [date] = value.split(' ')
        return <div>{date}</div>
      } else {
        return <div className="w-full">{value}</div>
      }
    },
    width: 130,
  }

  const largeScreenColumns = [
    {
      ...commonColumns.userInfo,
    },
    {
      ...commonColumns.location,
    },
    {
      ...roleObj,
    },
    {
      ...commonColumns.department,
    },
    {
      ...commonColumns.status,
    },
    {
      ...dateTrainedObj,
    },
    {
      ...dateExpiredObj,
    },
    //TODO:FIXME: Uncomment me when displaying notices
    // {
    //     ...commonColumns.notices,
    // },
    {
      ...moreObj,
    },
  ]

  const midScreenColumns = [
    {
      ...commonColumns.userInfo,
    },
    {
      ...roleObj,
    },
    {
      ...dateTrainedObj,
    },
    {
      ...dateExpiredObj,
    },
    {
      ...moreObj,
    },
  ]

  const smallScreenColumns = [
    {
      ...commonColumns.userInfo,
    },
    {
      ...roleObj,
    },
    {
      ...dateExpiredObj,
    },
    {
      ...moreObj,
    },
  ]

  const initialState = {
    sortBy: [
      {
        id: commonColumns.userInfo.id,
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
      columns = midScreenColumns
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

const getCommonObjForPortalAndDeviceUsers = () => {
  const nameObj = {
    Header: TABLE_NAME_HEADER,
    id: 'name',
    accessor: d => {
      return `${d.lastname}, ${d.firstname}`
    },
    Cell: function cellFunc({value}) {
      return <div className="whitespace-normal">{value}</div>
    },
    width: 180,
  }

  const idObj = {
    Header: TABLE_ID_HEADER,
    accessor: 'id',
    width: 150,
  }

  const userInfoObj = {
    Header: TABLE_USER_INFO_HEADER,
    id: 'userInfo',
    accessor: d => {
      return `${d.lastname}, ${d.firstname}___${d.id}`
    },
    Cell: function cellFunc({value}) {
      let [userName, userID] = value.split('___')
      return (
        <div className="whitespace-normal">
          <NameID name={userName} id={userID} />
        </div>
      )
    },
    width: 220,
  }

  const departmentObj = {
    Header: TABLE_DEPARTMENT_HEADER,
    accessor: 'department',
    width: 170,
  }

  const userStatusObj = {
    Header: TABLE_STATUS_HEADER,
    accessor: 'status',
    Cell: ({value}) => {
      const status = value.toLowerCase()
      switch (status) {
        case 'active':
          return (
            <FixSizeBadge
              color={`${GREENBACKROUND_WITH_DARKGREENTEXT}`}
              text={value}
            />
          )
        case 'inactive':
        case 'locked':
          return (
            <FixSizeBadge
              color={`${REDBACKGROUND_WITH_DARKREDTEXT}`}
              text={value}
            />
          )
        default:
          return value
      }
    },
    width: 120,
  }

  const locationObj = {
    Header: TABLE_LOCATION_HEADER,
    accessor: 'facilitiesCsv',

    Cell: function cellFunc({value}) {
      //let hospitals = value.split(',')
      //let newLineHospitals = hospitals.join('\n')
      return <div className="whitespace-normal ">{value}</div>
      //return <div className=" truncate">{value}</div>
    },
  }

  const noticesObj = {
    Header: TABLE_NOTICES_HEADER,
    //TODO: fix the notices when implemented
    id: 'notices',
    accessor: d => {
      return ''
    },
    width: 60,
  }

  return {
    name: nameObj,
    id: idObj,
    userInfo: userInfoObj,
    status: userStatusObj,
    location: locationObj,
    notices: noticesObj,
    department: departmentObj,
  }
}

export default withAuthenticationRequired(UsersList, getRedirecting(USERSINDEX))
