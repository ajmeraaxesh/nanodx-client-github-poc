import {DateRangePicker, SingleDatePicker} from 'react-dates'
import * as constants from 'react-dates/constants'
// import { DATEDISPLAYFORMAT } from '@lib/constants'
import useSettingstore from '@hooks/use-settings-store'

export const SingleCalendar = ({
  id,
  dateInput,
  focusedInput,
  ...customConfig
} = {}) => {
  //console.log('SingleCalendar:: ', dateInput, ' focused:: ', focusedInput)

  // The value received form this custom hook is set by
  // the user in the corresponding field

  const settings = useSettingstore(state => state.settings)

  //const calendarDateDisplayFormat = useDateTimeFormat()

  return (
    <SingleDatePicker
      id={id} // PropTypes.string.isRequired,
      date={dateInput.value} // momentPropTypes.momentObj or null
      onDateChange={date => dateInput.setValue(date)} // PropTypes.func.isRequired
      focused={focusedInput.value} // PropTypes.bool
      onFocusChange={({focused}) => focusedInput.setValue(focused)} // PropTypes.func.isRequired
      numberOfMonths={1}
      isOutsideRange={() => false}
      showDefaultInputIcon={false}
      // inputIconPosition={constants.ICON_BEFORE_POSITION}
      hideKeyboardShortcutsPanel={true}
      displayFormat={settings.dateFormat}
      block
      readOnly={true}
      // appendToBody
      {...customConfig}
    />
  )
}

export const RangeCalendar = ({
  startDateId,
  endDateId,
  startDateInput,
  endDateInput,
  focusedInput,
  ...customConfig
} = {}) => {
  // The value received form this custom hook is set by
  // the user in the corresponding field
  const settings = useSettingstore(state => state.settings)

  return (
    <DateRangePicker
      startDateId={startDateId}
      endDateId={endDateId}
      startDate={startDateInput.value}
      endDate={endDateInput.value}
      onDatesChange={({startDate, endDate}) => {
        startDateInput.setValue(startDate)
        endDateInput.setValue(endDate)
      }}
      focusedInput={focusedInput.value}
      onFocusChange={focusedInp => {
        focusedInput.setValue(focusedInp)
      }}
      showDefaultInputIcon={true}
      inputIconPosition={constants.ICON_BEFORE_POSITION}
      numberOfMonths={2}
      enableOutsideDays={false}
      showClearDates={true}
      hideKeyboardShortcutsPanel={true}
      isOutsideRange={() => false}
      displayFormat={settings.dateFormat}
      {...customConfig}
    />
  )
}

export const TwoSingleCalendar = ({startProp, endProp}) => {
  const commonConfig = {
    showDefaultInputIcon: true,
    inputIconPosition: constants.ICON_BEFORE_POSITION,
    numberOfMonths: 1,
    small: true,
  }

  return (
    <div className="flex justify-center items-center">
      <span className="mx-4">{startProp.label || 'Start Date:'}</span>
      <SingleDatePicker
        id={startProp.id || 'start_cal'}
        date={startProp.input.value} // momentPropTypes.momentObj or null
        onDateChange={date => startProp.input.setValue(date)} // PropTypes.func.isRequired
        focused={startProp.focus.value} // PropTypes.bool
        onFocusChange={({focused}) => startProp.focus.setValue(focused)}
        isOutsideRange={() => false}
        {...commonConfig}
        {...(startProp.customConfig || {})}
      />

      <span className="mx-4">{endProp.label || 'End Date:'}</span>
      <SingleDatePicker
        id={endProp.id || 'start_cal'}
        date={endProp.input.value} // momentPropTypes.momentObj or null
        onDateChange={date => endProp.input.setValue(date)} // PropTypes.func.isRequired
        focused={endProp.focus.value} // PropTypes.bool
        onFocusChange={({focused}) => endProp.focus.setValue(focused)}
        disabled={startProp.input.value !== null ? false : true}
        isOutsideRange={day => !day.isAfter(startProp.input.value)}
        {...commonConfig}
        {...(endProp.customConfig || {})}
      />
    </div>
  )
}
