// Deprecated
import { StyleSheet } from 'react-native'
import { typeFaces } from 'src/styles'
export const Colors = {
  DARK_GRAY: '#333638',
  TAN: '#FFF5E7',
}

export const Fonts = {
  PRIMARY: typeFaces.garamond,
}

export const TABLET_BREAKPOINT = 576
export const DESKTOP_BREAKPOINT = 992
export const MENU_MAX_WIDTH = 1260

export const CONSENT_HEIGHT = 180
export const HEADER_HEIGHT = 75

export default {
  Colors,
}

export const TextStyles = StyleSheet.create({
  smallerSectionHeader: {
    fontSize: 18,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    textRendering: 'geometricPrecision',
  },
  sectionHeader: {
    fontSize: 24,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    textRendering: 'geometricPrecision',
  },
  main: {
    fontSize: 18,
    lineHeight: 34,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    textRendering: 'geometricPrecision',
  },
  mediumMain: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    textRendering: 'geometricPrecision',
  },
  smallMain: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    textRendering: 'geometricPrecision',
  },
  p: {
    marginTop: 4,
    marginBottom: 4,
  },
  ul: {
    marginTop: 4,
    marginBottom: 4,
  },
  li: {
    marginTop: 4,
    marginBottom: 4,
    flexDirection: 'row',
    flex: 1,
  },
  liText: {
    marginLeft: 15,
  },
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
    padding: 4,
  },
  small: {
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
    textRendering: 'geometricPrecision',
  },
  largeAllCaps: {
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontSize: 20,
    letterSpacing: 1.5,
    fontWeight: '600',
    lineHeight: 32,
    textRendering: 'geometricPrecision',
  },
  largeHeader: {
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontSize: 36,
    letterSpacing: 0,
    fontWeight: '300',
    lineHeight: 58,
    textRendering: 'geometricPrecision',
  },
  semibold16: {
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textRendering: 'geometricPrecision',
    letterSpacing: 1,
  },
  bold: {
    fontWeight: '600',
    fontFamily: Fonts.PRIMARY,
  },
})
