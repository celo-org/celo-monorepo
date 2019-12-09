import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Form, { emailIsValid } from 'src/forms/Form'
import { TextInput } from 'src/forms/FormComponents'
import { I18nProps, withNamespaces } from 'src/i18n'
import Button, { BTN, SIZE } from 'src/shared/Button.3'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles, textStyles } from 'src/styles'

const NEWSLETTER_LIST = '1'
export const DEVELOPER_LIST = '10'

interface OwnProps {
  submitText: string
  route?: string
  listID?: string
  whenComplete: React.ReactNode
  isDarkMode?: boolean
  afterSubmit?: () => void
}

const blankForm = { email: '', fullName: '', list: '' }

type Props = I18nProps & OwnProps

// return array of all invalid fields
const validateFields = ({ email }: { email: string }) => {
  // check email is present and within  and has a @ char that is the secondar chracter or greater
  if (emailIsValid(email)) {
    return []
  } else {
    return ['email']
  }
}

const emailErrorStyle = (errors: string[]) => {
  if (errors.includes('email')) {
    return { borderColor: colors.error }
  }
  return {}
}

function EmailForm({
  t,
  isDarkMode,
  afterSubmit,
  submitText,
  whenComplete,
  listID = NEWSLETTER_LIST,
  route = '/contacts',
}: Props) {
  const inputTheme = isDarkMode ? styles.inputDarkMode : styles.inputLightMode

  return (
    <Form route={route} blankForm={{ ...blankForm, list: listID }} validateWith={validateFields}>
      {({ formState, onInput, onAltSubmit }) => {
        const borderStyle = emailErrorStyle(formState.errors)
        const onPress = () => {
          if (onAltSubmit()) {
            return afterSubmit && afterSubmit()
          }
        }
        return (
          <Responsive large={styles.container}>
            <View style={styles.mobileContainer}>
              <Responsive
                large={[fonts.p, styles.input, inputTheme, styles.inputDesktop, borderStyle]}
              >
                <TextInput
                  style={[fonts.p, styles.input, inputTheme, borderStyle]}
                  focusStyle={
                    isDarkMode ? standardStyles.inputDarkFocused : standardStyles.inputFocused
                  }
                  onChange={onInput}
                  placeholder={t('form.email') + '*'}
                  placeholderTextColor={
                    isDarkMode ? colors.placeholderDarkMode : colors.placeholderGray
                  }
                  name="email"
                  type="email"
                  value={formState.form.email}
                  required={true}
                />
              </Responsive>

              <Responsive large={[styles.submitBtn, styles.submitBtnDesktop]}>
                <Button
                  onPress={onPress}
                  text={submitText}
                  kind={BTN.PRIMARY}
                  size={SIZE.fullWidth}
                  style={styles.submitBtn}
                />
              </Responsive>
              <Responsive large={styles.feedback}>
                <View style={styles.feedbackMobile}>
                  {formState.isComplete && whenComplete}

                  {formState.errors.length > 0 &&
                    formState.errors.map((error) => (
                      <Text style={[fonts.h6, textStyles.error]} key={error}>
                        {t(`validationErrors.${error}`)}
                      </Text>
                    ))}
                </View>
              </Responsive>
            </View>
          </Responsive>
        )
      }}
    </Form>
  )
}

export function After({ t }) {
  return <Text style={[fonts.h6, textStyles.invert]}>{t('stayConnectedThanks')}</Text>
}

const borderWidth = 1
const borderRadius = 3

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
  },
  mobileContainer: {
    width: '100%',
    marginVertical: 5,
    paddingBottom: 15,
  },
  submitBtn: {
    marginVertical: 5,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 40,
  },
  submitBtnDesktop: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  submitText: {
    color: colors.white,
  },
  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 13,
    paddingBottom: 15,
    borderRadius,
    borderWidth,
    marginVertical: 5,
    outlineStyle: 'none',
  },
  inputDesktop: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  inputLightMode: {
    borderColor: colors.gray,
    color: colors.dark,
  },
  inputDarkMode: {
    borderColor: colors.gray,
    color: colors.white,
  },
  feedback: {
    position: 'absolute',
    paddingVertical: 10,
    top: 65,
  },
  feedbackMobile: {
    position: 'absolute',
    paddingVertical: 10,
    top: 135,
  },
})

export default withNamespaces('applications')(EmailForm)
