import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { NewMember } from 'src/alliance/AllianceMember'
import { CheckboxWithLabel } from 'src/forms/CheckboxWithLabel'
import { ErrorDisplay } from 'src/forms/ErrorDisplay'
import FormContainer, { emailIsValid, hasField } from 'src/forms/Form'
import { Form } from 'src/forms/FormComponents'
import { LabeledInput } from 'src/forms/LabeledInput'
import SubmitButton from 'src/forms/SubmitButton'
import SuccessDisplay from 'src/forms/SuccessDisplay'
import { NameSpaces, useTranslation } from 'src/i18n'
import { useScreenSize } from 'src/layout/ScreenSize'
import { SIZE } from 'src/shared/Button.3'
import { standardStyles } from 'src/styles'

const BLANK_FORM: NewMember = {
  name: '',
  email: '',
  contribution: '',
  subscribe: false,
}

function validateWith(fields: NewMember) {
  return Object.keys(fields).filter((key) => {
    if (key === 'email') {
      return !emailIsValid(fields[key])
    } else if (key === 'subscribe' || key === 'contribution') {
      return false
    } else {
      return !hasField(fields[key])
    }
  })
}

export default function SignupForm() {
  const { t } = useTranslation(NameSpaces.alliance)
  const { isMobile, isDesktop } = useScreenSize()
  return (
    <FormContainer route="/api/alliance" blankForm={BLANK_FORM} validateWith={validateWith}>
      {({ formState, onInput, onCheck, onSubmit }) => (
        <Form>
          <View style={styles.container}>
            <View style={isDesktop && standardStyles.row}>
              <View style={styles.inputContainer}>
                <LabeledInput
                  isDarkMode={true}
                  label={t('form.name')}
                  onInput={onInput}
                  allErrors={formState.errors}
                  name="name"
                  value={formState.form.name}
                />
              </View>
              <View style={styles.inputContainer}>
                <LabeledInput
                  isDarkMode={true}
                  label={t('form.email')}
                  onInput={onInput}
                  allErrors={formState.errors}
                  name="email"
                  value={formState.form.email}
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <LabeledInput
                isDarkMode={true}
                label={t('form.contribution')}
                onInput={onInput}
                name="contribution"
                value={formState.form.contribution}
              />
            </View>
            <View style={styles.inputContainer}>
              <CheckboxWithLabel
                name={'subscribe'}
                checked={!!formState.form.subscribe}
                onPress={onCheck}
                label={t('form.subscribe')}
              />
            </View>
          </View>
          <View
            style={[standardStyles.centered, styles.buttonContainer, isMobile && styles.stretch]}
          >
            <SubmitButton
              isLoading={formState.isLoading}
              text={t('form.btn')}
              onDarkBackground={true}
              onPress={onSubmit}
              style={styles.buttonText}
              size={isMobile ? SIZE.fullWidth : SIZE.big}
            />
          </View>
          <SuccessDisplay
            style={styles.success}
            isShowing={formState.isComplete}
            message={t('common:applicationSubmitted')}
          />
          <View style={standardStyles.centered}>
            <ErrorDisplay isShowing={!!formState.apiError} field={formState.apiError} />
          </View>
        </Form>
      )}
    </FormContainer>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  buttonContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  stretch: {
    alignItems: 'stretch',
  },
  buttonText: {
    fontSize: 20,
  },
  success: {
    textAlign: 'center',
    marginTop: 15,
  },
  container: { margin: 20 },
})
