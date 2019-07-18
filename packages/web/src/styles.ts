import { StyleSheet } from 'react-native'

export enum colors {
  white = '#FFFFFF',
  light = '#E5E5E5',
  gray = '#DDDDDD',
  screenGray = '#545C64',
  placeholderGray = '#D1D5D8',
  placeholderDarkMode = '#838486',
  secondary = '#81868B',
  dark = '#2E3338',
  gold = '#FBCC5C',
  goldSelect = 'rgba(251, 204, 92, 0.4)',
  goldSubtle = 'rgba(251, 204, 92, 0.2)',
  primary = '#35D07F',
  primaryPress = '#0FB972',
  primaryHover = '#4CDD91',
  inactive = 'rgba(69, 214, 138, 0.5)',

  orange = '#FFB765',
  error = '#FF7F6D',
  red = '#FB7C6D',
  purple = '#BF97FF',
  deepBlue = '#3488EC',
  lightBlue = '#73DDFF',
  turquoise = '#29EDFF',

  greenScreen = '#0CDA6E',
  purpleScreen = '#924EFF',
  redScreen = '#FF6553',
  blueScreen = '#52B6FF',
}

export enum typeFaces {
  futura = 'futura-pt, sans-serif',
  garamond = 'eb-garamond, serif',
}

export const fonts = StyleSheet.create({
  h1: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 48,
    lineHeight: 52,
    color: colors.dark,
  },
  h1Mobile: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 36,
    lineHeight: 40,
    color: colors.dark,
  },
  h2: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 44,
    lineHeight: 48,
    color: colors.dark,
  },
  h2Mobile: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 28,
    lineHeight: 32,
    color: colors.dark,
  },
  h3: {
    fontFamily: typeFaces.futura,
    fontSize: 28,
    lineHeight: 32,
    color: colors.dark,
    textRendering: 'geometricPrecision',
  },
  h3Mobile: {
    fontFamily: typeFaces.futura,
    fontSize: 20,
    lineHeight: 24,
    color: colors.dark,
    textRendering: 'geometricPrecision',
  },
  h4: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 28,
    lineHeight: 36,
    color: colors.dark,
  },
  h4Mobile: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 20,
    lineHeight: 24,
    color: colors.dark,
  },
  h5: {
    fontFamily: typeFaces.futura,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.dark,
    textRendering: 'geometricPrecision',
  },
  navigation: {
    fontFamily: typeFaces.futura,
    fontSize: 16,
    lineHeight: 16,
    textAlign: 'center',
    color: colors.dark,
    cursor: 'pointer',
    textRendering: 'geometricPrecision',
  },
  p: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 20,
    lineHeight: 28,
    color: colors.dark,
  },
  legal: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 16,
    lineHeight: 20,
    color: colors.dark,
  },
  a: {
    fontFamily: typeFaces.futura,
    textRendering: 'geometricPrecision',
    fontSize: 16,
    lineHeight: 16,
    color: colors.dark,
  },
  mini: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 14,
    lineHeight: 16,
    color: colors.dark,
  },
  small: {
    fontFamily: typeFaces.futura,
    fontSize: 14,
    color: colors.dark,
    textRendering: 'geometricPrecision',
  },
  superLarge: {
    fontSize: 72,
    lineHeight: 72,
    fontFamily: typeFaces.futura,
    textRendering: 'geometricPrecision',
  },
  // @ts-ignore
  specialOneOff: {
    fontFamily: typeFaces.garamond,
    textRendering: 'geometricPrecision',
    fontSize: 'calc(33px + 0.25vw)',
    lineHeight: `calc(33px + 0.25vw)`,
  },
})

export const textStyles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  left: {
    textAlign: 'left',
  },
  medium: {
    fontWeight: '500',
  },
  heavy: {
    fontWeight: 'bold',
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
