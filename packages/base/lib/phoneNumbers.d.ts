export interface ParsedPhoneNumber {
    e164Number: string;
    displayNumber: string;
    displayNumberInternational: string;
    countryCode?: number;
    regionCode?: string;
}
export declare const getPhoneHash: (sha3: (a: string) => string | null, phoneNumber: string, salt?: string | undefined) => string;
export declare function isE164Number(phoneNumber: string): boolean;
export declare function anonymizedPhone(phoneNumber: string): string;
export declare const PhoneNumberBase: {
    getPhoneHash: (sha3: (a: string) => string | null, phoneNumber: string, salt?: string | undefined) => string;
    isE164Number: typeof isE164Number;
};
