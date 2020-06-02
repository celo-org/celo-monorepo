import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { ErrorDisplayType, State as AlertState } from 'src/alert/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  alert: AlertState | null
}

interface DispatchProps {
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    alert: state.alert,
  }
}

const mapDispatchToProps = {
  hideAlert,
}

export class AlertBanner extends React.Component<Props> {
  render() {
    const { alert, hideAlert: hideAlertAction } = this.props

    return (
      <SmartTopAlert
        isVisible={!!alert && alert.displayMethod === ErrorDisplayType.BANNER}
        timestamp={Date.now()}
        text={alert && alert.message}
        onPress={hideAlertAction}
        type={alert && alert.type === 'error' ? NotificationTypes.ERROR : NotificationTypes.MESSAGE}
        dismissAfter={alert && alert.dismissAfter}
        buttonMessage={alert && alert.buttonMessage}
        title={alert && alert.title}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(AlertBanner)
