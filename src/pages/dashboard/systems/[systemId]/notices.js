import {withAuthenticationRequired} from '@auth0/auth0-react'
import Notices from '@components/Notices'
import DashboardShell from '@components/DashboardShell'
import {UnAuthorizedAccess} from '@components/CommonComponents'
import {SYSTEMSCONTROLNAME} from '@lib/constants'
import useValidatePermissions from '@hooks/use-validate-permissions'
import {getRedirecting, isBrowser} from '@lib/utils'
import {useRouter} from 'next/router'
import {NOTICE_TITLE} from '@lib/Strings'

const SystemNotices = () => {
  const {userScreenAccess} = useValidatePermissions(SYSTEMSCONTROLNAME)
  const router = useRouter()
  const {systemId, deviceSerial} = router.query
  console.log({router}, {systemId}, {deviceSerial})

  if (!userScreenAccess) {
    return (
      <DashboardShell>
        <UnAuthorizedAccess />
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <Notices
        noticeTitle={`${NOTICE_TITLE} ${deviceSerial}`}
        noticeFetchApi={`notice/device/${systemId}`}
        noticeSaveApi={`notice`}
      />
    </DashboardShell>
  )
}

export default withAuthenticationRequired(
  SystemNotices,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
