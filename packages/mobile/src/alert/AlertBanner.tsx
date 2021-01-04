import SmartTopAlert, { AlertTypes } from '@celo/react-components/components/SmartTopAlert'
import * as React from 'react'
import { useDispatch } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { ErrorDisplayType } from 'src/alert/reducer'
import useSelector from 'src/redux/useSelector'

export default function AlertBanner() {
  const alert = useSelector((state) => state.alert)
  const dispatch = useDispatch()

  const onPress = () => {
    const action = alert?.action ?? hideAlert()
    dispatch(action)
  }

  return (
    <SmartTopAlert
      isVisible={!!alert && alert.displayMethod === ErrorDisplayType.BANNER}
      // TODO: this looks like a hack to re-render, refactor!
      timestamp={Date.now()}
      text={alert && alert.message}
      onPress={onPress}
      type={alert && alert.type === 'error' ? AlertTypes.ERROR : AlertTypes.MESSAGE}
      dismissAfter={alert && alert.dismissAfter}
      buttonMessage={alert && alert.buttonMessage}
      title={alert && alert.title}
    />
  )
}
