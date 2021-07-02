import {useState, useRef, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'

import {ArrowDownIcon, UserIcon} from '@heroicons/react/solid'

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
  CartridgeImage,
} from '@components/CommonComponents'

import {
  FormHolder,
  FormCol,
  CheckboxHolder,
  CheckboxInput,
  ReadOnlyInput,
} from '@components/FormComponents'

import DashboardShell from '@components/DashboardShell'

import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'
import useAuth0Token from '@hooks/use-auth0-token'
import {formStates} from '@hooks/use-form-handing'

import fetcher from '@lib/fetcher'
import {getRedirecting, isBrowser} from '@lib/utils'

import {
  DISABLEDCLASSCSS,
  TESTSCONTROLNAME,
  TESTINDEX,
  COVIDTESTTYPE,
  TBITESTTYPE,
} from '@lib/constants'

import {
  FORM_LIS,
  FORM_PATIENT_ID,
  FORM_PATIENT_NAME,
  FORM_PATIENT_AGE,
  FORM_CARTRIDGE_ID,
  FORM_HANDHELD_SERIAL,
  FORM_ANALYZER_SERIAL,
  FORM_USER,
  TABLE_USER_ID_HEADER,
  TABLE_LOCATION_HEADER,
  TABLE_DEPARTMENT_HEADER,
  FORM_NOTES,
  FORM_TEST_NO_RESULTS,
  FORM_TBI_GLASSGOW_SCALE,
  FORM_TBI_INJURY_SINCE,
  FORM_TBI_LOSS_OF_CONSCIOUSNESS,
  FORM_TBI_POLYTRAUMA,
  FORM_TBI_RESULT_SCORE,
  FORM_TBI_RESULT_CT_SCAN,
  FORM_TBI_RESULT_GFAP,
  FORM_TBI_RESULT_S100B,
  FORM_TBI_RESULT_CT_SCAN_DATA,
  FORM_TBI_RESULT_CT_SCAN_PERFORMED,
  FORM_TBI_RESULT_POSITIVE,
  FORM_COVID_SPECIMEN_TYPE,
  FORM_COVID_ANTIGEN,
} from '@lib/Strings'
import useFormHandling from '@hooks/use-form-handing'
import useDateTimeFormat from '@hooks/use-date-time-formats'

const TestResult = () => {
  const {userScreenAccess} = useValidatePermissions(TESTSCONTROLNAME)
  const router = useRouter()
  const {testId} = router.query

  const dataIdRef = useRef(uuidv4())
  const {data: testDetails, error: testError} = useDataLib(
    userScreenAccess ? [`PatientTest/${testId}`, dataIdRef.current] : null,
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
      {testError && <OnError error={testError} />}
      {!testError && !testDetails && <Loading />}
      {testDetails && (
        <ErrorBoundary fallback={ErrorFallback}>
          <Card>
            <CardHeader>
              <TestHeader details={testDetails} />
            </CardHeader>
            <CardBody>
              <TestBody details={testDetails} />
            </CardBody>
          </Card>
        </ErrorBoundary>
      )}
    </DashboardShell>
  )
}

const TestHeader = ({details}) => {
  const {currentDateFormat, currentTimeFormat, currentTimeZone} =
    useDateTimeFormat()

  const testId = details.patientTestID
  const tokenRef = useAuth0Token()
  const [downloadError, setDownloadError] = useState(null)
  const isDownloadAllowed = details && details.testLocation
  const disableCursorAndHover = isDownloadAllowed ? '' : DISABLEDCLASSCSS

  let patientImageTypeExtension = 'jpg'
  if (details.imageFile) {
    const fileList = details.imageFile.split('.')
    patientImageTypeExtension = fileList[fileList.length - 1]
  }

  const startDownload = e => {
    if (e) {
      e.preventDefault()
    }
    setDownloadError(null)

    fetcher(`PatientTest/file/${testId}`, tokenRef.current).then(
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
      <div className="flex items-center space-x-4">
        {/* Back Button */}
        <div className="w-1/12">
          <BackButton url={`${TESTINDEX}`} />
        </div>

        {/* Patient Image or user icon and patient details */}
        <div className="w-9/12 ">
          <div className=" ml-8 grid grid-cols-3 gap-x-3 ">
            {/* Patient Image or a substitute icon */}
            <div className="mx-auto col-span-1 ">
              {details.imageFileBase64 ? (
                <img
                  src={`data:image/${patientImageTypeExtension};base64,${details.imageFileBase64}`}
                  alt=""
                  className="w-32 h-32 object-cover rounded-full"
                />
              ) : (
                <span className="inline-block h-auto w-24   rounded-full overflow-hidden bg-gray-200">
                  <svg
                    className="h-full w-full text-brand-dark-blue"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
              )}
            </div>

            <div className="col-span-2 my-auto mr-auto">
              <h1 className="w-full flex-none font-semibold text-brand-dark-blue">
                {details.patientName ? details.patientName : ''}{' '}
              </h1>
              <div className="text-base leading-7 font-bold text-brand-blue">
                ID: {details.facilityPatientKey}{' '}
              </div>
            </div>

            <div className="mx-auto col-span-1">
              <CartridgeImage
                testType={details.testType}
                imageClassName="w-12 h-auto"
              />
            </div>

            <div className="col-span-2 mt-2 ">
              <dt
                className={`tracking-widest capitalize text-lg leading-6 font-bold `}
              >
                {details.testTypeDisplayText}
              </dt>
              <dd className="font-bold text-xs tracking-wider">
                {details.patientScanTime
                  ? moment
                      .tz(details.patientScanTime, currentTimeZone)
                      .format(`${currentDateFormat} ${currentTimeFormat}`)
                  : moment
                      .tz(details.analysisStartTime, currentTimeZone)
                      .format(`${currentDateFormat} ${currentTimeFormat}`)}
              </dd>
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
              <ArrowDownIcon className="w-4 h-4" />
              {/* <svg className="fill-current w-4 h-4" viewBox="0 0 20 20">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg> */}
              <span className="hidden sm:ml-2 sm:block">Download</span>
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

const TestBody = ({details}) => {
  console.log('TestBody: ', details)
  const router = useRouter()
  const {edit} = useValidatePermissions(TESTSCONTROLNAME)
  const tokenRef = useAuth0Token()
  const patientTestDetailsForm = useFormHandling()
  const patientTestFormErrorRef = useRef(null)

  const onSubmit = formValues => {
    // NOTE: These are the only values needed by the backend
    // so submitting only the following data
    const submitFormValues = {
      notes: formValues.notes,
      ctScan: formValues.ctScan,
      ctScanOutcome: formValues.ctScanOutcome,
    }

    patientTestFormErrorRef.current = null
    patientTestDetailsForm.setFormProcessingState(formStates.SUBMITTED)
    fetcher(`patienttest/${details.patientTestID}`, tokenRef.current, {
      body: submitFormValues,
      method: 'PUT',
    }).then(
      data => {
        console.log('Edited:: Tests :: ', data)
        patientTestDetailsForm.setFormProcessingState(formStates.SUCCESS)
        setTimeout(() => {
          router.push(TESTINDEX)
        }, 1500)
      },
      error => {
        console.log('TestDetail::Error saving testData:: ', error)
        // NOTE:
        // ordering of formProcessingState and patientTestFormErrorRef matters do not change the order
        patientTestFormErrorRef.current = error
        patientTestDetailsForm.formProcessingState(formStates.ERROR)
      },
    )
  }

  const tbiTestAttributes =
    details.testType === TBITESTTYPE
      ? {
          ctScan: details.ctScan,
          ctScanOutcome: details.ctScanOutcome,
          glasgowScale: details.glasgowScale || '-',
          timeSinceInjury: details.timeSinceInjury || '-',
          lossOfConsciousness: details.lossOfConsciousness || '-',
          polyTrauma:
            details.polytrauma.toLowerCase() === 'false' ? false : true,
        }
      : {}

  return (
    <Fragment>
      <Formik
        enableReinitialize
        // NOTE: The initialvalues are set in accordance with the "name" attribute of
        // the form fields
        initialValues={{
          lis: details.lis || '-',
          facilityPatientKey: details.facilityPatientKey || '-',
          patientName: details.patientName || '-',
          patientAge: details.patientAge || '-',
          cartridgeID: details.cartridgeID || '-',
          handheldSerialNumber: details.handheldSerialNumber || '-',
          analyzerSerialNumber: details.analyzerSerialNumber || '-',
          deviceUserKey: details.deviceUserKey || '-',
          facilityName: details.facilityName || '-',
          department: details.department || '-',
          notes: details.notes || '-',
          ...tbiTestAttributes,
        }}
        onSubmit={onSubmit}
      >
        {formik => (
          <form autoComplete="false" onSubmit={formik.handleSubmit}>
            <FormHolder>
              {details.testType === TBITESTTYPE && (
                <Fragment>
                  <TBITestResultUI details={details} />
                  <TBIPatientAttributesUI details={details} />
                </Fragment>
              )}

              {details.testType === COVIDTESTTYPE && (
                <Fragment>
                  <COVIDTestResultUI details={details} />
                  <COVIDPatientAttributesUI details={details} />
                </Fragment>
              )}

              <FormCol colWidth="sm:col-span-6">
                <ReadOnlyInput
                  label={`${FORM_LIS}: `}
                  name="lis"
                  inputClassName={`${
                    details.lis.toLowerCase() === 'not sent'
                      ? 'text-brand-red'
                      : 'text-brand-green'
                  } font-semibold uppercase`}
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${FORM_PATIENT_ID}: `}
                  name="facilityPatientKey"
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${FORM_PATIENT_NAME}: `}
                  name="patientName"
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-6">
                <ReadOnlyInput
                  label={`${FORM_CARTRIDGE_ID}: `}
                  name="cartridgeID"
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

              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput label={`${FORM_USER}: `} name="deviceUserKey" />
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <ReadOnlyInput
                  label={`${TABLE_USER_ID_HEADER}: `}
                  name="deviceUserKey"
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

              <FormCol colWidth="sm:col-span-6">
                <span className=" sm:text-sm sm:leading-5 text-brand-dark-blue font-tradegothic-bold">
                  {FORM_NOTES}:
                </span>
                <textarea
                  className={`form-textarea mt-1 block w-full
                              focus:outline-none ${edit ? '' : DISABLEDCLASSCSS}
                            `}
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
                  currentForm={patientTestDetailsForm}
                  error={patientTestFormErrorRef}
                />
              </div>
            )}
          </form>
        )}
      </Formik>
    </Fragment>
  )
}

const COVIDTestResultUI = ({details}) => {
  const result = details.outcome.toLowerCase()

  if (result === 'error') {
    //TODO: replace the message with the actual error contents
    return (
      <FormCol
        colWidth="sm:col-span-6"
        className={`px-4 py-2 border border-gray-300
                                rounded-lg shadow-sm`}
      >
        <OnError header="Test Error" error="Test failed" />
      </FormCol>
    )
  }
  let resultUpperHalfCircle = ''
  let resultLowerHalfCircle = ''

  if (result === 'negative') {
    resultUpperHalfCircle = 'bg-brand-light-green'
    resultLowerHalfCircle = 'bg-brand-green'
  } else if (result === 'positive') {
    resultUpperHalfCircle = 'bg-brand-light-red'
    resultLowerHalfCircle = 'bg-brand-red'
  } else {
    resultUpperHalfCircle = 'bg-brand-light-yellow'
    resultLowerHalfCircle = 'bg-brand-yellow'
  }

  return (
    <Fragment>
      <FormCol
        colWidth="sm:col-span-6"
        className={`px-4 py-2 border border-gray-300
                                rounded-lg shadow-sm`}
      >
        {/* <h4 className="text-center text-lg leading-6 font-medium text-brand-blue">
                    COVID-19
                </h4> */}
        <div className="text-center sm:flex sm:justify-start sm:items-center sm:space-x-12 ">
          <div className="sm:flex sm:items-center">
            <div>
              <dt className="text-brand-blue text-xs font-semibold tracking-wider sm:text-left">
                {FORM_COVID_SPECIMEN_TYPE}:
              </dt>
              <dd className="text-brand-dark-blue font-semibold">
                {details.specimenType}
              </dd>
            </div>
          </div>
          {!details.outcome ? (
            <div className="font-montserrat-medium">{FORM_TEST_NO_RESULTS}</div>
          ) : (
            <div className=" font-montserrat-medium flex justify-center items-center">
              <div className=" flex flex-col space-y-1 ">
                <div
                  className={`align-bottom font-semibold rounded-t-full
                                            ${resultUpperHalfCircle} text-gray-900 w-48 h-24 text-center`}
                >
                  <div className="mt-12">{details.testTypeDisplayText}</div>
                  {/**TODO:FIXME: Replace COVID TEST Type TO BE ANTIGEN/ANTIBODY
                   * based on the data
                   */}
                  <div className="uppercase text-center">
                    {FORM_COVID_ANTIGEN}
                  </div>
                </div>
                <div
                  className={`align-top uppercase font-semibold text-center tracking-widest rounded-b-full
                                                 ${resultLowerHalfCircle} text-white w-48 h-24 pt-4 `}
                >
                  {result}
                </div>
              </div>
            </div>
          )}
        </div>
      </FormCol>
    </Fragment>
  )
}

const COVIDPatientAttributesUI = () => {
  return null
}

const TBITestResultUI = ({details}) => {
  const result = details.outcome.toLowerCase()
  const {edit} = useValidatePermissions(TESTSCONTROLNAME)

  let resultUpperHalfCircle = ''
  let resultLowerHalfCircle = ''
  let outcomeClassName = ''

  if (result === 'negative') {
    resultUpperHalfCircle = 'bg-brand-light-green'
    resultLowerHalfCircle = 'bg-brand-green'
  } else if (result === 'positive') {
    resultUpperHalfCircle = 'bg-brand-light-red'
    resultLowerHalfCircle = 'bg-brand-red'
  } else {
    resultUpperHalfCircle = 'bg-brand-light-yellow'
    resultLowerHalfCircle = 'bg-brand-yellow'
    // added only become the value of "Invalid" in outcome
    // affects the shape of the circle
    outcomeClassName = 'px-2'
  }

  return (
    <Fragment>
      <FormCol
        colWidth="sm:col-span-6"
        className={`px-4 py-2 border border-gray-300
                                rounded-lg shadow-sm`}
      >
        <div className="text-center sm:flex sm:justify-start sm:items-center sm:space-x-12 ">
          {/** The Main part displaying overall result */}
          {!details.outcome ? (
            <div className="font-montserrat-medium">{FORM_TEST_NO_RESULTS}</div>
          ) : (
            <div className="font-montserrat-medium sm:ml-32 flex justify-center items-center  ">
              <div className=" flex flex-col space-y-1 ">
                <div
                  className={`align-bottom font-semibold rounded-t-full
                                            ${resultUpperHalfCircle} text-gray-900 w-64 h-32 `}
                >
                  <dt className="pt-16 font-bold ">-</dt>
                  <dd className="mt-2">
                    {/* {details.testTypeDisplayText} */}
                    {FORM_TBI_RESULT_SCORE}
                  </dd>
                </div>
                <div
                  className={`align-top uppercase font-semibold text-center  rounded-b-full
                                                ${resultLowerHalfCircle} text-white w-64 h-32 pt-4`}
                >
                  <div className={`${outcomeClassName}`}>
                    <dt>
                      {`${FORM_TBI_RESULT_CT_SCAN_DATA} `}
                      {result === 'negative' ? 'Not' : ''}
                    </dt>
                    <dd>Recommended</dd>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div
            className={` ${
              result === 'invalid' ? 'hidden' : 'block'
            } mt-4 sm:mt-0 space-y-4`}
          >
            <div className="flex flex-col space-y-4 font-semibold">
              <div>
                <dt className="text-brand-blue text-xs tracking-wider sm:text-left">
                  {FORM_TBI_RESULT_GFAP}
                </dt>
                <dd className="text-brand-dark-blue ">
                  {details.gfapConcentration} ng/mL
                </dd>
              </div>
              <div>
                <dt className="text-brand-blue text-xs tracking-wider sm:text-left">
                  {FORM_TBI_RESULT_S100B}
                </dt>
                <dd className="text-brand-dark-blue ">
                  {details.s100bConcentration} ng/mL
                </dd>
              </div>
            </div>
          </div>
        </div>
      </FormCol>

      <FormCol colWidth="sm:col-span-6">
        <CheckboxHolder
          label={`${FORM_TBI_RESULT_CT_SCAN}:`}
          className={!edit ? DISABLEDCLASSCSS : ''}
        >
          <CheckboxInput name="ctScan" disabled={!edit}>
            {FORM_TBI_RESULT_CT_SCAN_PERFORMED}
          </CheckboxInput>
          <CheckboxInput name="ctScanOutcome" disabled={!edit}>
            {FORM_TBI_RESULT_POSITIVE}
          </CheckboxInput>
        </CheckboxHolder>
      </FormCol>
    </Fragment>
  )
}

const TBIPatientAttributesUI = () => {
  const {edit} = useValidatePermissions(TESTSCONTROLNAME)
  return (
    <Fragment>
      <FormCol colWidth="sm:col-span-3">
        <ReadOnlyInput name="patientAge" label={`${FORM_PATIENT_AGE}: `} />
      </FormCol>
      <FormCol colWidth="sm:col-span-3">
        <ReadOnlyInput
          name="glasgowScale"
          label={`${FORM_TBI_GLASSGOW_SCALE}: `}
        />
      </FormCol>

      <FormCol colWidth="sm:col-span-3">
        <ReadOnlyInput
          name="timeSinceInjury"
          label={`${FORM_TBI_INJURY_SINCE}: `}
        />
      </FormCol>
      <FormCol colWidth="sm:col-span-3">
        <ReadOnlyInput
          name="lossOfConsciousness"
          label={`${FORM_TBI_LOSS_OF_CONSCIOUSNESS}: `}
        />
      </FormCol>

      <FormCol colWidth="sm:col-span-6">
        {/**
          NOTE: The disabled property is passed to holder and input for following reasons:
          1.  The holder needs to be grayed out. if the disabled property needs to be set out to true
          2. The acutal input property should be disabled. Thereby not consuming any user clicks
        */}
        <CheckboxHolder label="" disabled={!edit}>
          <CheckboxInput name="polytrauma" disabled={!edit}>
            {FORM_TBI_POLYTRAUMA}
          </CheckboxInput>
        </CheckboxHolder>
      </FormCol>
    </Fragment>
  )
}

export default withAuthenticationRequired(
  TestResult,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
