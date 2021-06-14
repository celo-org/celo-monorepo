"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var countries_1 = require("./countries");
var countries = new countries_1.Countries('en-us');
describe('countries', function () {
    describe('getCountryMap', function () {
        test('Valid Country', function () {
            var country = countries.getCountryByCode('US');
            expect(country).toBeDefined();
            // check these to make tsc happy
            if (country && country.names) {
                expect(country.names['en-us']).toEqual('United States');
            }
        });
        test('Invalid Country', function () {
            // canary islands, no calling code
            var invalidCountry = countries.getCountryByCode('IC');
            // should be a LocalizedCountry but all fields empty / default
            var emptyCountry = {
                alpha2: '',
                alpha3: '',
                countryCallingCodes: [],
                currencies: [],
                displayName: '',
                emoji: '',
                ioc: '',
                languages: [],
                name: '',
                names: {},
                status: '',
            };
            expect(invalidCountry).toMatchObject(emptyCountry);
        });
    });
    describe('getLocalizedCountries', function () {
        test('has all country data', function () {
            var country = countries.getCountry('taiwan');
            var taiwan = {
                alpha2: 'TW',
                alpha3: 'TWN',
                countryCallingCodes: ['+886'],
                currencies: ['TWD'],
                emoji: '🇹🇼',
                ioc: 'TPE',
                languages: ['zho'],
                name: 'Taiwan',
                displayName: 'Taiwan',
                status: 'assigned',
                names: { 'en-us': 'Taiwan', 'es-419': 'Taiwán' },
            };
            expect(country).toMatchObject(taiwan);
        });
    });
    describe('Country Search', function () {
        test('returns empty array on exact match', function () {
            var results = countries.getFilteredCountries('taiwan');
            expect(results.length).toBe(0);
        });
    });
});
//# sourceMappingURL=countries.test.js.map