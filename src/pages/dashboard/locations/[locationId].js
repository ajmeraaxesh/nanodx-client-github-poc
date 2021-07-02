import {useState, useEffect, useRef, Fragment} from 'react'
import {withAuthenticationRequired} from '@auth0/auth0-react'

import {Formik} from 'formik'
import * as Yup from 'yup'

import {ErrorBoundary} from 'react-error-boundary'
import {useRouter} from 'next/router'
import {v4 as uuidv4} from 'uuid'
import {mutate} from 'swr'

import mapboxgl from 'mapbox-gl'

import {
  Card,
  CardHeader,
  CardBody,
  OnError,
  ErrorFallback,
  BackButton,
  Loading,
  SubmitFormButton,
  DeleteModal,
  UnAuthorizedAccess,
} from '@components/CommonComponents'

import {
  FormHolder,
  FormCol,
  EditableInput,
  RequiredFieldInfo,
} from '@components/FormComponents'
import {NavigationIcons} from '@components/CustomIcons'

import {LOCATIONSCONTROLNAME, LOCATIONSINDEX} from '@lib/constants'
import fetcher from '@lib/fetcher'
import {getRedirecting, isBrowser} from '@lib/utils'

import {
  TABLE_NAME_HEADER,
  FORM_LOCATION_CODE,
  TABLE_LOCATION_DESCRIPTION_HEADER,
  TABLE_LOCATION_CITY_HEADER,
  TABLE_LOCATION_STATE_HEADER,
  TABLE_LOCATION_ZIP_HEADER,
  FORM_LOCATION_LATITUDE,
  FORM_LOCATION_LONGITUDE,
  FORM_DELETE_LOCATION,
  FORM_ADD_LOCATION,
} from '@lib/Strings'

import DashboardShell from '@components/DashboardShell'

import useDataLib from '@hooks/use-data-lib'
import useValidatePermissions from '@hooks/use-validate-permissions'
import useAuth0Token from '@hooks/use-auth0-token'
import {formStates} from '@hooks/use-form-handing'
import useFormHandling from '@hooks/use-form-handing'

// const L = dynamic(() => import('mapbox.js'), {
//   ssr: false,
// })

// console.log('MapBoxJs:', L)

const NEW_FACILITY = '00000000-0000-0000-0000-000000000000'
let ISNEWLOCATION = false
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
// const geocoder = new MapboxGeocoder({
//   accessToken: mapboxgl.accessToken,
//   mapboxgl: mapboxgl,
// })

const LocationDetails = () => {
  const router = useRouter()
  const {locationId} = router.query
  const dataIdRef = useRef(uuidv4())
  ISNEWLOCATION = locationId === '00000000-0000-0000-0000-000000000000'
  const {userScreenAccess} = useValidatePermissions(LOCATIONSCONTROLNAME)
  const apiEndPoint = `facility/${locationId}`
  console.log({apiEndPoint})
  const {data: facilityData, error: facilityError} = useDataLib(
    !ISNEWLOCATION && userScreenAccess
      ? [apiEndPoint, dataIdRef.current]
      : null,
  )

  if (!userScreenAccess) {
    return (
      <DashboardShell>
        <UnAuthorizedAccess />
      </DashboardShell>
    )
  }

  const actualData = ISNEWLOCATION ? {} : facilityData
  // console.log('FacilityError:: ', facilityError)

  return (
    <DashboardShell>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {facilityError && <OnError error={facilityError} />}
        {!actualData && !facilityError && <Loading />}
        {actualData && <LocationDetailForm data={actualData} />}
      </ErrorBoundary>
    </DashboardShell>
  )
}

const LocationDetailForm = ({data}) => {
  console.log('LocationDetailForm: ', data)

  return (
    <Card>
      <CardHeader>
        <LocationHeader
          title={`${ISNEWLOCATION ? FORM_ADD_LOCATION : data.facilityName}`}
          description={`${ISNEWLOCATION ? '' : data.description}`}
        />
      </CardHeader>

      <CardBody>
        <LocationBody details={data} />
      </CardBody>
    </Card>
  )
}

const LocationHeader = ({title}) => {
  return (
    <div className="flex items-center flex-wrap">
      <div className="w-full sm:w-1/12">
        <BackButton url={`${LOCATIONSINDEX}`} />
      </div>
      <div className="w-full sm:w-11/12">
        <div className="md:flex md:justify-center bg-white">
          <NavigationIcons
            className="h-12 w-12 md:h-16 md:w-16 mx-auto md:mx-0 text-brand-dark-gray"
            boxSize="0 0 24 24"
            title="Locations"
          />
          <div className="text-center font-tradegothic-bold md:text-left md:ml-2 md:self-center ">
            <h2 className="text-lg text-brand-dark-blue">{title}</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

const LocationBody = ({details}) => {
  const router = useRouter()
  const {edit, delete: deletePermission} =
    useValidatePermissions(LOCATIONSCONTROLNAME)
  const tokenRef = useAuth0Token()
  const locationDetailsForm = useFormHandling()
  const locationDetailsFormErrorRef = useRef(null)
  const ref = useRef(null)

  const [map, setMap] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (map === null) {
      if (ISNEWLOCATION) {
        // setting the default location to
        setMap(
          new mapboxgl.Map({
            // the container property matches the "id" attribute of the Div
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-71.5338144, 42.2886379],
            zoom: 10,
          }),
        )
      } else if (details.longitude.length > 0 && details.latitude.length > 0) {
        setMap(
          new mapboxgl.Map({
            // the container property matches the "id" attribute of the Div
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            //NOTE: the plus sign before latitude converts a string to a number in JS
            center: [+details.longitude, +details.latitude],
            zoom: 15,
          }),
        )
      }
    }
  }, [details.latitude, details.longitude, map])

  const onSubmit = formValues => {
    formValues = {
      ...formValues,
      facilityID: ISNEWLOCATION ? NEW_FACILITY : details.facilityID,
      zip: formValues.zip.toString(),
    }

    console.log({formValues})
    locationDetailsFormErrorRef.current = null
    locationDetailsForm.setFormProcessingState(formStates.SUBMITTED)
    fetcher('facility/save', tokenRef.current, {body: formValues}).then(
      apiData => {
        console.log('Added / Edited location:: ', apiData)
        //setLocationSaved(true)
        locationDetailsForm.setFormProcessingState(formStates.SUCCESS)
        setTimeout(() => {
          mutate('facility')
          router.push(`${LOCATIONSINDEX}`)
        }, 1500)
      },
      apiError => {
        console.log('LocationDetail::Error saving location:: ', apiError)
        locationDetailsFormErrorRef.current = apiError
        locationDetailsForm.setFormProcessingState(formStates.ERROR)
      },
    )
  }

  const onDelete = () => {
    locationDetailsFormErrorRef.current = null
    locationDetailsForm.setFormProcessingState(formStates.SUBMITTED)
    fetcher(`facility/${details.facilityID}`, tokenRef.current, {
      method: 'DELETE',
    }).then(
      apiData => {
        //setLocationSaved(true)
        locationDetailsForm.setFormProcessingState(formStates.SUCCESS)
        setTimeout(() => {
          mutate('facility')
          router.push(`${LOCATIONSINDEX}`)
        }, 1500)
      },
      error => {
        locationDetailsFormErrorRef.current = error
        locationDetailsForm.setFormProcessingState(formStates.ERROR)
        console.log('Error deleting location:: ', error)
        //setLocationFetchError(error)
      },
    )
  }

  const onFormBlur = async () => {
    const formValues = ref.current.values

    if (
      formValues.address1 === '' ||
      formValues.city === '' ||
      formValues.state === '' ||
      formValues.zip === ''
    ) {
      return
    }
    const query = `${formValues.facilityName} ${formValues.address1} ${formValues.city} ${formValues.state} ${formValues.zip}`
    const encodedQuery = encodeURI(query)
    try {
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?types=poi&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`,
      )
      const data = await resp.json()
      const mapData = data.features[0]

      locationDetailsFormErrorRef.current = null
      ref.current.setFieldValue('latitude', mapData.center[1])
      ref.current.setFieldValue('longitude', mapData.center[0])
      if (map !== null) {
        map.flyTo({
          center: [mapData.center[0], mapData.center[1]],
          zoom: 15,
        })
      }
    } catch (err) {
      console.log('Geocoder Err: ', err)
      locationDetailsFormErrorRef.current = 'Cannot get lat / long of address'
      locationDetailsForm.setFormProcessingState(formStates.ERROR)

      if (map !== null) {
        map.flyTo({
          center: [-71.5338144, 42.2886379],
          zoom: 15,
        })
      }
      ref.current.setFieldValue('latitude', '')
      ref.current.setFieldValue('longitude', '')
      return
    }
  }

  return (
    <Fragment>
      <RequiredFieldInfo />
      <Formik
        enableReinitialize
        innerRef={ref}
        //NOTE: The initialvalues are set in accordance with the "name" attribute of
        // the form fields
        initialValues={{
          facilityKey: details.facilityKey || '',
          facilityName: details.facilityName || '',
          description: details.description || '',
          address1: details.address1 || '',
          address2: details.address2 || '',
          city: details.city || '',
          state: details.state || '',
          zip: details.zip || '',
          longitude: details.longitude || '',
          latitude: details.latitude || '',
        }}
        validationSchema={Yup.object({
          //facilityKey: Yup.string().required(true),
          facilityName: Yup.string().required(true),
          // description: Yup.string().required(true),
          address1: Yup.string().required(true),
          city: Yup.string().required(true),
          state: Yup.string().required(true),
          zip: Yup.string().required(true),
        })}
        onSubmit={onSubmit}
      >
        {formik => (
          // Set the "name" html attribute as per the data that needs
          // to be  defined as per JSON to be sent across
          <form onSubmit={formik.handleSubmit}>
            <FormHolder>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${TABLE_NAME_HEADER}:`}
                  aria-label={`${TABLE_NAME_HEADER}`}
                  type="text"
                  name="facilityName"
                  placeholder="Name"
                  disabled={!edit}
                  required
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label={`${FORM_LOCATION_CODE}:`}
                  aria-label={`${FORM_LOCATION_CODE}`}
                  type="text"
                  name="facilityKey"
                  placeholder="A unique code for the location"
                  disabled={!edit}
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-6">
                <EditableInput
                  label={`${TABLE_LOCATION_DESCRIPTION_HEADER}:`}
                  aria-label={`${TABLE_LOCATION_DESCRIPTION_HEADER}`}
                  type="text"
                  name="description"
                  placeholder="Describe about the location "
                  disabled={!edit}
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label="Address 1:"
                  aria-label="Address 1"
                  type="text"
                  name="address1"
                  placeholder="street info"
                  required
                  disabled={!edit}
                  onBlur={onFormBlur}
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-3">
                <EditableInput
                  label="Address 2:"
                  aria-label="Address 2"
                  type="text"
                  name="address2"
                  placeholder="floor and room info"
                  disabled={!edit}
                />
              </FormCol>

              <FormCol colWidth="sm:col-span-2">
                <EditableInput
                  label={`${TABLE_LOCATION_CITY_HEADER}:`}
                  aria-label={`${TABLE_LOCATION_CITY_HEADER}`}
                  type="text"
                  name="city"
                  placeholder="city"
                  disabled={!edit}
                  onBlur={onFormBlur}
                  required
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-2">
                <EditableInput
                  label={`${TABLE_LOCATION_STATE_HEADER}:`}
                  aria-label={`${TABLE_LOCATION_STATE_HEADER}`}
                  type="text"
                  name="state"
                  placeholder="state"
                  disabled={!edit}
                  onBlur={onFormBlur}
                  required
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-2">
                <EditableInput
                  label={`${TABLE_LOCATION_ZIP_HEADER}`}
                  aria-label="Zip"
                  name="zip"
                  placeholder={`${TABLE_LOCATION_ZIP_HEADER.toLowerCase()}`}
                  disabled={!edit}
                  onBlur={onFormBlur}
                  required
                />
              </FormCol>
              {/* <FormCol colWidth="sm:col-span-2">
                <EditableInput
                  label={`${FORM_LOCATION_LATITUDE}:`}
                  aria-label={`${FORM_LOCATION_LATITUDE}`}
                  type="text"
                  name="latitude"
                  placeholder={`${FORM_LOCATION_LATITUDE.toLowerCase()}`}
                  disabled={true}
                />
              </FormCol>
              <FormCol colWidth="sm:col-span-2">
                <EditableInput
                  label={`${FORM_LOCATION_LONGITUDE}:`}
                  aria-label={`${FORM_LOCATION_LONGITUDE}`}
                  type="text"
                  name="longitude"
                  placeholder={`${FORM_LOCATION_LONGITUDE.toLowerCase()}:`}
                  disabled={true}
                />
              </FormCol> */}
              <FormCol colWidth="sm:col-span-2">
                <div
                  id="map"
                  style={{
                    width: '200px',
                    height: '200px',
                    fontSize: '8px',
                  }}
                ></div>
              </FormCol>
            </FormHolder>
            {/**TODO: Show or hide the UI if the user is only allowed to view the field */}
            {!edit ? null : (
              <div className="mt-12">
                <SubmitFormButton
                  currentForm={locationDetailsForm}
                  error={locationDetailsFormErrorRef}
                  //buttonsPosition={ISNEWLOCATION ? 'center' : 'start'}
                  extraButtons={
                    ISNEWLOCATION || !deletePermission ? null : (
                      <>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          Delete Location
                        </button>
                      </>
                    )
                  }
                />
              </div>
            )}
            {showDeleteModal && (
              <DeleteModal
                open={showDeleteModal}
                setOpen={setShowDeleteModal}
                headerTitle="Delete this location"
                message="Are you sure, you want to delete this location"
                onDelete={onDelete}
              />
            )}
          </form>
        )}
      </Formik>
    </Fragment>
  )
}

export default withAuthenticationRequired(
  LocationDetails,
  getRedirecting(isBrowser ? window.location.pathname : null),
)
