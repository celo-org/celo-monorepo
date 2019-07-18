import SmartTopAlert, { NotificationTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { State as AlertState } from 'src/alert/reducer'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  alert: AlertState
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

    return alert !== null ? (
      <SmartTopAlert
        text={alert.message}
        onPress={hideAlertAction}
        type={alert.type === 'error' ? NotificationTypes.ERROR : NotificationTypes.MESSAGE}
        dismissAfter={alert.dismissAfter || null}
        buttonMessage={alert.buttonMessage}
        title={alert.title}
      />
    ) : null
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(AlertBanner)
