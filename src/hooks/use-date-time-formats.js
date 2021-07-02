import useSettingstore from '@hooks/use-settings-store'
import moment from 'moment-timezone'

const useDateTimeFormat = () => {
  const settings = useSettingstore(state => state.settings)

  const currentDateFormat = settings.dateFormat
    ? [{keywordText: settings.dateFormat}]
    : settings.dateFormats.filter(
        dates => dates.keywordID === settings.dateFormatID,
      )

  const currentTimeFormat = settings.timeFormat
    ? [{keywordText: settings.timeFormat}]
    : settings.timeFormats.filter(
        timeFormat => timeFormat.keywordID === settings.timeFormatID,
      )

  let momentTimeFormat = 'hh:mm:ss a'
  if (currentTimeFormat[0].keywordText === '24 hour') {
    momentTimeFormat = 'HH:mm:ss'
  }

  return {
    currentDateFormat: currentDateFormat[0].keywordText,
    currentTimeFormat: momentTimeFormat,
    currentTimeZone: settings.timeZone,
    formatTime: value => {
      // console.log(
      //   'FORMAT TIME:::: ',
      //   moment(value, 'X').format(
      //     `${currentDateFormat[0].keywordText} ${momentTimeFormat}`,
      //   ),
      // )
      const formattedTime = moment(value)
        .utc()
        .tz(`${settings.timeZone}`)
        .format(`${currentDateFormat[0].keywordText} ${momentTimeFormat}`)
      // console.log('useDateTimeFormat:: ', {formattedTime})
      return formattedTime
    },
  }
}

export default useDateTimeFormat
