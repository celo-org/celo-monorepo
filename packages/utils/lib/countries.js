"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var country_data_1 = __importDefault(require("country-data"));
var phoneNumbers_1 = require("./phoneNumbers");
var esData = require('@umpirsky/country-list/data/es/country.json');
var removeDiacritics = function (word) {
    return word &&
        word
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
};
var matchCountry = function (country, query) {
    return (country.displayNameNoDiacritics.startsWith(query) ||
        country.countryCallingCode.startsWith('+' + query) ||
        country.alpha3.startsWith(query.toUpperCase()));
};
var Countries = /** @class */ (function () {
    function Countries(language) {
        // fallback to 'en-us'
        this.language = language ? language.toLocaleLowerCase() : 'en-us';
        this.countryMap = new Map();
        this.localizedCountries = Array();
        this.assignCountries();
    }
    Countries.prototype.getCountry = function (countryName) {
        if (!countryName) {
            return undefined;
        }
        var query = removeDiacritics(countryName);
        return this.localizedCountries.find(function (country) { return country.displayNameNoDiacritics === query; });
    };
    Countries.prototype.getCountryByCodeAlpha2 = function (countryCode) {
        return this.countryMap.get(countryCode);
    };
    Countries.prototype.getFilteredCountries = function (query) {
        query = removeDiacritics(query);
        // Return full list if the query is empty
        if (!query || !query.length) {
            return this.localizedCountries;
        }
        return this.localizedCountries.filter(function (country) { return matchCountry(country, query); });
    };
    Countries.prototype.assignCountries = function () {
        var _this = this;
        // add other languages to country data
        this.localizedCountries = country_data_1.default.callingCountries.all
            .map(function (country) {
            // this is assuming these two are the only cases, in i18n.ts seems like there
            // are fallback languages 'es-US' and 'es-LA' that are not covered
            var names = {
                'en-us': country.name,
                'es-419': esData[country.alpha2],
            };
            var displayName = names[_this.language] || country.name;
            // We only use the first calling code, others are irrelevant in the current dataset.
            // Also some of them have a non standard calling code
            // for instance: 'Antigua And Barbuda' has '+1 268', where only '+1' is expected
            // so we fix this here
            var countryCallingCode = country.countryCallingCodes[0].split(' ')[0];
            var localizedCountry = __assign(__assign({ names: names,
                displayName: displayName, displayNameNoDiacritics: removeDiacritics(displayName), countryPhonePlaceholder: {
                    national: phoneNumbers_1.getExampleNumber(countryCallingCode),
                }, countryCallingCode: countryCallingCode }, country), { 
                // Use default emoji when flag emoji is missing
                emoji: country.emoji || '🏳' });
            // use ISO 3166-1 alpha2 code as country id
            _this.countryMap.set(country.alpha2.toUpperCase(), localizedCountry);
            return localizedCountry;
        })
            .sort(function (a, b) { return a.displayName.localeCompare(b.displayName); });
    };
    return Countries;
}());
exports.Countries = Countries;
//# sourceMappingURL=countries.js.map