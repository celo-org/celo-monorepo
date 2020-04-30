import fontStyles from '@celo/react-components/styles/fonts'

describe('fonts', () => {
  it('should not have fontWeight (fontW', () => {
    const fontStyleProperties = Object.values(fontStyles)
      .map((styleObject) => Object.keys(styleObject))
      .reduce((previousValue, current) => previousValue.concat(current), [])

    expect(fontStyleProperties).not.toContain('fontWeight')
  })
})
