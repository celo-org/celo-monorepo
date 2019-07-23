// Deprecated
import { StyleSheet } from 'react-native'

export const Colors = {
  DARK_GRAY: '#333638',
  GRAY: 'rgba(0,0,0, 0.2)',
  WHITE: '#FFFFFF',
  PRIMARY: '#45D68A',
  TAN: '#FFF5E7',
  GOLD: '#EFC869',
  SPACER: 'rgba(255, 255, 255, 0.1)',
  GREEN: '#42D689',
  LIGHT: 'rgba(255, 255, 255, 0.5)',
  GRAY_INACTIVE: '#D1D5D8',
}

export const Fonts = {
  PRIMARY: 'Hind Siliguri',
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
  button: {
    fontSize: 16,
    lineHeight: 16,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontWeight: '600',
    textRendering: 'geometricPrecision',
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
