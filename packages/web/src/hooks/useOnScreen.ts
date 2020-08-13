import { useEffect, useState } from 'react'
import { findNodeHandle } from 'react-native'

// from https://usehooks.com/useOnScreen/
export default function useOnScreen(ref, fraction = 0, rootMargin = '0px') {
  // State and setter for storing whether element is visible
  const [isIntersecting, setIntersecting] = useState(false)

  useEffect(() => {
    if (
      !('IntersectionObserver' in window) ||
      !('IntersectionObserverEntry' in window) ||
      !('intersectionRatio' in window.IntersectionObserverEntry.prototype)
    ) {
      // if we cant check if element is on screen, just assume it is.
      setIntersecting(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update our state when observer callback fires
        setIntersecting(entry.intersectionRatio >= fraction)
      },
      {
        root: null,
        rootMargin,
        threshold: [0, 0.1, 0.2, 0.5, 0.6, 0.75, 0.8, 0.9, 1],
      }
    )
    const element: any = findNodeHandle(ref.current)
    if (element) {
      observer.observe(element)
    }
    return () => {
      observer.unobserve(element)
    }
  }, []) // Empty array ensures that effect is only run on mount and unmount

  return isIntersecting
}
