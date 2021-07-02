import {Fragment, useRef, useState} from 'react'
import {useRouter} from 'next/router'
import {getRedirecting, isBrowser} from '@lib/utils'
import {withAuthenticationRequired} from '@auth0/auth0-react'
import {v4 as uuidv4} from 'uuid'
import {ErrorBoundary} from 'react-error-boundary'
import moment from 'moment-timezone'
import {Formik} from 'formik'
import * as Yup from 'yup'
import * as calendarConstants from 'react-dates/constants'
import {ArrowRightIcon} from '@heroicons/react/solid'
import {mutate} from 'swr'

import DashboardShell from '@components/DashboardShell'
import {SingleCalendar} from '@components/DatePickers'
import {NavigationIcons} from '@components/CustomIcons'
import {
  FixSizeBadge,
  Card,
  CardHeader,
  CardBody,
  BackButton,
  UnAuthorizedAccess,
  Loading,
  ErrorFallback,
  AuditTrailButton,
  SubmitFormButton,
  DeleteModal,
  OnError,
} from '@components/CommonComponents'

import {
  RequiredFieldInfo,
  EditableInput,
  SelectOption,
  CheckboxHolder,
  CheckboxInput,
  FormHolder,
  FormCol,
} from '@components/FormComponents'

import fetcher from '@lib/fetcher'

import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'
import useAuth0Token from '@hooks/use-auth0-token'
import useInput from '@hooks/use-input'
import useFormHandling from '@hooks/use-form-handing'
import useDateTimeFormat from '@hooks/use-date-time-formats'
import {formStates} from '@hooks/use-form-handing'

import {
  USERSINDEX,
  USERCONTROLNAME,
  GREENBACKROUND_WITH_DARKGREENTEXT,
  REDBACKGROUND_WITH_DARKREDTEXT,
  DISABLEDCLASSCSS,
} from '@lib/constants'

import {
  FORM_USER_FIRST_NAME,
  FORM_USER_LAST_NAME,
  TABLE_USER_ROLE_HEADER,
  TABLE_DEPARTMENT_HEADER,
  TABLE_LOCATION_HEADER,
  TABLE_STATUS_HEADER,
  FORM_USER_TRAINING_INFO,
  FORM_USER_TRAINING_START,
  FORM_USER_TRAINING_END,
  FORM_USER_EMAIL,
  FORM_PLACHOLDER_ENTER,
  FORM_USER_PHONE,
  FORM_NOTES,
  TABLE_USER_ID_HEADER,
} from '@lib/Strings'

const NEWUSERID = '00000000-0000-0000-0000-000000000000'
let ISNEWUSER = false

const UserDetails = () => {
  const router = useRouter()
  const {userId} = router.query
  const dataIdRef = useRef(uuidv4())

  ISNEWUSER = userId === NEWUSERID

  //NOTE: Keep the URL for portal and device user separately
  //     if needed to show different user at different times

  const {userScreenAccess} = useValidatePermissions(USERCONTROLNAME)
  const {data: userDetailsData, error: userDetailsError} = useDataLib(
    userScreenAccess ? [`user/${userId}`, dataIdRef.current] : null,
  )
  const {data: userRoles, error: userRolesError} = useDataLib(
    userScreenAccess ? [`user/roles`] : null,
  )
  const {data: userDepartments, error: userDepartmentError} = useDataLib(
    userScreenAccess ? [`keyword/department`] : null,
  )

  if (!userScreenAccess) {
    return (
      <DashboardShell>
        <UnAuthorizedAccess />
      </DashboardShell>
    )
  }

  const acutalUserDetailData = userDetailsData
  const actualUserRoles = userRoles
  const actualDepartments = userDepartments

  return (
    <DashboardShell>
      {userDetailsError && <OnError error={userDetailsError} />}
      {userRolesError && <OnError error={userRolesError} />}
      {userDepartmentError && <OnError error={userDepartmentError} />}
      {(!acutalUserDetailData || !actualUserRoles || !actualDepartments) &&
        (!userDetailsError || !userRolesError || !userDepartmentError) && (
          <Loading />
        )}
      {acutalUserDetailData && actualUserRoles && actualDepartments && (
        <ErrorBoundary fallback={ErrorFallback}>
          <Card>
            <CardHeader>
              <UserDetailHeader details={acutalUserDetailData} />
            </CardHeader>
            <CardBody>
              <UserDetailBody
                data={acutalUserDetailData}
                departments={actualDepartments}
                roles={actualUserRoles}
              />
            </CardBody>
          </Card>
        </ErrorBoundary>
      )}
    </DashboardShell>
  )
}

const UserDetailHeader = ({details}) => {
  const router = useRouter()
  const {userId} = router.query
  // TODO:FIXME: Fix Audit Trail for Portal and Device User
  const handleAuditTrailClick = () => {
    router.push(`${USERSINDEX}/${userId}/audit-trail`)
  }

  return (
    <div className="flex flex-wrap items-center">
      <div className="w-full sm:w-3/4">
        <UserDetailHeaderInfo data={details} />
      </div>
      {/* Audit and Notices UI */}
      <div className="w-full sm:w-1/4">
        {!ISNEWUSER && (
          <Fragment>
            <AuditTrailButton onClick={handleAuditTrailClick} />
            {/* FIXME: Add "Notices" button here to show user alerts
                            Pass the count props to notices if we want to show read-badge or not

                            <NoticesButton onClick={handleNoticesClick} />
                        */}
          </Fragment>
        )}
      </div>
    </div>
  )
}

const UserDetailHeaderInfo = ({data}) => {
  console.log('UserDetailHeaderInfo::', {ISNEWUSER})
  return (
    <div className="flex items-center">
      {/* Back Button */}
      <div className="w-2/12">
        <BackButton url={USERSINDEX} />
      </div>

      {/* Patient Icon and user details */}
      <div className="w-10/12">
        <div className="md:flex md:justify-center bg-white">
          <NavigationIcons
            className="h-12 w-12 md:h-20 md:w-20 mx-auto md:mx-0 text-brand-dark-gray"
            boxSize="0 0 24 24"
            title="Users"
          />
          <div className="text-center  md:text-left md:ml-2 md:self-center ">
            {ISNEWUSER ? (
              <h2 className="text-lg text-brand-dark-blue font-tradegothic-bold">
                Add User
              </h2>
            ) : (
              <Fragment>
                <h2 className="mt-2 text-lg text-brand-dark-blue font-tradegothic-bold">
                  {`${data.firstname} ${data.lastname}`}
                </h2>
                <FixSizeBadge
                  color={
                    data.status === 'Active'
                      ? GREENBACKROUND_WITH_DARKGREENTEXT
                      : REDBACKGROUND_WITH_DARKREDTEXT
                  }
                  text={data.status}
                  className="font-semibold"
                />

                {/* <div className="text-sm text-brand-blue">
                                    {`(${userTypePlaceholder} User)`}
                                </div> */}
              </Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const useFormSaveAndDelete = () => {
  const tokenRef = useAuth0Token()
  const router = useRouter()
  const {formProcessingState, setFormProcessingState} = useFormHandling()
  //const [formError, setFormError] = useState(null)
  const formError = useRef(null)

  let mutationUrl = 'user'
  const timeOut = () =>
    setTimeout(() => {
      mutate(mutationUrl)
      router.push(`${USERSINDEX}`)
    }, 1500)

  const handleFormSubmission = formValues => {
    console.log('UseDetails: Save: ', formValues)
    let formSubmissionUrl = 'user/save'
    formError.current = null
    setFormProcessingState(formStates.SUBMITTED)
    fetcher(formSubmissionUrl, tokenRef.current, {body: formValues}).then(
      data => {
        console.log(`Added / Edited user `, data)
        setFormProcessingState(formStates.SUCCESS)
        timeOut()
      },
      error => {
        console.log(`UserDetail::Error saving user `, error)

        //NOTE:
        // ordering of formProcessingState and errorRef matters do not change the order
        //TODO:FIXME: Find a better way on handling form submissions and error
        formError.current = error
        setFormProcessingState(formStates.ERROR)
        //setFormError(error)
      },
    )
  }

  const handleFormDeletion = userID => {
    let formDeletionUrl = `user/${userID}`
    // userType === userTypes.PORTAL
    //     ? `user/${userID}`
    //     : `deviceuser/${userID}`
    formError.current = null
    setFormProcessingState(formStates.SUBMITTED)
    fetcher(formDeletionUrl, tokenRef.current, {method: 'DELETE'}).then(
      data => {
        console.log(`DELETED user:: `, data)
        timeOut()
      },
      error => {
        console.log(`UserDetail::Error DELETING user:: ${userID} `, error)
        //NOTE:
        // ordering of formProcessingState and errorRef matters do not change the order
        //TODO:FIXME: Find a better way on handling form submissions and error
        formError.current = error
        setFormProcessingState(formStates.ERROR)
        //setFormError(error)
      },
    )
  }

  return {
    formProcessingState,
    formError,
    handleSave: handleFormSubmission,
    handleDelete: handleFormDeletion,
  }
}

const userStatus = ['Active', 'Inactive']

//NOTE: There is a possiblity of requirements of device and portal users down the road
// refer the old repo for that requirement
const UserDetailBody = ({data, roles, departments}) => {
  //console.log('UserDetailBody:: ', {roles})
  const router = useRouter()
  const {userId} = router.query
  const {edit} = useValidatePermissions(USERCONTROLNAME)
  const {currentDateFormat} = useDateTimeFormat()

  const {formProcessingState, handleSave, handleDelete, formError} =
    useFormSaveAndDelete()

  const dateTrainedInput = useInput(
    data.dateTrained ? moment(data.dateTrained) : null,
  )
  const dateTrainedFocusedInput = useInput(null)

  const dateExpiredInput = useInput(
    data.trainingExpiration ? moment(data.trainingExpiration) : null,
  )
  const dateExpiredFocusedInput = useInput(null)

  /**
   * When we have a user whose status is locked we need to show it in the status listing
   * so that the user can then be set active or inactive
   *
   * In a general case, when we add a user or edit a user we do not want the admin or any other
   * user roles to have the ability to lock a user out. So this status of "Locked" in dropdown
   * is only shown when user actually gets locked out
   */
  if (data.status === 'Locked') {
    userStatus.push(data.status)
  }

  const onSubmit = formValues => {
    formValues = {
      ...formValues,
      dateTrained: dateTrainedInput.value
        ? dateTrainedInput.value.format('MM/DD/YYYY').toString()
        : '',
      trainingExpiration: dateExpiredInput.value
        ? dateExpiredInput.value.format('MM/DD/YYYY').toString()
        : '',
      status: ISNEWUSER ? 'Active' : formValues.status,
      userId,
    }
    console.log('Adding/Saving User: Submitted formValues:', formValues)
    handleSave(formValues)
  }

  const onDelete = () => handleDelete(userId)

  return (
    <Fragment>
      <RequiredFieldInfo />
      <Formik
        enableReinitialize
        initialValues={{
          firstName: data.firstname || '',
          lastName: data.lastname || '',
          department: data.department || '',
          portalRole: data.portalRole || '',
          selectedFacilities: ISNEWUSER
            ? []
            : data.facilities
                .filter(facility => facility.selected)
                .map(facility => facility.facilityID),

          status: data.status || userStatus[0],
          // loginName: data.loginname || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          notes: data.notes || '',
          id: data.id || '',
        }}
        validationSchema={Yup.object({
          firstName: Yup.string()
            // .max(15, 'Must be 15 characters or less')
            .required('Required'),
          lastName: Yup.string().required(true),
          department: Yup.string().required(true),
          portalRole: Yup.string().required(true),
          // loginName: Yup.string().required(true),
          email: Yup.string().email().required(true),
          selectedFacilities: Yup.array().required(true),
          id: Yup.string().required(true),
        })}
        onSubmit={onSubmit}
      >
        {formik => (
          <form autoComplete="false" onSubmit={formik.handleSubmit}>
            <FormHolder>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${FORM_USER_FIRST_NAME}:`}
                  aria-label={`${FORM_USER_FIRST_NAME}`}
                  name="firstName"
                  placeholder={`${FORM_USER_FIRST_NAME}`}
                  disabled={!edit}
                  required
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${FORM_USER_LAST_NAME}:`}
                  aria-label={`${FORM_USER_LAST_NAME}`}
                  name="lastName"
                  placeholder={`${FORM_USER_LAST_NAME}`}
                  disabled={!edit}
                  required
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <SelectOption
                  name="portalRole"
                  label={`${TABLE_USER_ROLE_HEADER}:  `}
                  disabled={!edit}
                  required
                >
                  <option key={`userrole_000`} value="">
                    Select Role
                  </option>
                  {roles.map(role => (
                    <option key={`userrole${role.id}`} value={role.roleName}>
                      {role.roleName}
                    </option>
                  ))}
                </SelectOption>
              </FormCol>

              <FormCol colWidth="sm:col-span-6">
                {/**
                                Checkboxes are a little more complicated component considering
                                multiple things
                                1. The Checkbox label and label for overall component needs to be
                                   highlighted in cases of validation error
                                2. When disabling the field, the actual checkbox field has to be disabled
                             */}
                <CheckboxHolder
                  label={`${TABLE_LOCATION_HEADER}`}
                  name="selectedFacilities"
                  formik={formik}
                  disabled={!edit}
                  required
                >
                  {data.facilities.map(location => (
                    <CheckboxInput
                      key={location.facilityID}
                      name="selectedFacilities"
                      value={location.facilityID}
                      disabled={!edit}
                    >
                      {location.facilityName}
                    </CheckboxInput>
                  ))}
                </CheckboxHolder>
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <SelectOption
                  name="department"
                  label={`${TABLE_DEPARTMENT_HEADER}`}
                  disabled={!edit}
                  required
                >
                  <option key={`userdept_000`} value="">
                    Select Department
                  </option>
                  {departments.map(department => (
                    <option
                      key={`userdept${department.keywordID}`}
                      value={department.keywordText}
                    >
                      {department.keywordText}
                    </option>
                  ))}
                </SelectOption>
              </FormCol>
              {!ISNEWUSER && (
                <FormCol colWidth="sm:col-span-3">
                  <SelectOption
                    name="status"
                    label={`${TABLE_STATUS_HEADER}: `}
                    disabled={!edit}
                  >
                    {userStatus.map((status, index) => (
                      <option key={index} value={status}>
                        {status}
                      </option>
                    ))}
                  </SelectOption>
                </FormCol>
              )}

              {/* Horizontal border */}
              <FormCol
                colWidth="sm:col-span-6"
                className="border-b border-brand-blue mt-2 mb-4"
              ></FormCol>

              <FormCol
                colWidth="sm:col-span-6"
                className={`${!edit ? 'cursor-not-allowed' : ''} `}
              >
                <div className="">
                  <span className=" sm:text-sm sm:leading-5 text-brand-dark-blue font-tradegothic-bold">
                    {FORM_USER_TRAINING_INFO}:
                  </span>
                  <div
                    className={`px-4 py-2 border border-gray-300
                                                rounded-lg shadow-sm
                                                            flex items-center text-brand-blue `}
                  >
                    <div className="mt-1 ml-4 w-48">
                      <SingleCalendar
                        id="dateTrained"
                        dateInput={dateTrainedInput}
                        displayFormat={currentDateFormat}
                        focusedInput={dateTrainedFocusedInput}
                        disabled={!edit}
                        noBorder={true}
                        placeholder={`${FORM_USER_TRAINING_START}`}
                        openDirection={calendarConstants.OPEN_UP}
                        block
                        required={
                          formik.initialValues.portalRole === 'Operator' ||
                          (formik.dirty &&
                            formik.values.portalRole === 'Operator')
                        }
                      />
                    </div>
                    <div className="px-2 ">
                      <ArrowRightIcon className="text-brand-blue w-6 h-auto" />
                      {/* <svg viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg> */}
                    </div>
                    <div className="w-48">
                      <SingleCalendar
                        id="endDate"
                        dateInput={dateExpiredInput}
                        focusedInput={dateExpiredFocusedInput}
                        displayFormat={currentDateFormat}
                        disabled={
                          // if fields is disabled then do not change anything
                          !edit ? !edit : dateTrainedInput.value ? false : true
                        }
                        isOutsideRange={day =>
                          !day.isAfter(dateTrainedInput.value)
                        }
                        noBorder={true}
                        placeholder={`${FORM_USER_TRAINING_END}`}
                        openDirection={calendarConstants.OPEN_DOWN}
                        block
                        required={
                          formik.initialValues.portalRole === 'Operator' ||
                          (formik.dirty &&
                            formik.values.portalRole === 'Operator')
                        }
                      />
                    </div>
                  </div>
                </div>
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${TABLE_USER_ID_HEADER}:`}
                  aria-label={`${TABLE_USER_ID_HEADER}`}
                  type="text"
                  name="id"
                  placeholder={`${TABLE_USER_ID_HEADER}:`}
                  disabled={!edit}
                  required
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${FORM_USER_EMAIL}:`}
                  aria-label={`${FORM_USER_EMAIL}`}
                  type="email"
                  name="email"
                  placeholder={`${FORM_PLACHOLDER_ENTER} ${FORM_USER_EMAIL}`}
                  disabled={!edit}
                  required
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${FORM_USER_PHONE}:`}
                  aria-label={`${FORM_USER_PHONE}`}
                  type="tel"
                  name="phoneNumber"
                  placeholder={`${FORM_PLACHOLDER_ENTER} ${FORM_USER_PHONE}`}
                  disabled={!edit}
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-6">
                <span className=" sm:text-sm sm:leading-5 text-brand-dark-blue font-tradegothic-bold">
                  {FORM_NOTES}:
                </span>
                <textarea
                  className={` form-textarea mt-1 block w-full focus:outline-none ${
                    !edit ? DISABLEDCLASSCSS : ''
                  }`}
                  rows="3"
                  placeholder={FORM_NOTES}
                  name="notes"
                  disabled={!edit}
                  {...formik.getFieldProps('notes')}
                />
              </FormCol>
            </FormHolder>
            {!edit ? null : (
              <SaveAndDelete
                formProcessingState={formProcessingState}
                formError={formError}
                onDelete={onDelete}
              />
            )}
          </form>
        )}
      </Formik>
    </Fragment>
  )
}

const SaveAndDelete = ({formProcessingState, formError, onDelete}) => {
  console.log('SaveANdDeleteRendering...')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const {delete: deletePermission} = useValidatePermissions(USERCONTROLNAME)
  return (
    <Fragment>
      <div className="mt-4">
        <SubmitFormButton
          currentForm={{formProcessingState}}
          error={formError}
          extraButtons={
            ISNEWUSER || !deletePermission ? null : (
              <>
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete User
                </button>
              </>
            )
          }
        />
      </div>
      {showDeleteModal && (
        <DeleteModal
          open={showDeleteModal}
          setOpen={setShowDeleteModal}
          headerTitle="Delete this user"
          message="Are you sure, you want to delete this user"
          onDelete={onDelete}
        />
      )}
    </Fragment>
  )
}

export default withAuthenticationRequired(
  UserDetails,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
