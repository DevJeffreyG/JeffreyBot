const moment = require("moment-timezone")

class HumanMs {
    constructor(data) {
        this.data = data;
        this.human = this.#convert(this.data);
    }

    #convert(c) {
        let conv = {
            día: Math.trunc(c / 86400000),
            hora: Math.trunc(c / 3600000) % 24,
            minuto: Math.trunc(c / 60000) % 60,
            segundo: Math.trunc(c / 1000) % 60
        }

        this.prep = [];
        for (let key in conv) {
            if (conv[key] != 0) this.prep.push({ key, value: conv[key] });
        }

        this.#toHuman();

        return this.returnable.join(" ");
    }

    left() {
        let left = this.data.diff(new Date());
        return this.#convert(left);
    }

    #toHuman() {
        this.returnable = [];
        this.prep.forEach(r => {
            if (r.value < 0) r.value += 60;
            if (r.value === 1) this.returnable.push(`1 ${r.key}`)
            else this.returnable.push(`${r.value} ${r.key}s`)
        });
    }
}

module.exports = HumanMs;