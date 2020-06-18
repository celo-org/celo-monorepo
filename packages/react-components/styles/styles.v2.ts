import { StyleSheet } from 'react-native'

const BASE_UNIT = 8

export enum Spacing {
  Smallest8 = BASE_UNIT,
  Small12 = BASE_UNIT * 1.5,
  Regular16 = BASE_UNIT * 2,
  Thick24 = BASE_UNIT * 3,
}

export enum Shadow {
  Soft,
  SoftLight,
}

export function getShadowStyle(shadow: Shadow) {
  switch (shadow) {
    case Shadow.Soft:
      return styles.softShadow
    case Shadow.SoftLight:
      return styles.softShadowLight
  }
}

const styles = StyleSheet.create({
  softShadow: {
    elevation: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 1,
    shadowColor: 'rgba(156, 164, 169, 0.4)',
  },
  softShadowLight: {
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 1,
    shadowColor: 'rgba(48, 46, 37, 0.15)',
  },
})

export default styles
