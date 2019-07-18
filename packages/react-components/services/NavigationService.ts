// https://github.com/react-navigation/react-navigation/issues/1439

// @ts-ignore
import { DrawerActions, NavigationActions, NavigationParams, StackActions } from 'react-navigation'

let navigator: any

export const setTopLevelNavigator = (navigatorRef: any) => {
  navigator = navigatorRef
}

export const navigate = (routeName: string, params?: NavigationParams) => {
  navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params,
    })
  )
}

export const navigateReset = (routeName: string, params?: NavigationParams) => {
  navigator.dispatch(
    StackActions.reset({
      index: 0,
      actions: [
        NavigationActions.navigate({
          routeName,
          params,
        }),
      ],
    })
  )
}

export const openDrawer = () => {
  navigator.dispatch(DrawerActions.openDrawer())
}

export const closeDrawer = () => {
  navigator.dispatch(DrawerActions.closeDrawer())
}

export const toggleDrawer = () => {
  navigator.dispatch(DrawerActions.toggleDrawer())
}

export const navigationState = () => {
  return navigator ? navigator.state.nav : {}
}

export const navigateBack = () => {
  navigator.dispatch(NavigationActions.back())
}
