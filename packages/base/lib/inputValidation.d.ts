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
