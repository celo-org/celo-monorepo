import { getRegionCodeFromCountryCode } from '@celo/utils/src/phoneNumbers'
import { createSelector } from 'reselect'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { countryFeatures } from 'src/flags'
import useSelector from 'src/redux/useSelector'

type CountryFeatures = typeof countryFeatures
type SpecificCountryFeatures = { [K in keyof CountryFeatures]: boolean }

type Entries<T> = Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>

export function getCountryFeatures(countryCodeAlpha2: string | null): SpecificCountryFeatures {
  // tslint:disable-next-line: no-object-literal-type-assertion
  const features = {} as SpecificCountryFeatures
  for (const [key, value] of Object.entries(countryFeatures) as Entries<CountryFeatures>) {
    features[key] = countryCodeAlpha2 ? (value as any)[countryCodeAlpha2] ?? false : false
  }
  return features
}

export const getCountryFeaturesSelector = createSelector(
  defaultCountryCodeSelector,
  (countryCallingCode) => {
    const countryCodeAlpha2 = countryCallingCode
      ? getRegionCodeFromCountryCode(countryCallingCode)
      : null
    return getCountryFeatures(countryCodeAlpha2)
  }
)

export function useCountryFeatures() {
  return useSelector(getCountryFeaturesSelector)
}
