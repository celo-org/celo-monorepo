import * as t from 'io-ts';
export declare const URL_REGEX: RegExp;
export declare const isValidUrl: (url: string) => boolean;
export declare const UrlType: t.Type<string, string, unknown>;
export declare const JSONStringType: t.Type<string, string, unknown>;
export declare const E164PhoneNumberType: t.Type<string, string, unknown>;
export declare const AddressType: t.Type<string, string, unknown>;
export declare const PublicKeyType: t.Type<string, string, unknown>;
export declare const SignatureType: t.StringC;
export declare const SaltType: t.StringC;
export declare const AttestationServiceStatusResponseType: t.TypeC<{
    status: t.LiteralC<"ok">;
    smsProviders: t.ArrayC<t.StringC>;
    blacklistedRegionCodes: t.ArrayC<t.StringC>;
    accountAddress: t.Type<string, string, unknown>;
    signature: t.UnionC<[t.StringC, t.UndefinedC]>;
}>;
export declare const AttestationServiceTestRequestType: t.TypeC<{
    phoneNumber: t.Type<string, string, unknown>;
    message: t.StringC;
    signature: t.StringC;
}>;
export declare type AttestationServiceTestRequest = t.TypeOf<typeof AttestationServiceTestRequestType>;
export declare type Signature = t.TypeOf<typeof SignatureType>;
export declare type Address = t.TypeOf<typeof AddressType>;
export declare type E164Number = t.TypeOf<typeof E164PhoneNumberType>;
