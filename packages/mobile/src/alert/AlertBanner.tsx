import SmartTopAlert from '@celo/react-components/components/SmartTopAlert'
import React, { memo, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { ErrorDisplayType } from 'src/alert/reducer'
import useSelector from 'src/redux/useSelector'

function AlertBanner() {
  const alert = useSelector((state) => state.alert)
  const dispatch = useDispatch()

  const displayAlert = useMemo(() => {
    if (alert?.displayMethod === ErrorDisplayType.BANNER && (alert.title || alert.message)) {
      const onPress = () => {
        const action = alert?.action ?? hideAlert()
        dispatch(action)
      }

      const { type, title, message, buttonMessage, dismissAfter } = alert

      return {
        type,
        title,
        message,
        buttonMessage,
        dismissAfter,
        onPress,
      }
    } else {
      return null
    }
  }, [alert])

  return <SmartTopAlert alert={displayAlert} />
}

export default memo(AlertBanner)
