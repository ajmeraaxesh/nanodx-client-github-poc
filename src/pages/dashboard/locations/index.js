import {useMemo, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {useRouter} from 'next/router'

import useScreenSize from '@hooks/use-screen-size'
import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {LOCATIONSCONTROLNAME, LOCATIONSINDEX} from '@lib/constants'

import {
  UnAuthorizedAccess,
  ErrorFallback,
  OnError,
  ListLoading,
} from '@components/CommonComponents'

import {getRedirecting} from '@lib/utils'
import Table from '@components/Table'
import DashboardShell from '@components/DashboardShell'
import {ErrorBoundary} from 'react-error-boundary'
import FileDownload, {
  getExcelColumnHeaders,
  getRowDataUsingAccessor,
} from '@components/ExcelFileDownload'

/**
 * NOTE: That the  parent component needs to be wrapped
 * with withAuthenticationRequired which is a higher order components and
 * it helps is making sure that unauthenticated users cannot access this page
 *
 * There by making this a protected route
 */

import {
  TABLE_NAME_HEADER,
  TABLE_LOCATION_ADDRESS_HEADER,
  TABLE_LOCATION_CITY_HEADER,
  TABLE_LOCATION_STATE_HEADER,
  TABLE_LOCATION_ZIP_HEADER,
  SEARCH_PLACEHOLDER_LOCATIONS,
} from '@lib/Strings'

const LocationsList = () => {
  const {userScreenAccess} = useValidatePermissions(LOCATIONSCONTROLNAME)
  const {data: locationsData, error: locationsError} = useDataLib(
    userScreenAccess ? [`facility`] : null,
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
        {locationsError && <OnError error={locationsError} />}
        {!locationsError && !locationsData && <ListLoading />}
        {locationsData && <LocationsGrid data={locationsData} />}
      </ErrorBoundary>
    </DashboardShell>
  )
}

const LocationsGrid = ({data}) => {
  console.log('Locations Grid: ', data)
  const {edit, add} = useValidatePermissions(LOCATIONSCONTROLNAME)
  const router = useRouter()
  const locationData = useMemo(() => data, [data])
  const tableColumns = useLocationTableColumns()
  // TODO: same for filtering and setting column widths to be used in column Resizing and
  //      column ordering
  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  //TODO:FIXME: Remove all the functions

  const handleNewLocationClick = () => {
    console.log('Adding a new location:: ')
    router.push(`${LOCATIONSINDEX}/00000000-0000-0000-0000-000000000000`)
  }

  const handleDetailCLick = facilityID => {
    console.log('Editing existing location:: ')
    router.push(`${LOCATIONSINDEX}/${facilityID}`)
  }

  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'LocationsList:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )
    const columnNames = getExcelColumnHeaders(excelColumns)
    const rowData = getRowDataUsingAccessor(excelColumns, rows)

    FileDownload(rowData, columnNames, {
      filename: `locations`,
      header: 'locations list',
      sheetname: `locations`,
    })
  }

  return (
    <Table
      columns={columns}
      data={locationData}
      initialState={initialState}
      rowHeight={60}
      // TODO: FIXME: Uncomment all the handle functions
      onRowClick={edit ? handleDetailCLick : null}
      // If the user has permission to edit the data only then they can add or edit the user
      //TODO: maybe down the road if the permission matrix gets more granular
      // then we show the corresponding permission
      onAddClick={add ? handleNewLocationClick : null}
      onDocumentDownloadClick={handleDocumentDownloadClick}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_LOCATIONS}
    />
  )
}

const useLocationTableColumns = () => {
  const screenSize = useScreenSize()

  const locationNameObj = {
    Header: TABLE_NAME_HEADER,
    accessor: 'facilityName',
    width: 250,
    Cell: function cellFunc({value}) {
      return <div className="break-words whitespace-normal">{value}</div>
    },
  }

  const locationAddressObj = {
    Header: TABLE_LOCATION_ADDRESS_HEADER,
    id: 'address',
    accessor: d => `${d.address1}___${d.address2}`,
    Cell: function cellFunc({value}) {
      let address = value.split('___')
      return (
        <div className="break-words whitespace-normal">
          <div className="">{address[0]}</div>
          <div>{address[1]}</div>
        </div>
      )
    },
    width: 350,
  }

  const locationDescriptionObj = {
    Header: 'Description',
    accessor: 'description',
    Cell: function cellFunc({value}) {
      return (
        <div className="break-words whitespace-normal">
          <div className="">{value}</div>
        </div>
      )
    },
    width: 300,
  }

  const cityObj = {
    Header: TABLE_LOCATION_CITY_HEADER,
    accessor: 'city',
  }

  const stateObj = {
    Header: TABLE_LOCATION_STATE_HEADER,
    accessor: 'state',
    width: 250,
  }

  const zipObj = {
    Header: TABLE_LOCATION_ZIP_HEADER,
    accessor: 'zip',
    width: 165,
  }

  const moreObj = {
    Header: ' ',
    id: 'More',
    accessor: d => d.facilityID,
    width: 10,
    Cell: function cellFunc() {
      return <Fragment />
    },
  }

  const largeScreenColumns = [
    {...locationNameObj},
    {...locationAddressObj},
    {...cityObj},
    {...stateObj},
    {...zipObj},
    {...moreObj},
  ]

  const midScreenColumns = [
    {...locationNameObj},
    {...locationAddressObj},
    {...locationDescriptionObj},
    {...zipObj},
    {...moreObj},
  ]

  const smallScreenColumns = [
    {...locationNameObj},
    {...locationDescriptionObj},
    {...moreObj},
  ]

  const initialState = {
    sortBy: [
      {
        id: 'facilityName',
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

export default withAuthenticationRequired(
  LocationsList,
  getRedirecting(LOCATIONSINDEX),
)
