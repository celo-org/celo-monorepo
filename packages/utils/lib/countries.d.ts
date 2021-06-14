import countryData from 'country-data';
interface CountryNames {
    [name: string]: string;
}
export interface LocalizedCountry extends countryData.Country {
    displayName: string;
    names: CountryNames;
    countryPhonePlaceholder: {
        national?: string | undefined;
        international?: string | undefined;
    };
}
interface CountrySearch {
    displayName: string;
    countryCode: string;
}
export declare class Countries {
    language: string;
    countryMap: Map<string, LocalizedCountry>;
    localizedCountries: LocalizedCountry[];
    countriesWithNoDiacritics: CountrySearch[];
    constructor(language?: string);
    getCountry(countryName?: string | null): LocalizedCountry;
    getCountryByPhoneCountryCode(countryCode: string): LocalizedCountry;
    getCountryByCode(countryCode: string): LocalizedCountry;
    getFilteredCountries(query: string): string[];
    private assignCountries;
}
export {};
