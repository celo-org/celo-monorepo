import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import { Dimensions, StyleSheet } from 'react-native'

const { width } = Dimensions.get('window')
const Styles = StyleSheet.create({
  header: {
    width,
    height: (width * 440) / 750,
  },
  flexGrow: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCentered: {
    textAlign: 'center',
  },
  bg: {
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
  },
  whiteBg: {
    backgroundColor: 'white',
  },
  whiteText: {
    color: 'white',
  },
  grayText: {
    color: colors.gray5,
  },
  listItem: {
    flexDirection: 'row',
    marginHorizontal: variables.contentPadding * 2,
  },
  form: {
    marginHorizontal: variables.contentPadding * 2,
  },
})

export default Styles
