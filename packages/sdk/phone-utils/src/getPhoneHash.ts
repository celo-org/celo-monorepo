// Remove this function causes the most weird error on celocli tests
const getPhoneHash = (_number: string, _salt?: string) => {
  throw new Error('Do not use getPhoneHash from @celo/phone-utils')
}

export default getPhoneHash
