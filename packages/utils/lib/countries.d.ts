import countryData from 'country-data';
interface CountryNames {
    [name: string]: string;
}
export interface LocalizedCountry extends Omit<countryData.Country, 'countryCallingCodes'> {
    displayName: string;
    displayNameNoDiacritics: string;
    names: CountryNames;
    countryPhonePlaceholder: {
        national?: string | undefined;
        international?: string | undefined;
    };
    countryCallingCode: string;
}
export declare class Countries {
    language: string;
    countryMap: Map<string, LocalizedCountry>;
    localizedCountries: LocalizedCountry[];
    constructor(language?: string);
    getCountry(countryName?: string | null): LocalizedCountry | undefined;
    getCountryByCodeAlpha2(countryCode: string): LocalizedCountry | undefined;
    getFilteredCountries(query: string): LocalizedCountry[];
    private assignCountries;
}
export {};
