import {useMemo, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {useRouter} from 'next/router'

import useScreenSize from '@hooks/use-screen-size'
import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {getRedirecting} from '@lib/utils'
import create from 'zustand'
import moment from 'moment-timezone'
import {
  APIDATEFORMAT,
  DATETIMEDISPLAYFORMAT,
  QCCONTROLNAME,
  QCINDEX,
  DEFAULTTIMEZONE,
  ELECTRONICQCTEST,
  ELECTRONICQCTESTDISPLAYTEXT,
  LIQUIDQCQCTESTDISPLAYTEXT,
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
  FixSizeBadge,
} from '@components/CommonComponents'

import {
  QC_TEST_HEADER,
  QC_TEST_START_DATE,
  QC_TEST_END_DATE,
  TABLE_DATE_TIME_HEADER,
  TABLE_TEST_INFO_HEADER,
  TABLE_RESULTS_HEADER,
  TABLE_LOCATION_HEADER,
  TABLE_USER_ID_HEADER,
  SEARCH_PLACEHOLDER_TESTS,
} from '@lib/Strings'

import {FileDownload} from '@components/ExcelFileDownload'
import Table from '@components/Table'
import DashboardShell from '@components/DashboardShell'
import shallow from 'zustand/shallow'
import {ErrorBoundary} from 'react-error-boundary'
import useInput from '@hooks/use-input'
import useDateTimeFormat from '@hooks/use-date-time-formats'

const useQcTestDateStore = create(set => ({
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

const QcTestList = () => {
  const {userScreenAccess} = useValidatePermissions(QCCONTROLNAME)

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
        <QCTestHeader />
        <QCTestData />
      </ErrorBoundary>
    </DashboardShell>
  )
}

const QCTestHeader = () => {
  const [startDate, setStartDate, endDate, setEndDate] = useQcTestDateStore(
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

  return (
    <HeaderWithStartEndDates
      // headerTitle={QC_TEST_HEADER}
      start={{value: startDate, setValue: setStartDate}}
      startFocused={startFocusedInput}
      startDateId="qcTestStart"
      startDatePlaceHolder={QC_TEST_START_DATE}
      end={{value: endDate, setValue: setEndDate}}
      endFocused={endFocusedInput}
      endDateId="qcTestEnd"
      endDatePlaceHolder={QC_TEST_END_DATE}
    />
  )
}

export const QCTestData = () => {
  const [startDate, endDate] = useQcTestDateStore(
    state => [state.startDate, state.endDate],
    shallow,
  )
  const testDataUrl = `qc?startDate=${startDate.format(
    APIDATEFORMAT,
  )}&&endDate=${endDate.format(APIDATEFORMAT)}`
  const {data: qcTestData, error: qcTestError} = useDataLib([testDataUrl])

  return (
    <>
      {qcTestError && <OnError error={qcTestError} />}
      {!qcTestData && !qcTestError && <ListLoading />}
      {qcTestData && <QcTestGrid data={qcTestData} />}
    </>
  )
}

const QcTestGrid = ({data}) => {
  const {edit} = useValidatePermissions(QCCONTROLNAME)
  const router = useRouter()

  const handleDetailCLick = testId => {
    router.push(`${QCINDEX}/${testId}`)
  }

  const handleDocumentDownloadClick = (rows, excelColumns) => {
    console.log(
      'QCTests:: handleDocumentDownloadClick:: ',
      rows,
      ' excelColumns:: ',
      excelColumns,
    )
    const qcExcelColumns = [
      'analysisStartTime',
      'testTypeDisplayText',
      'cartridgeID',
      'concentration',
      'resultPassFail',
      'facilityName',
      'deviceUserKey',
      /**TODO: Get the accessor for the  notices */
    ]

    const excelColumnNames = [
      'Date & Time',
      'Test Type',
      'Cartridge ID',
      'Level',
      'Test Results',
      'Location',
      'User',
      /**TODO: Get the accessor for the  notices */
    ]

    const columnNames = excelColumnNames
    const accessorColumns = [
      'analysisStartTime',
      'cartridgeID',
      'testTypeDisplayText',
    ]
    const excelRows = () => {
      return rows.map(row => {
        let rowData = qcExcelColumns.map(column => {
          // console.log('getRowDataUsingOriginalValues:: ', row)

          if (accessorColumns && accessorColumns.indexOf(column) > -1) {
            switch (column) {
              case 'analysisStartTime':
                // TODO: FIXME: Replace with date and time format from settings store
                return `${moment(parseInt(row.values[column]))
                  .utc()
                  .tz(`${DEFAULTTIMEZONE}`)
                  .format(`${DATETIMEDISPLAYFORMAT}`)}`
              case 'cartridgeID':
                return (
                  row.original[column] || row.original['cartridgePackageID']
                )
              case 'testTypeDisplayText':
                const output =
                  row.original['qcTestType'] === ELECTRONICQCTEST
                    ? ELECTRONICQCTESTDISPLAYTEXT
                    : `${LIQUIDQCQCTESTDISPLAYTEXT} - ${row.original['testTypeDisplayText']}`

                return output
              // return `${
              //     row.original['qcTestType'] ===
              //     ELECTRONICQCTEST
              //         ? ELECTRONICQCTESTDISPLAYTEXT
              //         : LIQUIDQCQCTESTDISPLAYTEXT -
              //           row.original['testTypeDisplayText']
              // } `
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
      filename: `qctests`,
      header: 'qc tests list',
      sheetname: `qc tests`,
    })
  }

  const qcTestData = useMemo(() => data, [data])
  const tableColumns = useQCTestTableColumns()

  // TODO: for columnHiding useMediaQuery hook and react-table setups for column hiding
  // TODO: same for filtering and setting column widths to be used in column Resizing and
  //       column ordering

  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  return (
    <Table
      columns={columns}
      data={qcTestData}
      initialState={initialState}
      onRowClick={handleDetailCLick}
      onDocumentDownloadClick={edit ? handleDocumentDownloadClick : null}
      rowHeight={75}
      searchPlaceHolderText={SEARCH_PLACEHOLDER_TESTS}
    />
  )
}

const useQCTestTableColumns = () => {
  const screenSize = useScreenSize()

  const {formatTime} = useDateTimeFormat()

  const dateTimeObj = {
    Header: TABLE_DATE_TIME_HEADER,
    id: 'analysisStartTime',
    accessor: d => {
      const analysisTime = d.analysisStartTime
        ? d.analysisStartTime
        : d.cartridgeScanTime

      return moment(analysisTime).format('x')
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
    width: 180,
  }

  const testInfoObj = {
    Header: TABLE_TEST_INFO_HEADER,
    id: 'testInfo',
    accessor: d => {
      const cartridgeID = d.cartridgeID ? d.cartridgeID : d.cartridgePackageID
      const qcTestType =
        d.qcTestType === ELECTRONICQCTEST
          ? ELECTRONICQCTESTDISPLAYTEXT
          : LIQUIDQCQCTESTDISPLAYTEXT
      return (
        qcTestType +
        '___' +
        d.testTypeDisplayText +
        '___' +
        cartridgeID +
        '___' +
        d.concentration
      )
    },
    Cell: function cellFunc({value}) {
      let [qcTestType, testTypeDisplayText, cartridgeID, concentration] =
        value.split('___')
      return (
        <div className="whitespace-normal">
          <div>
            {`${qcTestType.toUpperCase()}${
              qcTestType.toUpperCase() === LIQUIDQCQCTESTDISPLAYTEXT
                ? `-${testTypeDisplayText}`
                : ''
            }`}
          </div>

          <Fragment>
            {qcTestType.toUpperCase() === LIQUIDQCQCTESTDISPLAYTEXT ? (
              <div className="text-brand-blue">
                <dt>Cartridge ID:{cartridgeID}</dt>
                <dd>Level: {concentration}</dd>
              </div>
            ) : (
              <div className="text-brand-blue">
                <dt>ETC ID:{cartridgeID}</dt>
              </div>
            )}
          </Fragment>
        </div>
      )
    },
    width: 275,
  }

  // const testTypeObj = {
  //     Header: 'Test Type',
  //     accessor: 'testType',
  //     width: 150,
  // }

  // const cartridgeIdObj = {
  //     Header: 'Cartridge ID',
  //     accessor: 'cartridgeID',
  //     width: 150,
  // }

  // const concentrationObj = {
  //     Header: 'Level',
  //     accessor: 'concentration',
  //     width: 120,
  // }

  const passFailObj = {
    Header: TABLE_RESULTS_HEADER,
    accessor: 'resultPassFail',
    Cell: function cellFunc({value}) {
      const result = value
      let resultClassName = ''
      switch (result) {
        case 'Pass':
          resultClassName = GREENBACKROUND_WITH_DARKGREENTEXT
          break
        case 'Fail':
          resultClassName = REDBACKGROUND_WITH_DARKREDTEXT
          break
        default:
          resultClassName = NEUTRALBACKGROUND_WITH_NEUTRALTEXT
      }
      return (
        <FixSizeBadge color={`${resultClassName} capitalize`} text={value} />
      )
    },
    width: 150,
  }
  const locationObj = {
    Header: TABLE_LOCATION_HEADER,
    accessor: 'facilityName',
    width: 250,
    Cell: function cellFunc({value}) {
      return <div className="whitespace-normal">{value}</div>
    },
  }

  const moreObj = {
    Header: ' ',
    id: 'More',
    accessor: d => d.qcTestID,
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
      ...testInfoObj,
    },

    //FIXME: Map the testResults column from the server in API
    {
      ...passFailObj,
    },
    {
      ...locationObj,
    },
    // {
    //     Header: 'Device Name',
    //     accessor: 'deviceKey',
    //     Cell: ({ value }) => {
    //         return <div className="whitespace-normal truncate">{value}</div>
    //     },
    //     width: 300,
    // },
    {
      Header: TABLE_USER_ID_HEADER,
      accessor: 'deviceUserKey',
      width: 130,
    },
    // {
    //     /**TODO: Get the right accessor from the API */
    //     Header: 'Notices',
    //     accessor: '',
    //     width: 80,
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
      ...testInfoObj,
    },
    {
      ...passFailObj,
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
  //for columnHiding useMediaQuery hook and react-table setups for column hiding

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

  return {
    columns,
    initialState,
  }
}

export default withAuthenticationRequired(QcTestList, getRedirecting(QCINDEX))
