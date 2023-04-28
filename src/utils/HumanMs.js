class HumanMs {
    /**
     * 
     * @param {import("moment-timezone").Moment} data
     */
    constructor(data) {
        this.data = data;
        this.human = this.#convert(this.data);
    }

    #convert(c, obj = false) {
        let conv = {
            día: Math.trunc(c / 86400000),
            hora: Math.trunc(c / 3600000) % 24,
            minuto: Math.trunc(c / 60000) % 60,
            segundo: Math.trunc(c / 1000) % 60,
            milisegundo: c % 1000
        }

        this.prep = [];
        for (let key in conv) {
            if ((conv[key] != 0 && key != "milisegundo") || (key === "milisegundo" && this.prep.length == 0)) this.prep.push({ key, value: conv[key] });
        }

        this.#toHuman();

        return obj ? conv : this.returnable.join(" ");
    }

    left(object = false) {
        let left = this.data.diff(new Date());
        return this.#convert(left, object);
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