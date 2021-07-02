import {useRef, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'

import {Formik} from 'formik'
import * as Yup from 'yup'
import moment from 'moment-timezone'
import {ErrorBoundary} from 'react-error-boundary'
import router, {useRouter} from 'next/router'
import {v4 as uuidv4} from 'uuid'
import {mutate} from 'swr'

import {
  Card,
  CardHeader,
  CardBody,
  OnError,
  ErrorFallback,
  BackButton,
  Loading,
  SubmitFormButton,
  UnAuthorizedAccess,
  NoticesButton,
} from '@components/CommonComponents'
import {
  FormHolder,
  FormCol,
  EditableInput,
  ReadOnlyInput,
  RequiredFieldInfo,
  SelectOption,
} from '@components/FormComponents'
import {NavigationIcons} from '@components/CustomIcons'
import DashboardShell from '@components/DashboardShell'

import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'
import useAuth0Token from '@hooks/use-auth0-token'
import {formStates} from '@hooks/use-form-handing'
import useFormHandling from '@hooks/use-form-handing'

import fetcher from '@lib/fetcher'
import {getRedirecting, isBrowser} from '@lib/utils'
import useDateTimeFormat from '@hooks/use-date-time-formats'

import {
  SYSTEMSCONTROLNAME,
  SYSTEMSINDEX,
  DISABLEDCLASSCSS,
} from '@lib/constants'

import {
  FORM_SYSTEM_DEVICE_TYPE,
  FORM_SYSTEM_DEVICE_MODEL,
  FORM_SYSTEM_DEVICE_SERIAL,
  TABLE_LOCATION_HEADER,
  TABLE_DEPARTMENT_HEADER,
  FORM_SYSTEM_DEVICE_SOFTWARE,
  FORM_SYSTEM_DEVICE_FIRMWARE,
  TABLE_SYSTEM_INSTALLED_HEADER,
  FORM_SYSTEM_DEVICE_CONTRACT_END_DATE,
  FORM_NOTES,
  TABLE_NAME_HEADER,
} from '@lib/Strings'

const DeviceDetails = () => {
  const {userScreenAccess} = useValidatePermissions(SYSTEMSCONTROLNAME)
  const router = useRouter()
  const {systemId} = router.query

  const dataIdRef = useRef(uuidv4())
  const {data: deviceDetails, error: deviceError} = useDataLib(
    userScreenAccess
      ? [userScreenAccess ? `device/${systemId}` : null, dataIdRef.current]
      : null,
  )

  const {data: facilities, error: facilitiesError} = useDataLib(
    userScreenAccess ? [`facility`] : null,
  )

  const {data: systemDepartments, error: systemDepartmentsError} = useDataLib(
    userScreenAccess ? [`keyword/department`] : null,
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
      {deviceError && <OnError error={deviceError} />}
      {facilitiesError && <OnError error={facilitiesError} />}
      {systemDepartmentsError && <OnError error={systemDepartmentsError} />}
      {(!deviceDetails || !facilities || !systemDepartments) && <Loading />}
      {deviceDetails && facilities && systemDepartments && (
        <ErrorBoundary fallback={ErrorFallback}>
          <Card>
            <CardHeader>
              <DeviceHeader data={deviceDetails} />
            </CardHeader>
            <CardBody>
              <DeviceBody
                data={deviceDetails}
                facilities={facilities}
                departments={systemDepartments}
              />
            </CardBody>
          </Card>
        </ErrorBoundary>
      )}
    </DashboardShell>
  )
}

const DeviceHeader = ({data}) => {
  const router = useRouter()
  const {systemId} = router.query
  return (
    <div className="flex items-center flex-wrap ">
      <div className="w-1/12 ">
        <BackButton url={`${SYSTEMSINDEX}`} />
      </div>
      <div className="w-11/12 flex justify-between items-center">
        {/* <img
                    className="h-16 w-16 md:h-24 md:w-24 rounded-full mx-auto md:mx-0 md:mr-6"
                    src="avatar.jpg"
                    alt="Systems"
                /> */}
        <div className="sm:flex sm:items-center sm:space-x-4 ml-16">
          <NavigationIcons
            className="h-20 w-20  mx-auto md:mx-0 text-brand-dark-gray"
            boxSize="0 0 24 24"
            title="Systems"
          />
          <div className="text-center mt-2 sm:mt-0 sm:text-left ">
            <div className="uppercase tracking-wide text-sm text-brand-dark-gray font-tradegothic-bold">
              {data.deviceType}
            </div>
            <div className="uppercase tracking-block mt-1 text-lg leading-tight space-x-2 text-brand-dark-blue font-tradegothic-bold ">
              {data.deviceKey}
            </div>
          </div>
        </div>

        <NoticesButton
          count={data.unreadNoticeCount}
          onClick={() =>
            router.push(
              `${SYSTEMSINDEX}/${systemId}/notices?deviceSerial=${data.deviceKey}`,
            )
          }
        />
      </div>

      {/* <div className=" w-full sm:w-3/12"></div> */}
    </div>
  )
}

const DeviceBody = ({data, facilities, departments}) => {
  const router = useRouter()
  const tokenRef = useAuth0Token()
  const {edit} = useValidatePermissions(SYSTEMSCONTROLNAME)
  const systemTestDetailsForm = useFormHandling()
  const systemTestFormErrorRef = useRef(null)

  // TODO:FIXME: Get the dateformat from settings store
  const dateTimeFormat = useDateTimeFormat()

  const onSubmit = formValues => {
    // Extract the inputs which are not ReadOnlyInput as they are the only ones that can change
    const submittedValues = {
      facilityID: formValues.facilityID,
      department: formValues.department,
      notes: formValues.notes,
      deviceName: formValues.deviceName,
    }
    systemTestFormErrorRef.current = null
    systemTestDetailsForm.setFormProcessingState(formStates.SUBMITTED)

    fetcher(`device/${data.deviceID}`, tokenRef.current, {
      method: 'PUT',
      body: submittedValues,
    }).then(
      apiData => {
        console.log('SystemDetail:: Facility Saved:: Success:: ', apiData)
        //setSystemSaved(true)
        systemTestDetailsForm.setFormProcessingState(formStates.SUCCESS)
        //mutate(`device/${deviceID}`)

        setTimeout(() => {
          mutate('device')
          router.push(`${SYSTEMSINDEX}`)
        }, 1500)
      },
      apiError => {
        console.log('SystemDetail:: Facility Saved:: Error:: ', apiError)
        //setSystemSaveError(apiError)
        systemTestFormErrorRef.current = apiError
        systemTestDetailsForm.setFormProcessingState(formStates.ERROR)
      },
    )
  }

  return (
    <Fragment>
      <RequiredFieldInfo />
      <Formik
        enableReinitialize
        //NOTE: The initialvalues are set in accordance with the "name" attribute of
        // the form fields
        initialValues={{
          facilityID: data.facilityID || '',
          department: data.department || '',
          notes: data.notes || '',
          deviceName: data.deviceName || '',

          // Read only Input
          deviceType: data.deviceType || '',
          model: data.model || '',
          serialNumber: data.serialNumber || data.deviceKey,
          softwareVersion: data.softwareVersion || '',
          firmwareVersion: data.firmwareVersion || '',
          installDate: data.installDate
            ? moment
                .tz(data.installDate, dateTimeFormat.currentTimeZone)
                .format(
                  `${dateTimeFormat.currentDateFormat} ${dateTimeFormat.currentTimeFormat}`,
                )
            : '',
          expirationDate: data.expirationDate
            ? moment
                .tz(data.expirationDate, dateTimeFormat.currentTimeZone)
                .format(
                  `${dateTimeFormat.currentDateFormat} ${dateTimeFormat.currentTimeFormat}`,
                )
            : '',
        }}
        validationSchema={Yup.object({
          facilityID: Yup.string().required(true),
          //TODO: Confirm if department is needed or not
        })}
        onSubmit={onSubmit}
      >
        {formik => (
          <form onSubmit={formik.handleSubmit}>
            <FormHolder>
              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${FORM_SYSTEM_DEVICE_TYPE}:`}
                  name="deviceType"
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${TABLE_NAME_HEADER}:`}
                  aria-label={`${TABLE_NAME_HEADER}`}
                  name="deviceName"
                  placeholder={`${TABLE_NAME_HEADER}`}
                  disabled={!edit}
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${FORM_SYSTEM_DEVICE_MODEL}:`}
                  name="model"
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${FORM_SYSTEM_DEVICE_SERIAL}:`}
                  name="serialNumber"
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <SelectOption
                  name="facilityID"
                  label={`${TABLE_LOCATION_HEADER}:`}
                  disabled={!edit}
                  required
                >
                  <option key={`facilities_000`} value="">
                    Select Location
                  </option>
                  {facilities.map(facility => (
                    <option
                      key={`${facility.facilityID}`}
                      value={facility.facilityID}
                    >
                      {facility.facilityName}
                    </option>
                  ))}
                </SelectOption>
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <SelectOption
                  name="department"
                  label={`${TABLE_DEPARTMENT_HEADER}:`}
                  disabled={!edit}
                >
                  <option key={`systemdept_000`} value="">
                    Select Department
                  </option>
                  {departments.map(department => (
                    <option
                      key={`systemdept${department.keywordID}`}
                      value={department.keywordText}
                    >
                      {department.keywordText}
                    </option>
                  ))}
                </SelectOption>
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                {data.deviceType.toLowerCase() === 'handheld' ? (
                  <ReadOnlyInput
                    label={`${FORM_SYSTEM_DEVICE_SOFTWARE}`}
                    name="softwareVersion"
                  />
                ) : (
                  <ReadOnlyInput
                    name="firmwareVersion"
                    label={`${FORM_SYSTEM_DEVICE_FIRMWARE}`}
                  />
                )}
              </FormCol>
              <FormCol colWidth="sm:col-span-3"></FormCol>

              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${TABLE_SYSTEM_INSTALLED_HEADER}:`}
                  name="installDate"
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${FORM_SYSTEM_DEVICE_CONTRACT_END_DATE}`}
                  name="expirationDate"
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-6">
                <span className=" sm:text-sm sm:leading-5 text-brand-dark-blue font-tradegothic-bold">
                  {FORM_NOTES}:
                </span>
                <textarea
                  className={` form-textarea mt-1 block w-full
                                                focus:outline-none ${
                                                  !edit ? DISABLEDCLASSCSS : ''
                                                }`}
                  rows="3"
                  placeholder={`${FORM_NOTES}`}
                  name="notes"
                  disabled={!edit}
                  {...formik.getFieldProps('notes')}
                ></textarea>
              </FormCol>
            </FormHolder>

            {!edit ? null : (
              <div className="mt-4">
                <SubmitFormButton
                  currentForm={systemTestDetailsForm}
                  error={systemTestFormErrorRef}
                />
              </div>
            )}
          </form>
        )}
      </Formik>
    </Fragment>
  )
}

export default withAuthenticationRequired(
  DeviceDetails,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
