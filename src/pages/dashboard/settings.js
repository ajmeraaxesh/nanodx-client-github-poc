import {useRef} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {useRouter} from 'next/router'
import {Formik} from 'formik'
import * as Yup from 'yup'
import {ErrorBoundary} from 'react-error-boundary'
import {v4 as uuidv4} from 'uuid'

import DashboardShell from '@components/DashboardShell'
import {
  ErrorFallback,
  Loading,
  OnError,
  UnAuthorizedAccess,
  SubmitFormButton,
  Card,
  CardHeader,
  DetailsHeader,
  CardBody,
} from '@components/CommonComponents'

import {
  FormHolder,
  FormCol,
  ReadOnlyInput,
  SelectOption,
  RequiredFieldInfo,
} from '@components/FormComponents'

import {getRedirecting, isBrowser} from '@lib/utils'
import {SETTINGSCONTROLNAME, HOMEPAGE} from '@lib/constants'

import useDataLib from '@hooks/use-data-lib'
import useFormHandling, {formStates} from '@hooks/use-form-handing'
import useAuth0Token from '@hooks/use-auth0-token'
import fetcher from '@lib/fetcher'
import useSettingstore from '@hooks/use-settings-store'
import useValidatePermissions from '@hooks/use-validate-permissions'

import {
  FORM_SETTINGS_LOGIN_TIMEOUT,
  FORM_SETTINGS_DATE_FORMAT,
  FORM_SETTINGS_TIME_FORMAT,
  FORM_SETTINGS_TIME_ZONE,
} from '@lib/Strings'

const Settings = () => {
  const dataIdRef = useRef(uuidv4())
  const {userScreenAccess} = useValidatePermissions(SETTINGSCONTROLNAME)
  const {data: accountSettingsData, error: accountSettingsError} = useDataLib(
    userScreenAccess
      ? ['account/settings-with-lists', dataIdRef.current]
      : null,
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
      {accountSettingsError && <OnError error={accountSettingsError} />}
      {!accountSettingsData && !accountSettingsError && <Loading />}
      {accountSettingsData && (
        <ErrorBoundary fallback={ErrorFallback}>
          <Card>
            <CardHeader>
              <DetailsHeader headerTitle="Settings" backButtonUrl={HOMEPAGE} />
            </CardHeader>
            <CardBody>
              <RequiredFieldInfo />
              <SettingsFormContent accountSettings={accountSettingsData} />
            </CardBody>
          </Card>
        </ErrorBoundary>
      )}
    </DashboardShell>
  )
}

const SettingsFormContent = ({accountSettings}) => {
  const settingsForm = useFormHandling()
  const settingsFormErrorRef = useRef(null)
  const tokenRef = useAuth0Token()
  const router = useRouter()
  const updateSettings = useSettingstore(state => state.updateSettings)

  const onSubmit = formValues => {
    const selectedDateFormat = accountSettings.dateFormats.filter(
      format => format.keywordID === formValues.dateFormatID,
    )
    const selectedTimeFormat = accountSettings.timeFormats.filter(
      format => format.keywordID === formValues.timeFormatID,
    )

    formValues = {
      ...formValues,
      dateFormat: selectedDateFormat[0].keywordText,
      timeFormat: selectedTimeFormat[0].keywordText,
    }

    updateSettings(formValues)
    settingsFormErrorRef.current = null
    settingsForm.setFormProcessingState(formStates.SUBMITTED)

    fetcher(`account/settings`, tokenRef.current, {body: formValues}).then(
      data => {
        settingsForm.setFormProcessingState(formStates.SUCCESS)
        setTimeout(() => {
          router.push(`${HOMEPAGE}`)
        }, 1500)
      },
      error => {
        console.log('Settings::Error saving settings:: ', error)
        settingsFormErrorRef.current = error
        settingsForm.setFormProcessingState(formStates.ERROR)
      },
    )
  }

  return (
    <Formik
      enableReinitialize
      //NOTE: The initialvalues are set in accordance with the "name" attribute of
      // the form fields
      initialValues={{
        loginTimeout: accountSettings.loginTimeout,
        dateFormatID: accountSettings.dateFormatID,
        timeFormatID: accountSettings.timeFormatID,
        timeZone: accountSettings.timeZone,
        languageCode: accountSettings.languageCode || '-',
      }}
      validationSchema={Yup.object({
        loginTimeout: Yup.string().required(true),
        dateFormatID: Yup.string().required(true),
        timeFormatID: Yup.string().required(true),
        timeZone: Yup.string().required(true),
      })}
      onSubmit={onSubmit}
    >
      {formik => (
        <form autoComplete="off" onSubmit={formik.handleSubmit}>
          <FormHolder>
            <FormCol colWidth="sm:col-span-3">
              <SelectOption
                name="loginTimeout"
                label={`${FORM_SETTINGS_LOGIN_TIMEOUT}:`}
              >
                {['30', '45', '60'].map((attempt, index) => (
                  <option key={`timeout${index}`} value={attempt}>
                    {attempt}
                  </option>
                ))}
              </SelectOption>
            </FormCol>

            <FormCol colWidth="sm:col-span-3">
              <SelectOption
                name="dateFormatID"
                label={`${FORM_SETTINGS_DATE_FORMAT}:`}
              >
                {accountSettings.dateFormats.map(format => (
                  <option key={format.keywordID} value={format.keywordID}>
                    {format.keywordText}
                  </option>
                ))}
              </SelectOption>
            </FormCol>

            <FormCol colWidth="sm:col-span-2">
              <SelectOption
                name="timeFormatID"
                label={`${FORM_SETTINGS_TIME_FORMAT}: `}
              >
                {accountSettings.timeFormats.map(format => (
                  <option key={format.keywordID} value={format.keywordID}>
                    {format.keywordText}
                  </option>
                ))}
              </SelectOption>
            </FormCol>

            <FormCol colWidth="sm:col-span-4">
              <SelectOption
                name="timeZone"
                label={`${FORM_SETTINGS_TIME_ZONE}: `}
              >
                {accountSettings.timeZones.map(timeZone => (
                  <option key={timeZone.id} value={timeZone.id}>
                    {`${timeZone.id} ${timeZone.displayName}`}
                  </option>
                ))}
              </SelectOption>
            </FormCol>
            <FormCol colWidth="sm:col-span-6">
              <ReadOnlyInput label="Language: " name="languageCode" />
            </FormCol>
          </FormHolder>

          <div className="mt-4">
            <SubmitFormButton
              currentForm={settingsForm}
              error={settingsFormErrorRef}
            />
          </div>
        </form>
      )}
    </Formik>
  )
}

export default withAuthenticationRequired(
  Settings,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
