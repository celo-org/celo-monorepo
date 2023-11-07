const getPhoneHash = (phoneNumber: string, salt?: string): string => {
  return `0x${phoneNumber + salt}`
}

export default getPhoneHash
