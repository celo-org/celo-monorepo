import { StyleSheet } from 'react-native'

// Deprecated
export const Colors = {
  DARK_GRAY: '#333638',
  TAN: '#FFF5E7',
}

export const TABLET_BREAKPOINT = 576
export const DESKTOP_BREAKPOINT = 992
export const MENU_MAX_WIDTH = 1260

export const CONSENT_HEIGHT = 180
export const HEADER_HEIGHT = 75
export const BANNER_HEIGHT = 0

export const TextStyles = StyleSheet.create({
  table: {
    marginTop: 4,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#eee',
  },
  tr: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    flexBasis: 'auto',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  th: {
    fontWeight: '600',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    backgroundColor: '#eee',
  },
  td: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
})
