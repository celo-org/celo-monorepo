import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { ErrorDisplay, ErrorKeys } from 'src/forms/ErrorDisplay'
import Form, { emailIsValid } from 'src/forms/Form'
import SubmitButton from 'src/forms/SubmitButton'
import SuccessDisplay from 'src/forms/SuccessDisplay'
import { TextInput } from 'src/forms/TextInput'
import { NameSpaces, useTranslation } from 'src/i18n'
import { useScreenSize } from 'src/layout/ScreenSize'
import { SIZE } from 'src/shared/Button.3'
import Responsive from 'src/shared/Responsive'
import { colors, fonts, standardStyles } from 'src/styles'

const NEWSLETTER_LIST = '1'
export const DEVELOPER_LIST = '10'

interface OwnProps {
  submitText: string
  route?: string
  listID?: string
  isDarkMode?: boolean
}

const blankForm = { email: '', fullName: '', list: '' }

type Props = OwnProps

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

export default React.memo(function EmailForm({
  isDarkMode,
  submitText,
  listID = NEWSLETTER_LIST,
  route = '/contacts',
}: Props) {
  const inputTheme = isDarkMode ? styles.inputDarkMode : styles.inputLightMode
  const { isDesktop } = useScreenSize()
  const { t } = useTranslation(NameSpaces.common)

  return (
    <Form route={route} blankForm={{ ...blankForm, list: listID }} validateWith={validateFields}>
      {({ formState, onInput, onSubmit }) => {
        const borderStyle = emailErrorStyle(formState.errors)
        const hasError = !!formState.apiError || !!formState.errors.length
        const errorKey = formState.apiError || ErrorKeys.email
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
                  placeholder={t('common:email') + '*'}
                  placeholderTextColor={
                    isDarkMode ? colors.placeholderDarkMode : colors.placeholderGray
                  }
                  name="email"
                  type="email"
                  value={formState.form.email}
                  required={true}
                />
              </Responsive>
              {!isDesktop && (
                <View style={!!formState.errors.length && styles.feedbackMobile}>
                  <ErrorDisplay isShowing={hasError} field={errorKey} />
                </View>
              )}
              <Responsive large={[styles.submitBtn, styles.submitBtnDesktop]}>
                <SubmitButton
                  isLoading={formState.isLoading}
                  onPress={onSubmit}
                  text={submitText}
                  size={SIZE.fullWidth}
                />
              </Responsive>
              <View style={styles.feedback}>
                {isDesktop && <ErrorDisplay isShowing={hasError} field={errorKey} />}
              </View>
            </View>
            <View style={styles.success}>
              <SuccessDisplay isShowing={formState.isComplete} message={t('common:shortSuccess')} />
            </View>
          </Responsive>
        )
      }}
    </Form>
  )
})

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
    top: 65,
  },
  feedbackMobile: {
    marginBottom: 5,
  },
  success: {
    marginTop: 10,
  },
})
