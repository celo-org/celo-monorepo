import { Avatar as BaseAvatar } from '@celo/react-components/components/Avatar'
import * as React from 'react'
import { MinimalContact } from 'react-native-contacts'
import { connect } from 'react-redux'
import { RootState } from 'src/redux/reducers'

const DEFAULT_ICON_SIZE = 40

interface Props {
  contact?: MinimalContact
  name?: string
  address?: string
  e164Number?: string
  defaultCountryCode: string
  iconSize?: number
}

interface StateProps {
  defaultCountryCode: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    defaultCountryCode: state.account.defaultCountryCode,
  }
}

// Just a wrapper for convinience which retrieves the defaultCountryCode from redux
function Avatar(props: Props & StateProps) {
  return <BaseAvatar {...props} iconSize={props.iconSize || DEFAULT_ICON_SIZE} />
}

// TODO(Rossy + Jean) simplify this file with useSelector
export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(Avatar)
