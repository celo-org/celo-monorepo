import { DependencyList, useEffect } from 'react'
import { BackHandler } from 'react-native'

export default function useBackHandler(handler: () => boolean, deps: DependencyList) {
  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', handler)

    return () => BackHandler.removeEventListener('hardwareBackPress', handler)
  }, deps)
}
