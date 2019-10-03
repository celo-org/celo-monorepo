import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { BottomTabBar } from 'react-navigation-tabs'
import { connect } from 'react-redux'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'

interface StateProps {
  backupTooLate: boolean
}

interface OwnProps {
  onTabPress?: () => void
  inactiveTintColor: string
}

type Props = StateProps & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupTooLate: isBackupTooLate(state),
  }
}

// tslint:disable-next-line
const onPress = () => {}

export const TabBar = (props: Props) => {
  const { backupTooLate } = props
  const inactiveTintColor = backupTooLate ? colors.inactive : props.inactiveTintColor
  const onTabPress = backupTooLate ? onPress : props.onTabPress
  return <BottomTabBar {...props} inactiveTintColor={inactiveTintColor} onTabPress={onTabPress} />
}

export default connect<StateProps, {}, OwnProps, RootState>(mapStateToProps)(TabBar)
