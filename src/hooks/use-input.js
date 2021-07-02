import {useState} from 'react'

const useInput = initialValue => {
  const [value, setValue] = useState(initialValue)
  return {
    value,
    setValue,
  }
}

export default useInput
