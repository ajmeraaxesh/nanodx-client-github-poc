import {useState, useRef, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'

import {Formik} from 'formik'
import moment from 'moment-timezone'
import {ErrorBoundary} from 'react-error-boundary'
import {useRouter} from 'next/router'
import {v4 as uuidv4} from 'uuid'

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
} from '@components/CommonComponents'

import {FormHolder, FormCol, ReadOnlyInput} from '@components/FormComponents'

import DashboardShell from '@components/DashboardShell'
import {NavigationIcons} from '@components/CustomIcons'

import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'
import useAuth0Token from '@hooks/use-auth0-token'
import {formStates} from '@hooks/use-form-handing'
import useFormHandling from '@hooks/use-form-handing'

import fetcher from '@lib/fetcher'
import {getRedirecting, isBrowser} from '@lib/utils'

import {
  DISABLEDCLASSCSS,
  QCCONTROLNAME,
  QCINDEX,
  LIQUIDQCTEST,
  LIQUIDQCQCTESTDISPLAYTEXT,
  ELECTRONICQCTESTDISPLAYTEXT,
} from '@lib/constants'

import {
  FORM_LIS,
  FORM_CARTRIDGE_ID,
  FORM_ETC_ID,
  TABLE_DEPARTMENT_HEADER,
  TABLE_LOCATION_HEADER,
  FORM_HANDHELD_SERIAL,
  FORM_ANALYZER_SERIAL,
  FORM_NOTES,
  TABLE_USER_ID_HEADER,
  FORM_LQC_LOT,
  FORM_LQC_TEXT,
} from '@lib/Strings'
import useDateTimeFormat from '@hooks/use-date-time-formats'

const QcTestResult = () => {
  const {userScreenAccess} = useValidatePermissions(QCCONTROLNAME)
  const router = useRouter()
  const {qcTestId} = router.query

  const dataIdRef = useRef(uuidv4())
  const {data: qcTestDetails, error: qcTestError} = useDataLib(
    userScreenAccess ? [`qc/${qcTestId}`, dataIdRef.current] : null,
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
      {qcTestError && <OnError error={qcTestError} />}
      {!qcTestError && !qcTestDetails && <Loading />}
      {qcTestDetails && (
        <ErrorBoundary fallback={ErrorFallback}>
          <Card>
            <CardHeader>
              <QcTestHeader details={qcTestDetails} />
            </CardHeader>
            <CardBody>
              <QcTestBody details={qcTestDetails} />
            </CardBody>
          </Card>
        </ErrorBoundary>
      )}
    </DashboardShell>
  )
}

const QcTestHeader = ({details}) => {
  // TODO:FIXME: Replace with settingsStore
  const {currentDateFormat, currentTimeFormat, currentTimeZone} =
    useDateTimeFormat()
  const testId = details.qcTestID
  const tokenRef = useAuth0Token()
  const [downloadError, setDownloadError] = useState(null)
  const isDownloadAllowed = details && details.testLocation
  const disableCursorAndHover = isDownloadAllowed ? '' : DISABLEDCLASSCSS

  const startDownload = e => {
    if (e) {
      e.preventDefault()
    }
    setDownloadError(null)

    fetcher(`qc/file/${testId}`, tokenRef.current).then(
      data => {
        console.log('Patient Test File:: ', typeof data)
        const blob = new Blob([window.atob(data)], {
          type: 'text/csv',
        })
        let url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        document.body.appendChild(a)
        a.style = 'display: none'
        a.href = url
        a.download = details.testLocation
        a.click()
        window.URL.revokeObjectURL(url)
      },
      err => {
        console.log(`Download Error: `, err)
        setDownloadError(err)
      },
    )
  }

  return (
    <Fragment>
      <div className="flex items-center">
        {/* Back Button */}
        <div className="w-2/12">
          <BackButton url={`${QCINDEX}`} />
        </div>

        {/* Patient Icon and user details */}
        <div className="w-8/12">
          <div className="md:flex md:justify-center md:items-center bg-white">
            <NavigationIcons
              className="mx-auto md:mx-0 h-12 w-12 md:h-16 md:w-16 text-brand-dark-gray"
              boxSize="0 0 24 24"
              title="QC"
            />
            <div className="text-center md:text-left md:ml-2 ">
              <h1 className="font-semibold text-brand-dark-blue">
                {` ${
                  details.qcTestType === LIQUIDQCTEST
                    ? LIQUIDQCQCTESTDISPLAYTEXT
                    : ELECTRONICQCTESTDISPLAYTEXT
                }${
                  details.qcTestType === LIQUIDQCTEST
                    ? `-${details.testTypeDisplayText}`
                    : ''
                }
                            `}
              </h1>
              <div className="font-bold text-xs tracking-wider">
                {
                  // TODO:FIXME: Get the DateTimeFormat and Timezone from settings
                  details.analysisStartTime
                    ? moment
                        .tz(details.analysisStartTime, currentTimeZone)
                        .format(`${currentDateFormat} ${currentTimeFormat}`)
                    : moment
                        .tz(details.cartridgeScanTime, currentTimeZone)
                        .format(`${currentDateFormat} ${currentTimeFormat}`)
                }
              </div>
            </div>
          </div>
        </div>

        {/* Download button */}
        <div className="2/12">
          <span className="inline-flex rounded-md shadow-sm">
            <button
              className={`btn inline-flex items-center text-brand-dark-blue ${disableCursorAndHover}`}
              onClick={startDownload}
              disabled={!isDownloadAllowed}
            >
              <svg className="fill-current w-4 h-4 sm:mr-2" viewBox="0 0 20 20">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              <span className="hidden sm:block">Download</span>
            </button>
          </span>
        </div>
      </div>
      {downloadError ? (
        <div className="w-full">
          <OnError error={downloadError} />
        </div>
      ) : null}
    </Fragment>
  )
}

const QcTestBody = ({details}) => {
  const router = useRouter()
  const {edit} = useValidatePermissions(QCCONTROLNAME)
  const tokenRef = useAuth0Token()
  const qcDetailsForm = useFormHandling()
  const qcDetailFormErrorRef = useRef(null)
  const onSubmit = formValues => {
    // Extract the inputs which are not ReadOnlyInput
    //  as they are the only ones that can change
    const submittedValues = {
      notes: formValues.notes,
    }

    qcDetailFormErrorRef.current = null
    qcDetailsForm.setFormProcessingState(formStates.SUBMITTED)

    fetcher(`qc/${details.qcTestID}`, tokenRef.current, {
      body: submittedValues,
      method: 'PUT',
    }).then(
      data => {
        console.log('Edited:: QC Tests :: ', data)
        // setTestSaved(true)
        qcDetailsForm.setFormProcessingState(formStates.SUCCESS)
        setTimeout(() => {
          router.push(`${QCINDEX}`)
        }, 1500)
      },
      error => {
        console.log('QC TestDetail::Error saving testNotes:: ', error)
        // setTestError(error)

        // NOTE:
        // ordering of formProcessingState and qcDetailFormErrorRef matters do not change the order
        // TODO:FIXME: Find a better way on handling form submissions and error
        qcDetailFormErrorRef.current = error
        qcDetailsForm.formProcessingState(formStates.ERROR)
      },
    )
  }

  return (
    <Formik
      enableReinitialize
      //NOTE: The initialvalues are set in accordance with the "name" attribute of
      // the form fields
      initialValues={{
        notes: details.notes || '',

        // ReadOnly fields below
        lis: details.lis,
        deviceUserKey: details.deviceUserKey || '-',
        cartridgeID: details.cartridgeID || details.cartridgePackageID || '-',
        department: details.department || '-',
        facilityName: details.facilityName || '-',
        handheldSerialNumber: details.handheldSerialNumber || '-',
        analyzerSerialNumber: details.analyzerSerialNumber || '-',
        errorCode: details.errorCode || '-',
        errorMessage: details.errorMessage || '-',
        liquidControlLot: details.liquidControlLot || '-',
        liquidControlText: details.liquidControlText || '-',
      }}
      onSubmit={onSubmit}
    >
      {formik => (
        <form autoComplete="false" onSubmit={formik.handleSubmit}>
          <FormHolder>
            {/** Circular UI displaying QC Test results */}
            <QCTestResult details={details} />
            <FormCol colWidth="sm:col-span-6">
              <ReadOnlyInput
                label={`${FORM_LIS}: `}
                name="lis"
                inputClassName={`${
                  details.lis.toLowerCase() === 'not sent'
                    ? 'text-brand-red'
                    : 'text-brand-greem'
                } font-semibold uppercase`}
              />
            </FormCol>
            {/*
                                TODO:FIXME: Hiding test type and test details for EQC and LQC
                                as requested

                                <React.Fragment>
                                    <FormCol colWidth="sm:col-span-3">
                                        <ReadOnlyInput
                                            label="Test Type: "
                                            value={
                                                details.testTypeDisplayText ||
                                                '-'
                                            }
                                        />
                                    </FormCol>
                                    <FormCol colWidth="sm:col-span-3">
                                        <ReadOnlyInput
                                            label="Test Results: "
                                            value={details.concentration || '-'}
                                        />
                                    </FormCol>
                                </React.Fragment> */}
            <FormCol colWidth="sm:col-span-3">
              <ReadOnlyInput
                name="deviceUserKey"
                label={`${TABLE_USER_ID_HEADER}: `}
              />
            </FormCol>
            <FormCol colWidth="sm:col-span-3">
              <ReadOnlyInput
                label={`${
                  details.qcTestType === LIQUIDQCTEST
                    ? FORM_CARTRIDGE_ID
                    : FORM_ETC_ID
                }:`}
                name="cartridgeID"
              />
            </FormCol>
            <FormCol colWidth="sm:col-span-3">
              <ReadOnlyInput
                label={`${TABLE_LOCATION_HEADER}: `}
                name="facilityName"
              />
            </FormCol>
            <FormCol colWidth="sm:col-span-3">
              <ReadOnlyInput
                label={`${TABLE_DEPARTMENT_HEADER}: `}
                name="department"
              />
            </FormCol>
            <FormCol colWidth="sm:col-span-3">
              <ReadOnlyInput
                label={`${FORM_HANDHELD_SERIAL}: `}
                name="handheldSerialNumber"
              />
            </FormCol>
            <FormCol colWidth="sm:col-span-3">
              <ReadOnlyInput
                label={`${FORM_ANALYZER_SERIAL}: `}
                name="analyzerSerialNumber"
              />
            </FormCol>
            {details.qcTestType === LIQUIDQCTEST && (
              <>
                <FormCol colWidth="sm:col-span-2">
                  <ReadOnlyInput
                    label={`${FORM_LQC_LOT}: `}
                    name="liquidControlLot"
                  />
                </FormCol>
                <FormCol colWidth="sm:col-span-4">
                  <ReadOnlyInput
                    label={`${FORM_LQC_TEXT}: `}
                    name="liquidControlText"
                  />
                </FormCol>
              </>
            )}

            {details.resultPassFail === '0' && (
              <>
                <FormCol colWidth="sm:col-span-3">
                  <ReadOnlyInput label="Error Code: " name="errorCode" />
                </FormCol>
                <FormCol colWidth="sm:col-span-3">
                  <ReadOnlyInput label="Error Message: " name="errorMessage" />
                </FormCol>
              </>
            )}
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
                placeholder={FORM_NOTES}
                name="notes"
                disabled={!edit}
                {...formik.getFieldProps('notes')}
              ></textarea>
            </FormCol>
          </FormHolder>
          {!edit ? null : (
            <div className="mt-4">
              <SubmitFormButton
                currentForm={qcDetailsForm}
                error={qcDetailFormErrorRef}
              />
            </div>
          )}
        </form>
      )}
    </Formik>
  )
}

const QCTestResult = ({details}) => {
  const result = details.resultPassFail.toLowerCase()
  let resultUpperHalfCircle = ''
  let resultLowerHalfCircle = ''

  switch (result) {
    case 'pass':
      resultUpperHalfCircle = 'bg-brand-light-green'
      resultLowerHalfCircle = 'bg-brand-green'
      break
    case 'fail':
      resultUpperHalfCircle = 'bg-brand-light-red'
      resultLowerHalfCircle = 'bg-brand-red'
      break
    default:
      resultUpperHalfCircle = 'bg-brand-light-yellow'
      resultLowerHalfCircle = 'bg-brand-yellow'
  }
  return (
    <FormCol
      colWidth="sm:col-span-6"
      className={`px-4 py-2 border border-gray-300
                                                rounded-lg shadow-sm`}
    >
      <div className="flex flex-col-reverse space-y-reverse space-y-4 sm:flex-row items-center justify-center ">
        {/* <div className="sm:w-1/3">
                    {//TODO:FIXME: In case more data needs to be shown then divide the data another flexbox based UI }
                    {details.qcTestType === LIQUIDQCTEST &&
                    details.liquidControlText ? (
                        <div>
                            <dt className="text-brand-blue text-xs font-semibold tracking-wider sm:text-left capitalize">
                                Liquid Control:
                            </dt>
                            <dd className="text-brand-dark-blue text-sm font-semibold break-words">
                                {details.liquidControlText}
                            </dd>
                        </div>
                    ) : (
                        <div className="">
                            {//TODO:remove the left spacing in case any data needs to be shown for LQC }
                            <dt></dt>
                            <dd></dd>
                        </div>
                    )}
                </div> */}
        {/*Circular UI for result */}
        <div className="font-montserrat-medium">
          <div className=" flex flex-col space-y-1 ">
            <div
              className={` font-semibold rounded-t-full
                                            ${resultUpperHalfCircle} text-gray-900 w-64 h-32  text-center `}
            >
              <dt
                className={
                  details.qcTestType === LIQUIDQCTEST ? 'mt-10' : 'mt-16'
                }
              >
                {`${
                  details.qcTestType === LIQUIDQCTEST
                    ? LIQUIDQCQCTESTDISPLAYTEXT
                    : ELECTRONICQCTESTDISPLAYTEXT
                }`}
              </dt>
              {details.qcTestType === LIQUIDQCTEST ? (
                <dd className="w-48 mx-auto">{details.liquidControlText}</dd>
              ) : (
                <dd className="px-12  pt-4"></dd>
              )}
            </div>
            <div
              className={`align-top uppercase font-semibold text-center tracking-widest rounded-b-full
                                                ${resultLowerHalfCircle} text-white w-64 h-32 pt-4`}
            >
              <span className="">{result}</span>
            </div>
          </div>
        </div>
      </div>
    </FormCol>
  )
}

export default withAuthenticationRequired(
  QcTestResult,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
