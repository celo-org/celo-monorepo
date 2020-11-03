import 'react-native'
import { getCountryFeaturesSelector } from 'src/utils/countryFeatures'
import { getMockStoreData } from 'test/utils'

describe(getCountryFeaturesSelector, () => {
  it('returns the appropriate features for US accounts', () => {
    const state = getMockStoreData({
      account: {
        defaultCountryCode: '+1',
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": false,
      }
    `)
  })

  it('returns the appropriate features for PH accounts', () => {
    const state = getMockStoreData({
      account: {
        defaultCountryCode: '+63',
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "RESTRICTED_CP_DOTO": true,
        "SANCTIONED_COUNTRY": false,
      }
    `)
  })

  it('returns the appropriate features for CU accounts', () => {
    const state = getMockStoreData({
      account: {
        defaultCountryCode: '+53',
      },
    })

    expect(getCountryFeaturesSelector(state)).toMatchInlineSnapshot(`
      Object {
        "RESTRICTED_CP_DOTO": false,
        "SANCTIONED_COUNTRY": true,
      }
    `)
  })
})
