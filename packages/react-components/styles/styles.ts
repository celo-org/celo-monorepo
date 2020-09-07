import colors from '@celo/react-components/styles/colors'
import { fontFamily } from '@celo/react-components/styles/fonts'
import { StyleSheet } from 'react-native'

export const TOP_BAR_HEIGHT = 56

export function elevationShadowStyle(elevation: number) {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 0.5 * elevation },
    shadowOpacity: 0.3,
    shadowRadius: 0.8 * elevation,
  }
}

export const componentStyles = StyleSheet.create({
  marginTop10: {
    marginTop: 10,
  },
  marginTop15: {
    marginTop: 15,
  },
  marginTop20: {
    marginTop: 20,
  },
  paddingTop5: {
    paddingTop: 5,
  },
  row: {
    borderWidth: 1,
    borderColor: colors.gray4,
    borderRadius: 3,
    flexDirection: 'row',
    marginVertical: 5,
    alignItems: 'center',
    backgroundColor: colors.light,
    height: 60,
  },
  input: {
    marginLeft: 10,
    flex: 1,
    color: '#555',
    fontSize: 16,
    fontFamily,
  },
  inputRow: {
    alignItems: 'center',
    borderColor: colors.gray1,
    borderRadius: 3,
    borderWidth: 1,
    flexDirection: 'row',
    height: 50,
    marginVertical: 5,
    marginHorizontal: 10,
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  topBar: {
    height: TOP_BAR_HEIGHT,
  },
  line: {
    height: 5,
    borderBottomWidth: 1,
    borderColor: colors.gray1,
  },
  roundedBorder: {
    borderColor: colors.gray1,
    borderRadius: 3,
    borderWidth: 1,
  },
  screenHeader: {
    textAlign: 'center',
    fontWeight: undefined,
  },
  errorMessage: {
    fontFamily,
    fontSize: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(238, 238, 238, 0.75)',
    padding: 15,
  },
})
