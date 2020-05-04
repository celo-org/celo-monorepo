// Designer Created Figma Colors
export enum colorsEnum {
  greenFaint = '#97DFC1', // green disabled
  greenBrand = '#42D689',
  greenUI = '#1AB775',
  goldFaint = '#E3C376', // gold disabled
  goldBrand = '#FBCC5C',
  goldUI = '#EEB93C',
  goldDark = '#9C6E00',
  beige = '#F5F4F0',
  brownFaint = '#FFF9EE',
  warning = '#EA6042',
  dark = '#2E3338',
  gray5 = '#81868B',
  gray4 = '#9CA4A9',
  gray3 = '#B4B9BD',
  gray2 = '#EDEEEF',
  gray1 = '#F8F9F9',
  light = '#FFFFFF',
}

export default {
  greenFaint: colorsEnum.greenFaint,
  greenBrand: colorsEnum.greenBrand,
  greenUI: colorsEnum.greenUI,
  goldFaint: colorsEnum.goldFaint,
  goldBrand: colorsEnum.goldBrand,
  goldUI: colorsEnum.goldUI,
  goldDark: colorsEnum.goldDark,
  beige: colorsEnum.beige,
  brownFaint: colorsEnum.brownFaint,
  warning: colorsEnum.warning,
  dark: colorsEnum.dark,
  gray5: colorsEnum.gray5,
  gray4: colorsEnum.gray4,
  gray3: colorsEnum.gray3,
  gray2: colorsEnum.gray2,
  gray1: colorsEnum.gray1,
  light: colorsEnum.light,
  get background() {
    return deprecationNotice('light')
  },
  get gray() {
    return deprecationNotice('gray5')
  },
  get darkSecondary() {
    return deprecationNotice('gray5')
  },
  get darkLightest() {
    return deprecationNotice('gray1')
  },
  get white() {
    return deprecationNotice('light')
  },
  get inactive() {
    return deprecationNotice('gray4')
  },
  get listBorder() {
    return deprecationNotice('gray2')
  },
  get inputBorder() {
    return deprecationNotice('gray2')
  },
  get celoGold() {
    return deprecationNotice('goldBrand')
  },
  get celoGoldInactive() {
    return deprecationNotice('goldFaint')
  },
  get celoGreen() {
    return deprecationNotice('greenBrand')
  },
  get celoDarkGreenInactive() {
    return deprecationNotice('greenFaint')
  },
  get celoGreenInactive() {
    return deprecationNotice('greenFaint')
  },
  get errorRed() {
    return deprecationNotice('warning')
  },
}

function deprecationNotice(color: string) {
  console.warn(`deprecated: trying colors.${color}`)
  // @ts-ignore
  return colorsEnum[color]
}
