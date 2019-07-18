import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TextInput } from 'src/forms/FormComponents'

import { I18nProps, withNamespaces } from 'src/i18n'
import Button, { BTN } from 'src/shared/Button.3'
import Form from 'src/shared/Form'
import { colors, fonts, standardStyles, textStyles, typeFaces } from 'src/styles'

const MAX_CTA_LENGTH = 42

interface Props {
  includeDetails: boolean
  includeInterest: boolean
  cta?: string
}

const blankForm = {
  fullName: '',
  email: '',
  company: '',
  role: '',
  interest: '',
}

export class EmailSubscribeForm extends React.Component<Props & I18nProps> {
  render() {
    const { cta, t } = this.props

    const buttonCta = cta ? cta : t('submit')

    const submitStyle = htmlStyles.submit
    if (buttonCta.toString().length > MAX_CTA_LENGTH) {
      submitStyle.fontSize = 16
    }

    return (
      <View>
        <Form route="/contacts" blankForm={blankForm}>
          {({ onSubmit, onInput, formState, onSelect }) => (
            <form acceptCharset="UTF-8" style={{ maxWidth: '580px', width: '100%' }}>
              {this.props.includeDetails && [
                <TextInput
                  focusStyle={standardStyles.inputFocused}
                  onChange={onInput}
                  key={'input1'}
                  style={standardStyles.input}
                  placeholder={t('form.name') + '*'}
                  placeholderTextColor={colors.placeholderGray}
                  name="fullName"
                  value={formState.form.fullName}
                  required={true}
                />,
                <TextInput
                  focusStyle={standardStyles.inputFocused}
                  onChange={onInput}
                  key={'input2'}
                  style={standardStyles.input}
                  placeholder={t('form.company')}
                  placeholderTextColor={colors.placeholderGray}
                  name="company"
                  value={formState.form.company}
                  required={false}
                />,
                <TextInput
                  focusStyle={standardStyles.inputFocused}
                  onChange={onInput}
                  key={'input3'}
                  style={standardStyles.input}
                  placeholder={t('form.role')}
                  placeholderTextColor={colors.placeholderGray}
                  name="role"
                  value={formState.form.role}
                  required={false}
                />,
              ]}

              <TextInput
                focusStyle={standardStyles.inputFocused}
                onChange={onInput}
                style={inputStyle}
                placeholder={t('form.email') + '*'}
                placeholderTextColor={colors.placeholderGray}
                name="email"
                type="email"
                value={formState.form.email}
                required={true}
              />

              {this.props.includeInterest && (
                <select
                  style={htmlStyles.select}
                  value={formState.form.interest}
                  name="interest"
                  onChange={onSelect('interest')}
                >
                  <option value="">{t('form.interests.topic')}</option>
                  <option value={t('form.interests.partnership') as string}>
                    {t('form.interests.partnership')}
                  </option>
                  <option value={t('form.interests.community') as string}>
                    {t('form.interests.community')}
                  </option>
                  <option value={t('form.interests.jobs') as string}>
                    {t('form.interests.jobs')}
                  </option>
                  <option value={t('form.interests.other') as string}>
                    {t('form.interests.other')}
                  </option>
                </select>
              )}
              <View style={styles.button}>
                <Button text={buttonCta} onPress={onSubmit} kind={BTN.PRIMARY} />
              </View>

              <View style={styles.thanks}>
                {formState.isComplete && (
                  <Text style={[fonts.p, textStyles.center]}>{t('form.thankYou')}</Text>
                )}
              </View>
            </form>
          )}
        </Form>
      </View>
    )
  }
}

const inputStyle = [standardStyles.input, { width: '100%', backgroundColor: 'white' }]

const styles = StyleSheet.create({
  thanks: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    minHeight: 80,
  },
  button: {
    marginVertical: 15,
  },
})

// @ts-ignore
const htmlStyles: any = {
  select: {
    display: 'inline-block',
    fontFamily: typeFaces.garamond,
    fontStyle: 'normal',
    fontSize: 16,
    color: 'rgba(61, 61, 61, 0.5)',
    alignSelf: 'center',
    padding: '10px',
    borderRadius: '3px',
    borderWidth: '1px',
    borderColor: 'rgba(61, 61, 61, 0.2)',
    width: '100%',
    marginTop: '11px',
    appearance: 'none',
    WebkitAppearance: 'none',
    verticalAlign: 'middle',
    overflow: 'visible !important',
    background:
      "#fff url(\"data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%233d3d3d' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3E\") no-repeat right 0.75rem center",
    backgroundSize: '8px 10px',
  },
}

export default withNamespaces('applications')(EmailSubscribeForm)
