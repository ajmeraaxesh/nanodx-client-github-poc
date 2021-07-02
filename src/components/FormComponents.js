import {DISABLEDCLASSCSS} from '@lib/constants'
import {useField} from 'formik'

export const RequiredFieldInfo = () => (
  <div className="text-sm text-brand-dark-blue font-tradegothic-bold tracking-wider mb-2">
    * = Required Field
  </div>
)

export const FormHolder = ({children}) => (
  <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
    {children}
  </div>
)

export const FormCol = ({children, colWidth, className = ''}) => (
  <div className={` ${colWidth} ${className}`}>{children}</div>
)

export const RowWithTwoCols = ({children, className = ''}) => (
  <div className={`grid grid-cols-1 sm:grid-cols-2 sm:gap-2 ${className}`}>
    {children}
  </div>
)

export const RowWithOneCols = ({children, className = 'border-brand-blue'}) => (
  <div
    className={`grid grid-cols-1 mb-2 rounded border px-3 py-2 ${className}`}
  >
    {children}
  </div>
)

export const FieldLabel = ({name, isRequired = false, className = ''}) => (
  <div
    className={` flex flex-row text-sm leading-5 font-tradegothic-bold ${className}`}
  >
    <label htmlFor={name}>{name}</label>
    {isRequired ? <span className={`asteriskLabel`}></span> : null}
  </div>
)

export const EditableInput = ({
  label,
  labelClassName = '',
  inputClassName = '',
  disabled = false,
  required = false,
  type = 'text',
  onBlur = null,
  ...inputProps
}) => {
  const [field, meta] = useField(inputProps)
  labelClassName +=
    meta.touched && meta.error
      ? ' text-red-600 border-red-600 focus:border-red-900'
      : 'text-brand-dark-blue'

  const disabledFieldsClassName = disabled ? DISABLEDCLASSCSS : ''
  const inputClassNameFull =
    meta.touched && meta.error
      ? 'text-red-600 border-red-600 focus:border-red-900'
      : inputClassName

  return (
    <>
      <FieldLabel
        name={label}
        className={labelClassName}
        isRequired={required}
      />
      <div className="mt-1">
        <input
          type={type}
          className={`block w-full transition duration-150 ease-in-out
                                 sm:text-sm  ${inputClassNameFull} ${disabledFieldsClassName}`}
          autoComplete="off"
          disabled={disabled}
          {...inputProps}
          {...field}
          onBlur={e => {
            field.onBlur(e)
            if (onBlur !== null) {
              onBlur()
            }
          }}
        />
      </div>
    </>
  )
}

export const ReadOnlyInput = ({label, ...rest}) => {
  return <EditableInput disabled={true} label={label} {...rest} />
}

export const SelectOption = ({
  label,
  multiSelect = false,
  onChange = null,
  disabled = false,
  children,
  required = false,

  ...selectProps
}) => {
  const [field, meta] = useField(selectProps)

  // console.log('SelectOption:: meta:: ', meta)
  // console.log(`label: ${label} SelectInputClassName: ${selectInputClassName}`)

  const selectLabelClassName =
    meta.touched && meta.error ? ' text-red-600' : ' text-brand-dark-blue'

  const selectInputClassName =
    meta.touched &&
    meta.error &&
    'text-red-600 border-red-600 focus:border-red-900'

  const disabledFieldsClassName = disabled ? DISABLEDCLASSCSS : ''

  const commonSelectInputCss = `w-full sm:whitespace-pre-wrap sm:text-sm`

  return (
    <>
      <FieldLabel
        name={label}
        className={selectLabelClassName}
        isRequired={required}
      />

      <div className="mt-1 ">
        {onChange !== null ? (
          <select
            readOnly={onChange !== null}
            className={` ${commonSelectInputCss}
                                    ${selectInputClassName} ${disabledFieldsClassName}  `}
            {...field}
            onChange={onChange}
            disabled={disabled}
            {...selectProps}
          >
            {children}
          </select>
        ) : !multiSelect ? (
          <select
            className={`${commonSelectInputCss} ${selectInputClassName} ${disabledFieldsClassName}`}
            disabled={disabled}
            {...field}
            {...selectProps}
          >
            {children}
          </select>
        ) : (
          <select
            className={`${commonSelectInputCss} ${disabledFieldsClassName}`}
            disabled={disabled}
            {...field}
            {...selectProps}
            multiple
          >
            {children}
          </select>
        )}
      </div>
    </>
  )
}

export const CheckboxInput = ({children, ...props}) => {
  const [field] = useField({...props, type: 'checkbox'})
  return (
    <label className="inline-flex items-center">
      <input
        type="checkbox"
        className="form-checkbox text-brand-dark-gray h-6 w-6"
        {...field}
        {...props}
      />
      <span className={`ml-2 sm:text-sm sm:leading-5  `}>{children}</span>
    </label>
  )
}

export const CheckboxHolder = ({
  label,
  className = '',
  children,
  checkBoxContentGrid = 'horizontal',
  required = false,
  ...props
}) => {
  let checkBoxMainLabelClassname = ''
  let checkBoxHolderDisabledClassName = ''

  const checkboxHolderGridStyle =
    checkBoxContentGrid === 'horizontal'
      ? 'grid grid-cols-1 gap-x-2 sm:grid-cols-3 sm:gap-y-3 '
      : 'grid grid-cols-1 gap-x-2'

  // if name and formik are passed as props then the outer border and "Main label"
  // for checkboxes can be set accordingly
  // Refer UserDetails screen, Location checkbox field as reference
  if (props.formik && props.name) {
    const meta = props.formik.getFieldMeta(props.name)

    className +=
      meta.touched && meta.error
        ? ' text-red-600 border-red-600'
        : ' text-brand-blue border-gray-300'
    //console.log('Checkbox className:: ', className)
    checkBoxMainLabelClassname +=
      meta.touched && meta.error
        ? ' text-red-600 border-red-600'
        : ' text-brand-dark-blue'
  } else {
    className += ' text-brand-blue'
    checkBoxMainLabelClassname = ' text-brand-dark-blue'
  }

  if (props.disabled) {
    checkBoxHolderDisabledClassName = DISABLEDCLASSCSS
  }

  return (
    <div className={`${checkBoxHolderDisabledClassName}`}>
      <FieldLabel
        name={label}
        className={checkBoxMainLabelClassname}
        isRequired={required}
      />

      <div
        className={`mt-1 rounded-lg py-4 px-2
                             ${checkboxHolderGridStyle}
                            border ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
