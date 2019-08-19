import SmallButton from '@celo/react-components/components/SmallButton'
import Error from '@celo/react-components/icons/Error'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export enum NotificationTypes {
  MESSAGE = 'message',
  ERROR = 'error',
}

interface Props {
  title?: string | null
  text: string | null
  onPress: () => void
  type: NotificationTypes
  dismissAfter?: number | null
  buttonMessage?: string | null
}

// This component needs to be always mounted for the hide animation to be visible
function SmartTopAlert(props: Props) {
  const [visibleAlertState, setVisibleAlertState] = useState<Props | null>(null)
  const yOffset = useRef(new Animated.Value(-500))
  const containerRef = useRef<View>()
  const animatedRef = useCallback((node) => {
    containerRef.current = node && node.getNode()
  }, [])

  const alertState = useMemo(
    () => {
      // tslint bug?
      // tslint:disable-next-line: no-shadowed-variable
      const { type, title, text, buttonMessage, dismissAfter, onPress } = props
      if (title || text) {
        return {
          type,
          title,
          text,
          buttonMessage,
          dismissAfter,
          onPress,
        }
      } else {
        return null
      }
    },
    [props.type, props.title, props.text, props.buttonMessage, props.dismissAfter, props.onPress]
  )

  function hide() {
    if (!containerRef.current) {
      return
    }

    containerRef.current.measure((l, t, w, height) => {
      Animated.timing(yOffset.current, {
        toValue: -height,
        duration: 150,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setVisibleAlertState(null)
        }
      })
    })
  }

  useEffect(
    () => {
      if (alertState) {
        // show
        setVisibleAlertState(alertState)
      } else {
        // hide
        hide()
      }
    },
    [alertState]
  )

  useEffect(
    () => {
      let rafHandle: number
      let timeoutHandle: number

      if (!visibleAlertState) {
        return
      }

      rafHandle = requestAnimationFrame(() => {
        if (!containerRef.current) {
          return
        }

        containerRef.current.measure((l, t, w, height) => {
          Animated.timing(yOffset.current, {
            // @ts-ignore, react-native type defs are missing this one!
            fromValue: -height,
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start()

          if (visibleAlertState.dismissAfter) {
            timeoutHandle = window.setTimeout(hide, visibleAlertState.dismissAfter)
          }
        })
      })

      return () => {
        if (rafHandle) {
          cancelAnimationFrame(rafHandle)
        }
        if (timeoutHandle) {
          window.clearTimeout(timeoutHandle)
        }
      }
    },
    [visibleAlertState]
  )

  if (!visibleAlertState) {
    return null
  }

  const { type, title, text, buttonMessage, onPress } = visibleAlertState
  const isError = type === NotificationTypes.ERROR

  const testID = isError ? 'errorBanner' : 'infoBanner'

  return (
    <View style={styles.overflowContainer} testID={testID}>
      <TouchableOpacity onPress={onPress}>
        <Animated.View
          ref={animatedRef}
          style={[
            styles.container,
            buttonMessage && styles.containerWithButton,
            isError && styles.containerError,
            { transform: [{ translateY: yOffset.current }] },
          ]}
        >
          {isError && <Error style={styles.errorIcon} />}
          <Text style={[fontStyles.bodySmall, styles.text, isError && fontStyles.semiBold]}>
            {!!title && <Text style={[styles.text, fontStyles.semiBold]}> {title} </Text>}
            {text}
          </Text>
          {buttonMessage && (
            <SmallButton
              onPress={onPress}
              text={buttonMessage}
              solid={false}
              style={styles.button}
              textStyle={styles.buttonText}
              testID={'SmartTopAlertButton'}
            />
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  overflowContainer: {
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.messageBlue,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  containerError: {
    backgroundColor: colors.errorRed,
  },
  containerWithButton: {
    flexDirection: 'column',
  },
  text: {
    color: 'white',
    // Unset explicit lineHeight set by fonts.tsx otherwise the text is not centered vertically
    lineHeight: undefined,
    textAlign: 'center',
  },
  errorIcon: {
    marginHorizontal: 5,
  },
  button: {
    marginTop: 8,
    borderColor: colors.white,
    alignSelf: 'center',
  },
  buttonText: {
    color: colors.white,
  },
})

export default SmartTopAlert
