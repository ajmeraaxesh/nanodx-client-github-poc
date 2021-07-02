import {useMemo, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {useRouter} from 'next/router'
import moment from 'moment-timezone'

import useScreenSize from '@hooks/use-screen-size'
import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {
  SYSTEMSCONTROLNAME,
  SYSTEMSINDEX,
  REDBACKGROUND_WITH_DARKREDTEXT,
  GREENBACKROUND_WITH_DARKGREENTEXT,
} from '@lib/constants'

import {
  UnAuthorizedAccess,
  ErrorFallback,
  OnError,
  ListLoading,
  FixSizeBadge,
  CountBadge,
  NoticeBell,
} from '@components/CommonComponents'

import {
  TABLE_DEVICE_INFO_HEADER,
  TABLE_SYSTEM_NAME_HEADER,
  TABLE_LOCATION_HEADER,
  TABLE_STATUS_HEADER,
  TABLE_SYSTEM_INSTALLED_HEADER,
  SEARCH_PLACEHOLDER_SYSTEMS,
} from '@lib/Strings'

import {getRedirecting} from '@lib/utils'
import Table from '@components/Table'
import DashboardShell from '@components/DashboardShell'
import {ErrorBoundary} from 'react-error-boundary'
import FileDownload from '@components/ExcelFileDownload'
import useDateTimeFormat from '@hooks/use-date-time-formats'

// Devices and SYstems refer the same thing
const DevicesList = () => {
  const {userScreenAccess} = useValidatePermissions(SYSTEMSCONTROLNAME)
  const {data: devicesData, error: devicesError} = useDataLib(
    userScreenAccess ? [`device`] : null,
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
        {devicesError && <OnError error={devicesError} />}
        {!devicesError && !devicesData && <ListLoading />}
        {devicesData && <DevicesGrid data={devicesData} />}
      </ErrorBoundary>
    </DashboardShell>
  )
}

const DevicesGrid = ({data}) => {
  const {edit} = useValidatePermissions(SYSTEMSCONTROLNAME)
  const router = useRouter()

  const devicesData = useMemo(() => data, [data])
  const devicesColumns = useDevicesTableColumns()

  //TODO: same for filtering and setting column widths to be used in column Resizing and
  //      column ordering
  const columns = useMemo(() => devicesColumns.columns, [devicesColumns])
  const initialState = devicesColumns.initialState

  const handleDetailClick = deviceID => {
    console.log('SystemsList:: details for:: ', deviceID)
    router.push(`${SYSTEMSINDEX}/${deviceID}`)
  }
  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'Systems:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )

    const systemsExcelColumnHeaders = [
      'Device Type',
      'Name',
      'Model',
      'Serial Number',
      'Location',
      'Installed On',
      'Status',
      'Notices',
    ]
    const systemColumnAccessor = [
      'deviceType',
      'deviceName',
      'model',
      'deviceKey',
      'facilityName',
      'installDate',
      'status',
      'notices',
    ]

    const accessorColumns = ['deviceKey', 'installDate']

    const excelRows = () => {
      return rows.map(row => {
        let excelRowData = systemColumnAccessor.map(column => {
          //console.log('getRowDataUsingOriginalValues:: ', row)

          if (accessorColumns && accessorColumns.indexOf(column) > -1) {
            switch (column) {
              case 'deviceKey':
                return row.original['serialNumber']
                  ? row.original['serialNumber']
                  : row.original['deviceKey']

              default:
                return row.values[column]
            }
          }
          return row.original[column] || ''
        })
        return excelRowData
      })
    }
    //const columnNames = getExcelColumnHeaders(excelColumns)
    const rowData = excelRows()

    FileDownload(rowData, systemsExcelColumnHeaders, {
      filename: `systems`,
      header: 'systems list',
      sheetname: `systems`,
    })
  }

  return (
    <Table
      columns={columns}
      data={devicesData}
      initialState={initialState}
      onRowClick={edit ? handleDetailClick : null}
      onDocumentDownloadClick={handleDocumentDownloadClick}
      rowHeight={70}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_SYSTEMS}
    />
  )
}

const useDevicesTableColumns = () => {
  const {formatTime} = useDateTimeFormat()

  const screenSize = useScreenSize()
  const deviceInfoObj = {
    Header: TABLE_DEVICE_INFO_HEADER,
    id: 'deviceInfo',
    accessor: d => {
      return (
        d.deviceType +
        '___' +
        d.model +
        '___' +
        d.softwareVersion +
        '___' +
        d.firmwareVersion
      )
    },
    Cell: function cellFunc({value}) {
      let [type, model, softwareVersion, firmwareVersion] = value.split('___')

      let imageSrc =
        type.toLowerCase() === 'handheld'
          ? '/images/nanodxhandheld.jpg'
          : '/images/nanodxanalyzer.png'

      return (
        <div className="whitespace-normal flex flex-row space-x-2">
          <img src={imageSrc} alt={type} className="w-12 h-12 rounded-full" />
          <div>
            <div className="">{type}</div>
            <div className="text-xs text-brand-blue">Model: {model}</div>
            {type.toLowerCase() === 'handheld' && (
              <div className="text-xs text-brand-blue">
                Software: {softwareVersion !== 'null' ? softwareVersion : '-'}
              </div>
            )}
            {type.toLowerCase() === 'analyzer' && (
              <div className="text-xs text-brand-blue">
                Firmware: {firmwareVersion !== 'null' ? firmwareVersion : '-'}
              </div>
            )}
          </div>
        </div>
      )
    },
    width: 250,
  }

  const nameSerialObj = {
    Header: TABLE_SYSTEM_NAME_HEADER,
    id: 'nameSerial',
    accessor: d => {
      return d.deviceName + '___' + d.deviceKey + '___' + d.serialNumber
    },
    Cell: function cellFunc({value}) {
      let [name, ID, serial] = value.split('___')
      return (
        <div className="whitespace-normal">
          <div>{name}</div>
          <div className="text-xs text-brand-blue">
            {`Serial: ${serial ? serial : ID}`}
          </div>
        </div>
      )
    },
    width: 250,
  }

  const deviceLocationObj = {
    Header: TABLE_LOCATION_HEADER,
    accessor: 'facilityName',
    Cell: function cellFunc({value}) {
      return <div className=" whitespace-normal">{value}</div>
    },
  }

  const deviceStatusObj = {
    Header: TABLE_STATUS_HEADER,
    accessor: 'status',
    Cell: function cellFunc({value}) {
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
    width: 110,
  }

  const noticesObj = {
    Header: 'Notices',
    accessor: 'unreadNoticeCount',
    Cell: function cellFunc({value}) {
      return (
        <div className="flex space-x-2">
          {/* <CountBadge value={value} /> */}
          <NoticeBell
            count={parseInt(value)}
            showCount
            bellClassName="h-12 w-12"
          />
        </div>
      )
    },
    width: 120,
  }

  const moreObj = {
    Header: ' ',
    id: 'More',
    accessor: d => d.deviceID,
    width: 10,
    Cell: function cellFunc() {
      return <Fragment />
    },
  }

  const deviceInstallDate = {
    Header: TABLE_SYSTEM_INSTALLED_HEADER,
    id: 'installDate',
    accessor: d => {
      //TODO:FIXME: Replace it with settings store
      return d.installDate ? moment(d.installDate).format('x') : null
    },
    Cell: function cellFunc({value}) {
      if (!value) {
        return null
      }
      const intValue = parseInt(value)
      value = formatTime(intValue)
      const [date, time, timeZone] = value.split(' ')
      const fullTime = timeZone !== undefined ? time + ' ' + timeZone : time
      return (
        <div>
          <div>{date}</div>
          <div>{fullTime}</div>
        </div>
      )
    },
    width: 180,
  }

  const largeScreenColumns = [
    {
      ...deviceInfoObj,
    },
    {
      ...nameSerialObj,
    },
    {
      ...deviceLocationObj,
    },
    {
      ...deviceStatusObj,
    },
    {
      ...deviceInstallDate,
    },
    {
      ...noticesObj,
    },

    {
      ...moreObj,
    },
  ]

  const midScreenColumns = [
    {
      ...deviceInfoObj,
    },
    {
      ...nameSerialObj,
    },
    {
      ...deviceLocationObj,
    },
    {
      ...noticesObj,
    },
    {
      ...moreObj,
    },
  ]

  const smallScreenColumns = [
    {
      ...deviceInfoObj,
    },
    {
      ...nameSerialObj,
    },
    {
      ...noticesObj,
    },
    {
      ...moreObj,
    },
  ]

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
    case 'xl':
      columns = largeScreenColumns
      break
    default:
      break
  }

  const initialState = {
    sortBy: [],
  }

  return {
    //for columnHiding useMediaQuery hook and react-table setups for column hiding
    columns,
    initialState,
  }
}

export default withAuthenticationRequired(
  DevicesList,
  getRedirecting(SYSTEMSINDEX),
)
