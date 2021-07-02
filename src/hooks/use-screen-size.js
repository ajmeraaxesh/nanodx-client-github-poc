import {useState, useEffect} from 'react'

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState('sm')

  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  // const [windowSize, setWindowSize] = useState({
  //     width: undefined,
  //     height: undefined,
  // })

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      // setWindowSize({
      //     width: window.innerWidth,
      //     height: window.innerHeight,
      // })

      const currentInnerWidth = window.innerWidth
      if (currentInnerWidth <= 640) {
        setScreenSize('mobile')
      } else if (currentInnerWidth > 640 && currentInnerWidth <= 768) {
        setScreenSize('sm')
      } else if (currentInnerWidth > 768 && currentInnerWidth <= 1024) {
        setScreenSize('md')
      } else if (currentInnerWidth > 1024 && currentInnerWidth <= 1280) {
        setScreenSize('lg')
      } else if (currentInnerWidth > 1280 && currentInnerWidth <= 1536) {
        setScreenSize('xl')
      } else {
        setScreenSize('2xl')
      }
    }

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Call handler right away so state gets updated with initial window size
    handleResize()

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Empty array ensures that effect is only run on mount

  return screenSize
}

export default useScreenSize
