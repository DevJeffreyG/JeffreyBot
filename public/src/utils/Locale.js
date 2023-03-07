const path = require("path");
const fs = require("fs");

class Locale {
    constructor() {
        this.preferredLang = "es"
        this.title = "Jeffrey Bot"
        this.author = "Colored Stealth"

        this.availableLangs = {
            es: "Español"
        }

        this.#checkLang();
    }

    #checkLang() {
        let raw = fs.readFileSync(path.resolve(__dirname, `../locales/${this.preferredLang.toUpperCase()}.json`));

        let read = JSON.parse(raw);

        // read.phrases.copyright = this.#regWork(read.phrases.copyright);

        this.texts = read;
    }

    changePreferredLang(langString) {
        this.preferredLang = langString;
        this.#checkLang();
    }

    #regWork(str) {
        let newstr = str
            .replace(new RegExp("{{ name }}", "g"), this.name)
            .replace(new RegExp("{{ author }}", "g"), this.author);

        return newstr;
    }
}

module.exports = Locale