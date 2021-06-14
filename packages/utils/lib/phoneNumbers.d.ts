export interface ParsedPhoneNumber {
    e164Number: string;
    displayNumber: string;
    displayNumberInternational: string;
    countryCode?: number;
    regionCode?: string;
}
export declare function getCountryEmoji(e164PhoneNumber: string, countryCodePossible?: number, regionCodePossible?: string): string;
export declare const getPhoneHash: (phoneNumber: string, salt?: string | undefined) => string;
export declare function getCountryCode(e164PhoneNumber: string): number | null | undefined;
export declare function getRegionCode(e164PhoneNumber: string): string | null | undefined;
export declare function getRegionCodeFromCountryCode(countryCode: string): string | null;
export declare function getDisplayPhoneNumber(phoneNumber: string, defaultCountryCode: string): string;
export declare function getDisplayNumberInternational(e164PhoneNumber: string): string;
export declare function getE164DisplayNumber(e164PhoneNumber: string): string;
export declare function getE164Number(phoneNumber: string, defaultCountryCode: string): string | null;
export declare function isE164Number(phoneNumber: string): boolean;
export declare function isE164NumberStrict(phoneNumber: string): boolean;
export declare function parsePhoneNumber(phoneNumberRaw: string, defaultCountryCode?: string): ParsedPhoneNumber | null;
export declare function anonymizedPhone(phoneNumber: string): string;
export declare function getExampleNumber(regionCode: string, useOnlyZeroes?: boolean, isInternational?: boolean): string | undefined;
export declare const PhoneNumberUtils: {
    getPhoneHash: (phoneNumber: string, salt?: string | undefined) => string;
    getCountryCode: typeof getCountryCode;
    getRegionCode: typeof getRegionCode;
    getDisplayPhoneNumber: typeof getDisplayPhoneNumber;
    getE164Number: typeof getE164Number;
    isE164Number: typeof isE164Number;
    parsePhoneNumber: typeof parsePhoneNumber;
};
