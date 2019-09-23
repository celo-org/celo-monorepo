export const LockedGoldArgs = {
  noticePeriodArg: {
    name: 'noticePeriod',
    description:
      'duration (seconds) from notice to withdrawable; doubles as ID of a Locked Gold commitment; ',
  },
  availabilityTimeArg: {
    name: 'availabilityTime',
    description: 'unix timestamp at which withdrawable; doubles as ID of a notified commitment',
  },
  goldAmountArg: {
    name: 'goldAmount',
    description: 'unit amount of gold token (cGLD)',
  },
}
