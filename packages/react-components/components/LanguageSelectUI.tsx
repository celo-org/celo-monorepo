import Button, { BtnTypes } from '@celo/react-components/components/Button'
import SelectionOption from '@celo/react-components/components/SelectionOption'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { TranslationFunction } from 'i18next'
import * as React from 'react'
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, View } from 'react-native'

interface LanguageType {
  name: string
  code: string
}

export interface Props {
  logo: ImageSourcePropType
  onLanguageSelected: (language: string, code: string) => void
  onSubmit: () => void
  isSubmitDisabled: boolean
  currentSelected: string
  t: TranslationFunction
  languages: LanguageType[]
}

class LanguageSelectUI extends React.PureComponent<Props> {
  render() {
    const {
      logo,
      onLanguageSelected,
      onSubmit,
      isSubmitDisabled,
      currentSelected,
      t,
      languages,
    } = this.props

    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={{ alignItems: 'center' }}>
            <Image source={logo} style={styles.logo} resizeMode={'contain'} />
          </View>
          <Text style={[fontStyles.h1, styles.h1]} testID={'ChooseLanguageTitle'}>
            {t('chooseLanguage')}
          </Text>
          <View style={componentStyles.line} testID="line" />
          {languages.map((language: LanguageType) => (
            <SelectionOption
              word={language.name}
              key={language.code}
              onSelectAnswer={onLanguageSelected}
              selected={language.code === currentSelected}
              data={language.code}
              testID={`ChooseLanguage/${language.code}`}
            />
          ))}
        </ScrollView>
        <Button
          onPress={onSubmit}
          text={t('continue')}
          standard={false}
          type={BtnTypes.PRIMARY}
          disabled={isSubmitDisabled}
          testID="ChooseLanguageButton"
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    paddingTop: 30,
  },
  logo: {
    height: 40,
    margin: 20,
  },
  h1: {
    textAlign: 'center',
    color: colors.dark,
  },
})

export default LanguageSelectUI
