"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var countries_1 = require("./countries");
var countries = new countries_1.Countries('en-us');
describe('countries', function () {
    describe('getCountryMap', function () {
        test('Valid Country', function () {
            var country = countries.getCountryByCodeAlpha2('US');
            expect(country).toBeDefined();
            // check these to make tsc happy
            if (country && country.names) {
                expect(country.names['en-us']).toEqual('United States');
            }
        });
        test('Invalid Country', function () {
            // canary islands, no calling code
            var invalidCountry = countries.getCountryByCodeAlpha2('IC');
            expect(invalidCountry).toBeUndefined();
        });
    });
    describe('getCountry', function () {
        test('has all country data', function () {
            var country = countries.getCountry('taiwan');
            expect(country).toMatchInlineSnapshot("\n        Object {\n          \"alpha2\": \"TW\",\n          \"alpha3\": \"TWN\",\n          \"countryCallingCode\": \"+886\",\n          \"countryCallingCodes\": Array [\n            \"+886\",\n          ],\n          \"countryPhonePlaceholder\": Object {\n            \"national\": \"00 0000 0000\",\n          },\n          \"currencies\": Array [\n            \"TWD\",\n          ],\n          \"displayName\": \"Taiwan\",\n          \"displayNameNoDiacritics\": \"taiwan\",\n          \"emoji\": \"\uD83C\uDDF9\uD83C\uDDFC\",\n          \"ioc\": \"TPE\",\n          \"languages\": Array [\n            \"zho\",\n          ],\n          \"name\": \"Taiwan\",\n          \"names\": Object {\n            \"en-us\": \"Taiwan\",\n            \"es-419\": \"Taiw\u00E1n\",\n          },\n          \"status\": \"assigned\",\n        }\n      ");
        });
    });
    describe('Country Search', function () {
        test('finds an exact match', function () {
            var results = countries.getFilteredCountries('taiwan');
            expect(results).toMatchInlineSnapshot("\n        Array [\n          Object {\n            \"alpha2\": \"TW\",\n            \"alpha3\": \"TWN\",\n            \"countryCallingCode\": \"+886\",\n            \"countryCallingCodes\": Array [\n              \"+886\",\n            ],\n            \"countryPhonePlaceholder\": Object {\n              \"national\": \"00 0000 0000\",\n            },\n            \"currencies\": Array [\n              \"TWD\",\n            ],\n            \"displayName\": \"Taiwan\",\n            \"displayNameNoDiacritics\": \"taiwan\",\n            \"emoji\": \"\uD83C\uDDF9\uD83C\uDDFC\",\n            \"ioc\": \"TPE\",\n            \"languages\": Array [\n              \"zho\",\n            ],\n            \"name\": \"Taiwan\",\n            \"names\": Object {\n              \"en-us\": \"Taiwan\",\n              \"es-419\": \"Taiw\u00E1n\",\n            },\n            \"status\": \"assigned\",\n          },\n        ]\n      ");
        });
        test('finds countries by calling code', function () {
            var results = countries.getFilteredCountries('49');
            expect(results).toMatchInlineSnapshot("\n        Array [\n          Object {\n            \"alpha2\": \"DE\",\n            \"alpha3\": \"DEU\",\n            \"countryCallingCode\": \"+49\",\n            \"countryCallingCodes\": Array [\n              \"+49\",\n            ],\n            \"countryPhonePlaceholder\": Object {\n              \"national\": \"000 000000\",\n            },\n            \"currencies\": Array [\n              \"EUR\",\n            ],\n            \"displayName\": \"Germany\",\n            \"displayNameNoDiacritics\": \"germany\",\n            \"emoji\": \"\uD83C\uDDE9\uD83C\uDDEA\",\n            \"ioc\": \"GER\",\n            \"languages\": Array [\n              \"deu\",\n            ],\n            \"name\": \"Germany\",\n            \"names\": Object {\n              \"en-us\": \"Germany\",\n              \"es-419\": \"Alemania\",\n            },\n            \"status\": \"assigned\",\n          },\n        ]\n      ");
        });
        test('finds countries by ISO code', function () {
            var results = countries.getFilteredCountries('gb');
            expect(results).toMatchInlineSnapshot("\n        Array [\n          Object {\n            \"alpha2\": \"GB\",\n            \"alpha3\": \"GBR\",\n            \"countryCallingCode\": \"+44\",\n            \"countryCallingCodes\": Array [\n              \"+44\",\n            ],\n            \"countryPhonePlaceholder\": Object {\n              \"national\": \"0000 000 0000\",\n            },\n            \"currencies\": Array [\n              \"GBP\",\n            ],\n            \"displayName\": \"United Kingdom\",\n            \"displayNameNoDiacritics\": \"united kingdom\",\n            \"emoji\": \"\uD83C\uDDEC\uD83C\uDDE7\",\n            \"ioc\": \"GBR\",\n            \"languages\": Array [\n              \"eng\",\n              \"cor\",\n              \"gle\",\n              \"gla\",\n              \"cym\",\n            ],\n            \"name\": \"United Kingdom\",\n            \"names\": Object {\n              \"en-us\": \"United Kingdom\",\n              \"es-419\": \"Reino Unido\",\n            },\n            \"status\": \"assigned\",\n          },\n        ]\n      ");
        });
    });
});
//# sourceMappingURL=countries.test.js.map