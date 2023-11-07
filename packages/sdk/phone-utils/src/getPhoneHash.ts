const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  if (salt) {
    return `0x${phoneNumber + salt}`
  }
  // backwards compatibility for old phoneUtils getPhoneHash
  return 'no goood'
}

export default getPhoneHash
