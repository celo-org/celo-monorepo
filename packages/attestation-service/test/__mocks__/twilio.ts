/* Simplest mock of `twilio` to test sms module */

// Innermost functions that actually send the SMS
export const mockVerifyCreate = jest.fn((_obj: Object) => {
  return {
    sid: undefined,
  }
})
export const mockMessagesCreate = jest.fn((_obj: Object) => {
  return {
    sid: undefined,
  }
})

const twilio = jest.fn().mockImplementation((_twilioSid, _twilioAuthToken) => {
  return {
    messaging: {
      services: {
        get: (val: string) => {
          return { fetch: () => val }
        },
      },
    },
    messages: {
      create: mockMessagesCreate,
    },
    verify: {
      services: Object.assign(
        (_sid: string) => {
          return {
            verifications: {
              create: mockVerifyCreate,
            },
          }
        },
        {
          get: (_sid: string) => {
            return {
              fetch: () =>
                Promise.resolve({
                  customCodeEnabled: true,
                }),
            }
          },
        }
      ),
    },
  }
})

export default twilio
