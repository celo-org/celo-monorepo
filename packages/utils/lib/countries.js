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
var phoneNumbers_1 = require("./phoneNumbers");
var esData = require('@umpirsky/country-list/data/es/country.json');
var country_data_1 = __importDefault(require("country-data"));
var collections_1 = require("./collections");
var EMPTY_COUNTRY = {
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
    countryPhonePlaceholder: { national: '', international: '' },
};
var removeDiacritics = function (word) {
    return word &&
        word
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
};
var matchCountry = function (country, query) {
    return (country &&
        ((country.displayName && country.displayName.startsWith(query)) ||
            country.countryCode.startsWith('+' + query)));
};
var Countries = /** @class */ (function () {
    function Countries(language) {
        // fallback to 'en-us'
        this.language = language ? language.toLocaleLowerCase() : 'en-us';
        this.countryMap = new Map();
        this.localizedCountries = Array();
        this.countriesWithNoDiacritics = Array();
        this.assignCountries();
    }
    Countries.prototype.getCountry = function (countryName) {
        if (!countryName) {
            return EMPTY_COUNTRY;
        }
        var query = removeDiacritics(countryName);
        // also ignoring EU and FX here, only two missing
        var countryIndex = this.countriesWithNoDiacritics.findIndex(function (country) { return country.displayName === query; });
        return countryIndex !== -1 ? this.localizedCountries[countryIndex] : EMPTY_COUNTRY;
    };
    Countries.prototype.getCountryByPhoneCountryCode = function (countryCode) {
        if (!countryCode) {
            return EMPTY_COUNTRY;
        }
        var country = this.localizedCountries.find(function (c) { return c.countryCallingCodes && c.countryCallingCodes.includes(countryCode); });
        return country || EMPTY_COUNTRY;
    };
    Countries.prototype.getCountryByCode = function (countryCode) {
        var country = this.countryMap.get(countryCode);
        return country || EMPTY_COUNTRY;
    };
    Countries.prototype.getFilteredCountries = function (query) {
        var _this = this;
        query = removeDiacritics(query);
        // Return empty list if the query is empty or matches a country exactly
        // This is necessary to hide the autocomplete window on country select
        if (!query || !query.length) {
            return [];
        }
        var exactMatch = this.countriesWithNoDiacritics.find(function (country) { return country.displayName === query; });
        // since we no longer have the country name as the map key, we have to
        // return empty list if the search result is an exact match to hide the autocomplete window
        if (exactMatch) {
            return [];
        }
        // ignoring countries without a provided translation, only ones are
        // EU (European Union) and FX (France, Metropolitan) which don't seem to be used?
        return this.countriesWithNoDiacritics
            .map(function (country, index) {
            if (matchCountry(country, query)) {
                return index;
            }
            else {
                return null;
            }
        })
            .filter(collections_1.notEmpty)
            .map(function (countryIndex) { return _this.localizedCountries[countryIndex].alpha2; });
    };
    Countries.prototype.assignCountries = function () {
        var _this = this;
        // add other languages to country data
        this.localizedCountries = country_data_1.default.callingCountries.all.map(function (country) {
            // this is assuming these two are the only cases, in i18n.ts seems like there
            // are fallback languages 'es-US' and 'es-LA' that are not covered
            var names = {
                'en-us': country.name,
                'es-419': esData[country.alpha2],
            };
            var localizedCountry = __assign({ names: names, displayName: names[_this.language], countryPhonePlaceholder: {
                    national: phoneNumbers_1.getExampleNumber(country.countryCallingCodes[0]),
                } }, country);
            // use ISO 3166-1 alpha2 code as country id
            _this.countryMap.set(country.alpha2.toUpperCase(), localizedCountry);
            return localizedCountry;
        });
        this.countriesWithNoDiacritics = this.localizedCountries.map(function (country) { return ({
            displayName: removeDiacritics(country.displayName),
            countryCode: country.countryCallingCodes[0],
        }); });
    };
    return Countries;
}());
exports.Countries = Countries;
//# sourceMappingURL=countries.js.map