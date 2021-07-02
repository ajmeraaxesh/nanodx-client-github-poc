import {useState, useEffect} from 'react'

export const formStates = {
  DEFAULT: 'not submitted',
  SUBMITTED: 'submitted',
  SUCCESS: 'success',
  ERROR: 'error',
}

const useFormHandling = () => {
  const [formProcessingState, setFormProcessingState] = useState(
    formStates.DEFAULT,
  )

  useEffect(() => {
    setFormProcessingState(formStates.DEFAULT)
  }, [])

  return {
    formProcessingState,
    setFormProcessingState,
  }
}

export default useFormHandling
