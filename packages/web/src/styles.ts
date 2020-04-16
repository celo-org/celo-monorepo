import { StyleSheet, TextStyle } from 'react-native'

export enum colors {
  white = '#FFFFFF',
  light = '#E5E5E5',
  gray = '#DDDDDD',
  screenGray = '#545C64',
  placeholderGray = '#D1D5D8',
  placeholderDarkMode = '#838486',
  secondary = '#81868B',
  dark = '#2E3338',
  darkTransparent = 'rgba(46, 51, 56, 0.5)',
  gold = '#FBCC5C',
  goldDark = '#D8A11F',
  goldSelect = 'rgba(251, 204, 92, 0.4)',
  goldSubtle = 'rgba(251, 204, 92, 0.2)',
  primary = '#35D07F',
  primaryPress = '#0FB972',
  primaryHover = '#4CDD91',
  inactive = 'rgba(69, 214, 138, 0.7)',

  orange = '#FFB765',
  error = '#FF7F6D',
  red = '#FB7C6D',
  purple = '#BF97FF',
  deepBlue = '#3488EC',
  lightBlue = '#73DDFF',
  cyan = '#3DBFFF',
  turquoise = '#29EDFF',

  greenScreen = '#0CDA6E',
  purpleScreen = '#924EFF',
  redScreen = '#FF6553',
  blueScreen = '#52B6FF',

  // added
  faintGray = '#F8F9F9',
  faintPurple = '#EFE5FF',
  faintGold = '#FEF2D6',
  faintRed = '#FEDEDA',
  faintCyan = '#DCF6FF',
  lightGray = '#EDEEEF',

  grayHeavy = '#ABADAF',
  black = '#000',
}

export enum typeFaces {
  futura = 'Jost, futura-pt, futura, sans-serif',
  garamond = 'EB Garamond, eb-garamond, Garamond, serif',
}

const fontDefaults = {
  textRendering: 'geometricPrecision',
  color: colors.dark,
}

export const fontInfo: Record<string, TextStyle> = {
  h1: {
    fontFamily: typeFaces.garamond,
    fontSize: 48,
    lineHeight: 56,
    ...fontDefaults,
  },
  h1Mobile: {
    fontFamily: typeFaces.garamond,
    fontSize: 36,
    lineHeight: 40,
    ...fontDefaults,
  },
  h2: {
    fontFamily: typeFaces.garamond,
    fontSize: 40,
    lineHeight: 48,
    ...fontDefaults,
  },
  h2Mobile: {
    fontFamily: typeFaces.garamond,
    fontSize: 28,
    lineHeight: 32,
    ...fontDefaults,
  },
  h3: {
    fontFamily: typeFaces.futura,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '400',
    ...fontDefaults,
  },
  h3Mobile: {
    fontFamily: typeFaces.futura,
    fontSize: 24,
    lineHeight: 32,
    ...fontDefaults,
  },
  h4: {
    fontFamily: typeFaces.garamond,
    fontSize: 28,
    lineHeight: 36,
    ...fontDefaults,
  },
  h4Mobile: {
    fontFamily: typeFaces.garamond,
    fontSize: 24,
    lineHeight: 32,
    ...fontDefaults,
  },
  h5: {
    fontFamily: typeFaces.futura,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '500',
    ...fontDefaults,
  },
  h6: {
    fontFamily: typeFaces.futura,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '500',
    ...fontDefaults,
  },
  navigation: {
    fontFamily: typeFaces.futura,
    fontSize: 16,
    lineHeight: 16,
    textAlign: 'center',
    ...fontDefaults,
    cursor: 'pointer',
    fontWeight: '500',
  },
  p: {
    fontFamily: typeFaces.garamond,
    fontSize: 20,
    lineHeight: 28,
    ...fontDefaults,
  },
  legal: {
    fontFamily: typeFaces.garamond,
    fontSize: 16,
    lineHeight: 20,
    ...fontDefaults,
  },
  a: {
    fontFamily: typeFaces.futura,
    fontSize: 16,
    lineHeight: 16,
    ...fontDefaults,
  },
  mini: {
    fontFamily: typeFaces.garamond,
    fontSize: 14,
    lineHeight: 16,
    ...fontDefaults,
  },
  micro: {
    fontFamily: typeFaces.futura,
    fontSize: 14,
    ...fontDefaults,
  },
  uiSmall: {
    fontFamily: typeFaces.futura,
    fontSize: 12,
    ...fontDefaults,
  },
  superLarge: {
    fontSize: 72,
    lineHeight: 72,
    fontFamily: typeFaces.futura,
    textRendering: 'geometricPrecision',
  },
}

export const fonts = StyleSheet.create(fontInfo)

export const textStyles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  left: {
    textAlign: 'left',
  },
  lean: { fontWeight: '300' },
  medium: {
    fontWeight: '500',
  },
  heavy: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  heading: {
    marginBottom: 20,
  },
  error: {
    color: colors.error,
    fontWeight: '500',
  },
  invert: {
    color: colors.white,
  },
  readingOnDark: {
    color: colors.gray,
  },
  caption: {
    paddingTop: 5,
  },
})

const margins = {
  large: 100,
  medium: 60,
  small: 20,
}

const tabletMargins = {
  large: 75,
  medium: 40,
  small: 20,
}

const mobileMargins = {
  large: 50,
  medium: 30,
  small: 20,
}

export const standardStyles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalLine: {
    height: 100,
    width: 2,
    backgroundColor: colors.gray,
  },
  row: {
    flexDirection: 'row',
  },
  wrap: {
    flexWrap: 'wrap',
  },
  sectionMargin: {
    marginVertical: margins.large,
  },
  sectionMarginBottom: {
    marginBottom: margins.large,
  },
  sectionMarginTop: {
    marginTop: margins.large,
  },
  sectionMarginMobile: {
    marginVertical: mobileMargins.large,
  },
  sectionMarginBottomMobile: {
    marginBottom: mobileMargins.large,
  },
  sectionMarginTopMobile: {
    marginTop: mobileMargins.large,
  },
  sectionMarginTablet: {
    marginVertical: tabletMargins.large,
  },
  sectionMarginBottomTablet: {
    marginBottom: tabletMargins.large,
  },
  sectionMarginTopTablet: {
    marginTop: tabletMargins.large,
  },
  blockMargin: {
    marginVertical: margins.medium,
  },
  blockMarginTop: {
    marginTop: margins.medium,
  },
  blockMarginBottom: {
    marginBottom: margins.medium,
  },
  blockMarginMobile: {
    marginVertical: mobileMargins.medium,
  },
  blockMarginTopMobile: {
    marginTop: mobileMargins.medium,
  },
  blockMarginBottomMobile: {
    marginBottom: mobileMargins.medium,
  },
  blockMarginTablet: {
    marginVertical: tabletMargins.medium,
  },
  blockMarginTopTablet: {
    marginTop: tabletMargins.medium,
  },
  blockMarginBottomTablet: {
    marginBottom: tabletMargins.medium,
  },
  halfElement: {
    marginVertical: margins.small / 2,
  },
  elementalMargin: {
    marginVertical: margins.small,
  },
  elementalMarginTop: {
    marginTop: margins.small,
  },
  elementalMarginBottom: {
    marginBottom: margins.small,
  },
  input: {
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingTop: 13,
    paddingBottom: 15,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(61, 61, 61, 0.2)',
    width: '100%',
    marginVertical: 5,
    marginHorizontal: 0,
    fontSize: 16,
    fontFamily: typeFaces.garamond,
    outlineWidth: 0,
  },
  inputDarkMode: {
    borderColor: colors.gray,
    color: colors.white,
  },
  inputDarkFocused: {
    borderColor: colors.white,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  darkBackground: {
    backgroundColor: colors.dark,
  },
})

// These dont seem to be applied when set thru stylesheet
export const baseCoinStyle = {
  stroke: colors.screenGray,
  mixBlendMode: 'screen',
}

export const baseCoinStyleLight = {
  stroke: colors.gray,
  mixBlendMode: 'multiply',
}
