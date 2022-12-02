class Dashboard {
    constructor(guild) {
        this.guild = guild;
        this.root = `./dashboard/${this.guild.id}`

        this.anyDigit = /\d+/g;
        this.nonDigit = /\D+/g;
    }

    /**
     * Obten los argumentos en la url
     * @returns {this}
     */
    #getQuery() {
        let arrayUrl = this.url.split("/");
        let hasNumber = arrayUrl.find(x => x.match(this.anyDigit))
        const queries = (hasNumber.replace(this.anyDigit, "").replace("?", "")).split("&");

        var query = {};

        for(const q of queries) {
            let arr = q.split("=")
            let key = arr[0];
            let value = arr[1];

            if(!key || !value) {
                query = null;
                break;
            };
            
            query[key] = value;
        }

        this.query = query;
        return this;
    }

    #handleQueries() {
        const container = document.querySelector("div.container");

        // Página
        switch(this.query.page) {
            case "config": {
                const contents = document.createElement("div")
                contents.id = "contents";

                let title = document.createElement("h1");
                title.innerText = "CONFIG";
                contents.appendChild(title)

                container.appendChild(contents);
                break;
            }
        }
    }

    /**
     * Define la url
     * @param {Array} url 
     */
    setUrl(url) {
        this.url = url;
        return this;
    }

    init() {
        this.#getQuery();

        // cambiar el titulo
        const title = document.querySelector("#gname");
        title.innerHTML = this.guild.name;
        title.parentNode.href = `./${this.guild.id}`;

        // agregar secciones al sidebar
        const sidebar = document.querySelector("#sidebar");

        const config = document.createElement("a")
        config.href = `./${this.guild.id}?page=config`;
        config.innerText = "Configuración"

        sidebar.appendChild(config);

        this.#handleQueries();
    }
}