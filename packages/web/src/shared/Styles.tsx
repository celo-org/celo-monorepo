// Deprecated
import { StyleSheet, Text } from 'react-native'
import Responsive from 'src/shared/Responsive'

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

export const MainStyles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
  horizontalRule: {
    width: '100%',
    maxWidth: 950,
    borderColor: Colors.DARK_GRAY,
    borderBottomWidth: 1,
    opacity: 0.5,
    marginTop: 56,
    marginBottom: 56,
  },
  input: {
    alignSelf: 'center',
    padding: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(61, 61, 61, 0.2)',
    width: '100%',
    marginVertical: 5,
    marginHorizontal: 0,
    fontFamily: Fonts.PRIMARY,
    fontSize: 16,
    fontWeight: '300' as '300',
    // @ts-ignore
    outlineColor: Colors.GREEN,
    outlineWidth: 1,
  },
  pageArea: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
  },
  contentArea: {
    width: '100%',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    maxWidth: MENU_MAX_WIDTH,
    paddingHorizontal: 15,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

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
  mediumSectionHeader: {
    fontSize: 36,
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
  largeHero: {
    fontSize: 32,
    lineHeight: 50,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    textRendering: 'geometricPrecision',
  },
  button: {
    fontSize: 16,
    lineHeight: 16,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontWeight: '600',
    textRendering: 'geometricPrecision',
  },
  light16: {
    fontSize: 16,
    lineHeight: 16,
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontWeight: '300',
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
  allCaps: {
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '600',
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
  smallHeader: {
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontSize: 24,
    letterSpacing: 1,
    fontWeight: '300',
    lineHeight: 40,
    textRendering: 'geometricPrecision',
  },
  mediumHeader: {
    fontFamily: Fonts.PRIMARY,
    color: Colors.DARK_GRAY,
    fontSize: 32,
    fontWeight: '100',
    lineHeight: 50,
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
  link: {
    fontFamily: Fonts.PRIMARY,
    fontWeight: '600',
    color: Colors.DARK_GRAY,
    cursor: 'pointer',
  },
  center: {
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: Fonts.PRIMARY,
  },
  stocky: {
    fontFamily: Fonts.PRIMARY,
    fontWeight: '600',
    lineHeight: 18,
    fontSize: 16,
    letterSpacing: 1,
    color: Colors.DARK_GRAY,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 36,
    lineHeight: 54,
    fontFamily: Fonts.PRIMARY,
  },
  h1: {
    fontSize: 30,
    lineHeight: 40,
    fontFamily: Fonts.PRIMARY,
  },
  h2: {
    fontSize: 20,
    lineHeight: 30,
    fontFamily: Fonts.PRIMARY,
  },
})

export const HeaderText = ({ text }) => {
  return (
    <Responsive medium={TextStyles.largeHeader}>
      <Text style={TextStyles.mediumHeader}>{text}</Text>
    </Responsive>
  )
}
