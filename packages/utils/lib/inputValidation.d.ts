import { BaseProps } from '@celo/base/lib/inputValidation';
export { BaseProps, validateDecimal, validateInteger, ValidatorKind, } from '@celo/base/lib/inputValidation';
export declare function validatePhone(input: string, countryCallingCode?: string): string;
export declare function validateInput(input: string, props: BaseProps): string;
