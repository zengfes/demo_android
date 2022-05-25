export default class CountryService {

    getCountries() {
        return fetch('src/assets/data/countries.json').then(res => res.json())
            .then(d => d.data);
    }
}