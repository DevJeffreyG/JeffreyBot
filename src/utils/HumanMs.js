const moment = require("moment")

class HumanMs {
    constructor(data){
        this.data = data;
        this.human = this._convert(this.data);
    }

    _convert(c){
        let conv = {
            día: Math.trunc(c / 86400000),
            hora: Math.trunc(c / 3600000) % 24,
            minuto: Math.trunc(c / 60000) % 60,
            segundo: Math.trunc(c / 1000) % 60
        }

        this.prep = [];
        for(let key in conv){
            if(conv[key] != 0) this.prep.push({key, value: conv[key]});
        }

        this._leftworker();

        return this.returnable.join(" ");
    }

    left(options = {}) { // to now
        let now = moment();

        let año = this.data.years - now.year();
        let mes = this.data.months - now.month();
        let día = this.data.date - now.date();
        let hora = this.data.hours - now.hour();
        let minuto = this.data.minutes - now.minutes();
        let segundo = this.data.seconds - now.seconds();

        this.left = {año, mes, día, hora, minuto, segundo};
        
        if(options.precise){
            this.prep = [];

            for(let key in this.left) {
                if(this.left[key] != 0) this.prep.push({key, value: this.left[key]});
            }

            this._leftworker();

            console.log(this.returnable);

            return this.returnable.join(options.separator ?? " ");
        }

    }
    
    _leftworker(){
        this.returnable = [];
        this.prep.forEach(r => {
            if(r.value < 0) r.value += 60;
            if(r.value == 1) this.returnable.push(`1 ${r.key}`)
                else this.returnable.push(`${r.value} ${r.key}s`)
        });
    }
}

module.exports = HumanMs;