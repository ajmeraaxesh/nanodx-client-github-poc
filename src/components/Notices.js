import {
  BackButton,
  HeaderWithStartEndDates,
  ListLoading,
  Loading,
  OnError,
  ScreenHeader,
  UnAuthorizedAccess,
} from '@components/CommonComponents'
import DashboardShell from '@components/DashboardShell'
import Table from '@components/Table'
import useDataLib from '@hooks/use-data-lib'
import useDateTimeFormat from '@hooks/use-date-time-formats'
import useInput from '@hooks/use-input'
import {APIDATEFORMAT, SYSTEMSCONTROLNAME} from '@lib/constants'
import {getRedirecting, isBrowser} from '@lib/utils'
import moment from 'moment-timezone'
import {useRouter} from 'next/router'
import {Fragment, useMemo, useRef} from 'react'

import fetcher from '@lib/fetcher'
import useAuth0Token from '@hooks/use-auth0-token'
import useFormHandling, {formStates} from '@hooks/use-form-handing'

const Notices = ({
  noticeTitle = '',
  noticeFetchApi = null,
  noticeSaveApiHandler = null,
  noticeSaveApi = null,
  defaultStatus = 'unread',
}) => {
  const startDateInput = useInput(moment().subtract(7, 'days'))
  const startDateFocused = useInput(null)
  const endDateInput = useInput(moment())
  const endDateFocused = useInput(null)

  const noticeTypeInput = useInput(defaultStatus)

  return (
    <Fragment>
      <NoticeHeader
        noticeTitle={noticeTitle}
        start={startDateInput}
        startFocused={startDateFocused}
        startDateId="noticeStart"
        startDatePlaceHolder="Notice Start Date"
        end={endDateInput}
        endFocused={endDateFocused}
        endDateId="noticeEnd"
        endDatePlaceHolder="Notice End Date"
        type={noticeTypeInput}
      />
      <NoticeData
        start={startDateInput.value}
        end={endDateInput.value}
        type={noticeTypeInput.value}
        noticeFetchApi={noticeFetchApi}
        updateNoticeStatus={noticeSaveApiHandler}
        updateNoticeStatusApi={noticeSaveApi}
      />
    </Fragment>
  )
}

const NoticeHeader = ({type, noticeTitle, ...dateProps}) => {
  return (
    <Fragment>
      <ScreenHeader>{noticeTitle}</ScreenHeader>
      <div className="flex flex-col sm:flex-row justify-between items-center  py-3">
        <BackButton />
        {/** Dates and notice status */}
        <div className="flex flex-col md:flex-row md:justify-center md:items-center  md:space-x-2">
          <HeaderWithStartEndDates {...dateProps} />
          <div>
            <span>
              <span className="">Status:</span>
            </span>
            <div>
              <select
                className="form-select block w-full py-3"
                onChange={e => type.setValue(e.target.value)}
                value={type.value}
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </Fragment>
  )
}

const NoticeData = ({
  start,
  end,
  type,
  noticeFetchApi,
  updateNoticeStatus,
  updateNoticeStatusApi,
}) => {
  let typeParamValue = ''
  if (type === 'read') {
    typeParamValue = 'true'
  } else if (type === 'unread') {
    typeParamValue = 'false'
  }

  const apiUrl = `${noticeFetchApi}?startdate=${start.format(
    APIDATEFORMAT,
  )}&enddate=${end.format(APIDATEFORMAT)}${
    type === 'all' ? '' : '&isRead='
  }${typeParamValue}`

  console.log('Notice: ', {apiUrl})
  const {data: noticeData, error: noticeError, mutate} = useDataLib([apiUrl])

  return (
    <Fragment>
      {noticeError && <OnError error={noticeError} />}
      {!noticeError && !noticeData && <ListLoading />}
      {noticeData && (
        <NoticesGrid
          data={noticeData}
          updateNoticeStatus={updateNoticeStatus}
          updateNoticeStatusApi={updateNoticeStatusApi}
          type={type}
          noticeMutate={mutate}
        />
      )}
    </Fragment>
  )
}

const NoticesGrid = ({
  data,
  updateNoticeStatus = null,
  updateNoticeStatusApi = null,
  type,
  noticeMutate,
}) => {
  const noticesData = useMemo(() => data, [data])
  const tableColumns = useNoticesColumns(type)
  const tokenRef = useAuth0Token()
  const noticeStatus = useFormHandling()
  const noticeStatusFormErrorRef = useRef(null)

  const columns = useMemo(() => tableColumns.columns, [tableColumns])
  const initialState = tableColumns.initialState

  const handleSelectedRows = selectedRows => {
    console.log('General rows: ', selectedRows)
    if (selectedRows.length < 1) {
      return
    }

    if (updateNoticeStatus) {
      const shouldMarkAsRead = type === 'read'
      updateNoticeStatus(selectedRows, shouldMarkAsRead)
    } else {
      console.log('Selected Rows: ', selectedRows)
      const noticeIDList = selectedRows.map(row => row.original.noticeID)
      console.log(noticeIDList, noticeIDList.join(','), updateNoticeStatusApi)

      noticeStatus.setFormProcessingState(formStates.SUBMITTED)
      noticeStatusFormErrorRef.current = null

      // then call mutate
      fetcher(
        `${updateNoticeStatusApi}/${noticeIDList.join(',')}`,
        tokenRef.current,
        {
          method: 'PUT',
          body: {
            read: type === 'read' ? false : true,
          },
        },
      ).then(
        apiData => {
          console.log('NoticeStatus:: Success:: ', apiData)
          //setSystemSaved(true)
          noticeStatus.setFormProcessingState(formStates.SUCCESS)
          //mutate(`device/${deviceID}`)
          noticeMutate()
        },
        apiError => {
          console.log('NoticeStatus:: Error:: ', apiError)
          //setSystemSaveError(apiError)
          noticeStatusFormErrorRef.current = apiError
          noticeStatus.setFormProcessingState(formStates.ERROR)
        },
      )
    }
  }

  return (
    <Fragment>
      {noticeStatusFormErrorRef.current && (
        <OnError error={noticeStatusFormErrorRef.current} />
      )}
      <Table
        columns={columns}
        data={noticesData}
        initialState={initialState}
        tableType="notices"
        onNoticeClick={handleSelectedRows}
        noticeType={type}
        rowHeight={60}
      />
    </Fragment>
  )
}

const useNoticesColumns = noticeStatus => {
  const {formatTime} = useDateTimeFormat()

  const defaulCellDisplay = ({row, value}) => {
    const readUnreadClassname =
      noticeStatus !== 'read' && !row.original.isRead ? 'font-bold' : ''
    return <div className={readUnreadClassname}>{value}</div>
  }

  const columns = [
    {
      Header: 'Time Sent',
      id: 'createdTime',
      accessor: d => moment(d.createdTime).format('x'),
      Cell: function cellFunc({row, value}) {
        const intValue = parseInt(value)
        const formattedTime = formatTime(intValue)
        const [date, time, timeZone] = formattedTime.split(' ')
        const fullTime = timeZone !== undefined ? time + ' ' + timeZone : time
        // console.log(
        //   'NoticeTime::DateTime:: ',
        //   {noticeStatus},
        //   row.original.isRead,
        // )
        const readUnreadClassname =
          noticeStatus !== 'read' && !row.original.isRead ? 'font-bold' : ''

        return (
          <div className={readUnreadClassname}>
            <div>{date}</div>
            <div>{fullTime}</div>
          </div>
        )
      },
    },
    {
      Header: 'Message',
      accessor: 'message',
      width: 350,
      Cell: defaulCellDisplay,
    },
    {
      Header: 'Details',
      accessor: 'detail',
      Cell: defaulCellDisplay,
    },
  ]
  return {
    columns,
    initialState: {},
  }
}

export default Notices
