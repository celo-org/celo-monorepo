export declare enum ValidatorKind {
    Custom = "custom",
    Decimal = "decimal",
    Integer = "integer",
    Phone = "phone"
}
export interface BaseProps {
    validator?: ValidatorKind;
    customValidator?: (input: string) => string;
    countryCallingCode?: string;
    decimalSeparator?: string;
}
export declare function validateInteger(input: string): string;
export declare function validateDecimal(input: string, decimalSeparator?: string): string;
export declare function validatePhone(input: string, countryCallingCode?: string): string;
export declare function validateInput(input: string, props: BaseProps): string;
