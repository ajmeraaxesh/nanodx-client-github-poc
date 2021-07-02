import {useMemo} from 'react'
import Link from 'next/link'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {getRedirecting} from '@lib/utils'

import DashboardShell from '@components/DashboardShell'
import {REPORTSINDEX} from '@lib/constants'

import {NavigationIcons} from '@components/CustomIcons'

import {
  REPORT_TEST_TITLE,
  REPORT_TEST_SUBTITLE,
  REPORT_TEST_DESCRIPTION,
  REPORT_USER_TITLE,
  REPORT_USER_SUBTITLE,
  REPORT_USER_DESCRIPTION,
  REPORT_LOCATION_TITLE,
  REPORT_LOCATION_SUBTITLE,
  REPORT_LOCATION_DESCRIPTION,
  REPORT_SYSTEMS_TITLE,
  REPORT_SYSTEMS_SUBTITLE,
  REPORT_SYSTEMS_DESCRIPTION,
} from '@lib/Strings'

const Reports = () => {
  const cardData = useMemo(() => {
    return [
      {
        title: REPORT_TEST_TITLE,
        subtitle: REPORT_TEST_SUBTITLE,
        description: REPORT_TEST_DESCRIPTION,
        path: '/dashboard/reports/tests-summary',
      },
      {
        title: REPORT_USER_TITLE,
        subtitle: REPORT_USER_SUBTITLE,
        description: REPORT_USER_DESCRIPTION,
        path: '/dashboard/reports/users-summary',
      },
      {
        title: REPORT_LOCATION_TITLE,
        subtitle: REPORT_LOCATION_SUBTITLE,
        description: REPORT_LOCATION_DESCRIPTION,
        path: '/dashboard/reports/locations-summary',
      },
      {
        title: REPORT_SYSTEMS_TITLE,
        subtitle: REPORT_SYSTEMS_SUBTITLE,
        description: REPORT_SYSTEMS_DESCRIPTION,
        path: '/dashboard/reports/systems-summary',
      },
    ]
  }, [])
  return (
    <DashboardShell>
      <div className="mt-12 grid gap-5 max-w-4xl mx-auto lg:grid-cols-2">
        {cardData.map(card => (
          <CardWithImage key={card.path} {...card} />
        ))}
      </div>
    </DashboardShell>
  )
}

const CardWithImage = ({title, subtitle, description, path}) => {
  return (
    <div className="flex flex-col rounded-lg shadow-lg overflow-hidden pt-4 ">
      <div className="md:flex md:justify-center bg-white">
        <NavigationIcons
          className="h-12 w-12 md:h-16 md:w-16 mx-auto md:mx-0 text-brand-dark-gray"
          boxSize="0 0 24 24"
          title="Reports"
        />
        <div className="text-center font-tradegothic-bold md:text-left md:ml-2 md:self-center ">
          <h2 className="text-2xl leading-7 font-semibold text-brand-dark-blue uppercase">
            {title}
          </h2>
        </div>
      </div>
      <div className="flex-1 bg-white p-6 flex flex-col">
        <div className="flex-1">
          {/* <p className="text-sm leading-5 font-medium text-indigo-600">
                        <a href="#" className="hover:underline">
                            Blog
                        </a>
                    </p> */}
          <Link href={path}>
            <a>
              <h3 className=" text-xl leading-7 font-semibold text-brand-dark-gray">
                {subtitle}
              </h3>
              <p className="mt-2 text-base font-medium tracking-wide leading-6 text-brand-blue">
                {description}
              </p>
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default withAuthenticationRequired(Reports, getRedirecting(REPORTSINDEX))
