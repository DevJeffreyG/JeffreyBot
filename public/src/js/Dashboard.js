class Dashboard {
    constructor(guild, enums) {
        this.ApiUpdate = enums;
        this.guild = guild;
        this.root = `./dashboard/${this.guild.id}`

        this.anyDigit = /\d+/g;
        this.nonDigit = /\D+/g;

        this.changes = new Map();
        this.initial = new Map();
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

        for (const q of queries) {
            let arr = q.split("=")
            let key = arr[0];
            let value = arr[1];

            if (!key || !value) {
                query = null;
                break;
            };

            query[key] = value;
        }

        this.query = query;
        return this;
    }

    /**
     * Agrega una linea al padre
     * @param {HTMLElement} parent 
     * @returns {void}
     */
    #addSeparator(parent) {
        let line = document.createElement("div")
        line.classList.add("line");

        parent.appendChild(line)

        return;
    }

    async #getDocument() {
        let query = await fetch("/api/db/get-guild", {
            headers: {
                "guildid": this.guild.id
            }
        });

        let res = await query.json();

        this.doc = res;
    }

    /**
     * 
     * @param {String} id 
     * @returns {HTMLElement}
     */
    #createDivSection(id = null) {
        let element = document.createElement("div")
        element.classList.add("section")

        element.id = id;

        return element;
    }

    #createDivItem(id) {
        let element = document.createElement("div")
        element.id = id;
        element.classList.add("item");

        return element;
    }

    /**
     * Crea la base de un selector
     * @param {HTMLElement} node 
     * @param {String} title 
     */
    #createSelector(node, title = null) {
        let selector = document.createElement("div")

        if (title) node.append(title);
        node.appendChild(selector)
        return selector;
    }

    /**
     * Crea un Item con un switch
     * @param {String} parentId
     * @returns {HTMLElement}
     */
    #createBoolSelector(parentId, { title, id }) {
        const parent = this.#createDivItem(parentId);
        parent.classList.add("bool-selector");

        let selector = this.#createSelector(parent, title);
        selector.id = id;
        selector.classList.add("switch");

        return parent;
    }

    /**
     * Crea un Item para número
     * @param {String} parentId 
     * @returns {HTMLElement}
     */
    #createNumberSelector(parentId, { title, placeholder, id }, { min, max }) {
        const parent = this.#createDivItem(parentId);
        parent.classList.add("number-selector");

        const input = document.createElement("input")
        input.type = "number"
        input.placeholder = placeholder;
        input.id = id;
        input.required = true;

        if (typeof min !== "undefined" || typeof max !== "undefined") {
            input.max = max ?? Infinity;
            input.min = min ?? Infinity;
        }

        parent.append(title)
        parent.appendChild(input)

        return parent
    }

    /**
     * Crea un link y se agrega al this.sidebar
     * @param {String} id La id con la que se creará el link
     * @param {String} title El texto que saldrá en el sidebar
     */
    #createSidebarOption(id, title) {
        let module = document.createElement("a");
        module.href = `./${this.guild.id}?page=${id}`;
        module.innerText = title

        sidebar.appendChild(module);
    }

    #checkChanges() {
        const announcer = document.querySelector(".announcer");
        if (this.changes.size > 0) announcer.classList.add("active");
        else announcer.classList.remove("active")
    }

    #sync() {
        const active = this.doc.settings.active_modules

        findAndSync("functions-suggestions", active)
        findAndSync("functions-tickets", active)
        findAndSync("functions-logs", active)
        findAndSync("functions-birthdays", active)
        findAndSync("functions-darkshop", active)
        findAndSync("functions-rep_to_currency", active)
        findAndSync("functions-currency_to_exp", active)

        findAndSync("logs-guild-messageDelete", active)
        findAndSync("logs-guild-messageUpdate", active)

        findAndSync("logs-moderation-warns", active)
        findAndSync("logs-moderation-softwarns", active)
        findAndSync("logs-moderation-pardons", active)
        findAndSync("logs-moderation-bans", active)
        findAndSync("logs-moderation-timeouts", active)
        findAndSync("logs-moderation-clears", active)
        findAndSync("logs-moderation-automod", active)

        findAndSync("logs-staff-tickets", active)
        findAndSync("logs-staff-settings", active)
        findAndSync("logs-staff-errors", active)

        findAndSync("automoderation-remove_links", active)

        const minimum = this.doc.settings.minimum;
        findAndSync("blackjack_bet", minimum);
        findAndSync("darkshop_level", minimum);

        const functions = this.doc.settings.functions;
        findAndSync("adjust_shop", functions);
        findAndSync("adjust_darkshop", functions);
        
        findAndSync("baseprice_darkshop", functions);
        
        findAndSync("currency_per_rep", functions);


        /**
         * 
         * @param {*} id 
         * @returns {HTMLElement}
         */
        function findWithId(id) {
            return document.querySelector(`#${id}`);
        }

        /**
         * 
         * @param {String} id 
         * @param {*} root 
         */
        function findAndSync(id, root) {
            let el = findWithId(id);
            if (!el) return;

            let path = id.replace(/-/g, ".");
            let active = root;
            for (const p of path.split(".")) {
                active = active[p]
            }

            switch (typeof active) {
                case "boolean": // Switches
                    if (active) el.classList.add("active");
                    else el.classList.remove("active");
                    break;

                case "number":
                    el.value = String(active);
                    el.dataset.db = String(active);
                    break;

                default:
                    console.log(typeof active)
            }

            return el;

        }
    }

    async #activeModulesHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Módulos activos";
        contents.appendChild(title)

        container.appendChild(contents);

        /*
        =============
        = FUNCIONES =
        =============
        */
        let funciones = this.#createDivSection("functions");
        funciones.classList.add("wrap")
        funciones.append("Funciones")

        let suggestions = this.#createBoolSelector("suggestions", { title: "Sugerencias", id: "functions-suggestions" });
        let tickets = this.#createBoolSelector("tickets", { title: "Tickets", id: "functions-tickets" });
        let flogs = this.#createBoolSelector("logs", { title: "Logs", id: "functions-logs" });
        let bd = this.#createBoolSelector("birthdays", { title: "Cumpleaños", id: "functions-birthdays" });
        let ds = this.#createBoolSelector("darkshop", { title: "DarkShop", id: "functions-darkshop" });
        let repcurr = this.#createBoolSelector("rep_to_currency", { title: "Rep -> $", id: "functions-rep_to_currency" });
        let currexp = this.#createBoolSelector("currency_to_exp", { title: "$ -> EXP", id: "functions-currency_to_exp" });

        this.#appendChilds(funciones, [suggestions, tickets, flogs, bd, ds, repcurr, currexp]);

        /*
        ========
        = LOGS =
        ========
        */
        // AUDIT LOGS
        let glogs = this.#createDivSection("guild-logs")
        glogs.classList.add("wrap")
        glogs.append("Audit Logs")

        let mdelete = this.#createBoolSelector("messageDelete", { title: "Mensaje eliminado", id: "logs-guild-messageDelete" });
        let mupdate = this.#createBoolSelector("messageUpdate", { title: "Mensaje editado", id: "logs-guild-messageUpdate" });

        this.#appendChilds(glogs, [mdelete, mupdate])

        // MODERATION LOGS
        let modlogs = this.#createDivSection("moderation-logs")
        modlogs.classList.add("wrap")
        modlogs.append("Logs de moderación")

        let lwarns = this.#createBoolSelector("warns", { title: "Warns", id: "logs-moderation-warns" });
        let lsoftwarns = this.#createBoolSelector("softwarns", { title: "Softwarns", id: "logs-moderation-softwarns" });
        let lpardons = this.#createBoolSelector("pardons", { title: "Pardons", id: "logs-moderation-pardons" });
        let lbans = this.#createBoolSelector("bans", { title: "Baneos", id: "logs-moderation-bans" });
        let ltimeouts = this.#createBoolSelector("timeouts", { title: "Expulsiones del chat", id: "logs-moderation-timeouts" });
        let lclears = this.#createBoolSelector("clears", { title: "Clear", id: "logs-moderation-clears" });
        let lautomod = this.#createBoolSelector("automod", { title: "AutoMod", id: "logs-moderation-automod" });

        this.#appendChilds(modlogs, [lwarns, lsoftwarns, lpardons, lbans, ltimeouts, lclears, lautomod])

        // STAFF LOGS
        let stafflogs = this.#createDivSection("staff-logs")
        stafflogs.classList.add("wrap")
        stafflogs.append("Logs de STAFF")

        let ltickets = this.#createBoolSelector("tickets", { title: "Tickets", id: "logs-staff-tickets" });
        let lsettings = this.#createBoolSelector("settings", { title: "Configuraciones", id: "logs-staff-settings" });
        let lerrors = this.#createBoolSelector("errors", { title: "Errores", id: "logs-staff-errors" });

        this.#appendChilds(stafflogs, [ltickets, lsettings, lerrors])

        /*
        ===========
        = AUTOMOD =
        ===========
        */

        let automod = this.#createDivSection("automoderation")
        automod.classList.add("wrap")
        automod.append("Auto moderación")

        let amlinks = this.#createBoolSelector("remove_links", { title: "Eliminar Links", id: "automoderation-remove_links" });

        this.#appendChilds(automod, [amlinks]);

        // ------------------------------------------

        this.#appendChilds(contents, [funciones, glogs, modlogs, stafflogs, automod])
        this.#sync()
    }

    async #minimumHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Cantidades mínimas";
        contents.appendChild(title)

        container.appendChild(contents);

        let main = this.#createDivSection("minimum");
        main.classList.add("wrap")

        let blackjackbet = this.#createNumberSelector("blackjackbet", {
            title: "Apuesta de Blackjack",
            placeholder: "Cantidad mínima para apostar",
            id: "blackjack_bet"
        }, { min: 1 });

        let darkshoplvl = this.#createNumberSelector("dslevel", {
            title: "Nivel para usar la DarkShop",
            placeholder: "El nivel mínimo necesario",
            id: "darkshop_level"
        }, { min: 0 });

        this.#appendChilds(main, [blackjackbet, darkshoplvl]);

        this.#appendChilds(contents, [main])
        this.#sync();
    }

    async #functionsHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Funciones";
        contents.appendChild(title)

        container.appendChild(contents);

        let main = this.#createDivSection("minimum");
        main.classList.add("wrap")

        let shopadjust = this.#createBoolSelector("adjshop", {
            title: "Ajustar precios de la tienda",
            id: "adjust_shop"
        });

        let dsadjust = this.#createBoolSelector("adjshop", {
            title: "Ajustar precios de la DarkShop",
            id: "adjust_darkshop"
        });

        let basedarkshop = this.#createNumberSelector("basepriceds", {
            title: "Precio base de la moneda (DarkShop)",
            placeholder: "Valor de la moneda cuando la inflación está en 0%",
            id: "baseprice_darkshop"
        }, { min: 1 });

        let currperrep = this.#createNumberSelector("currperrep", {
            title: "Dinero dado por nivel",
            placeholder: "El dinero dado por cada punto de reputación",
            id: "currency_per_rep"
        }, { min: 1 });

        this.#appendChilds(main, [shopadjust, dsadjust, basedarkshop, currperrep]);

        this.#appendChilds(contents, [main])
        this.#sync();
    }

    async #handleQueries() {
        await this.#getDocument();
        this.container = document.querySelector("div.container");
        let type;

        // Página
        switch (this.query?.page) {
            case "active_modules":
                await this.#activeModulesHandler();
                type = this.ApiUpdate.ActiveModules;
                break;

            case "minimum":
                await this.#minimumHandler();
                type = this.ApiUpdate.Minimum;
                break;

            case "functions":
                await this.#functionsHandler();
                type = this.ApiUpdate.Functions;
                break;

            default:
                return
        }

        let sidebarItems = Array.from(this.sidebar.querySelectorAll("a"));
        const subpageSelected = sidebarItems.find(x => x.href.includes(this.query.page));
        subpageSelected.classList.add("active");

        var switches = document.querySelectorAll(".switch");
        for (const Switch of switches) {
            Switch.addEventListener("click", () => {
                Switch.classList.toggle("active");

                const id = Switch.id;

                let get = this.changes.get(id);

                if (typeof get === "undefined") this.changes.set(id, Switch.classList.contains("active"));
                else this.changes.delete(id);

                this.#checkChanges()
            })
        }

        var inputs = document.querySelectorAll("input");
        for (const input of inputs) {
            this.initial.set(input.id, input.dataset.db ?? input.value);

            input.addEventListener("input", () => {
                const id = input.id;
                let get = this.changes.get(id);

                if (typeof get === "undefined" || this.initial.get(id) != input.value) this.changes.set(id, input.value)
                else this.changes.delete(id)

                this.#checkChanges()
            })
        }

        const cancelButton = document.querySelector("#cancelChanges");
        cancelButton.addEventListener("click", async () => {
            await this.#getDocument();
            this.#sync();
            this.changes.clear();

            const announcer = document.querySelector(".announcer");
            announcer.classList.remove("active");
        })

        const saveButton = document.querySelector("#saveChanges");
        saveButton.addEventListener("click", async () => {
            await this.save(type);
        })

        const jumpUp = document.querySelector("#jumpUp");
        jumpUp?.addEventListener("click", () => {
            this.container.scroll({ top: 0, behavior: "smooth" });
        })
    }

    /**
     * @param {HTMLElement} parent 
     * @param {Array<HTMLElement>} childs 
     */
    #appendChilds(parent, childs) {
        for (const child of childs) {
            parent.appendChild(child)
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

        let jumpup = document.createElement("div")
        jumpup.classList.add("button")
        jumpup.id = "jumpUp"
        jumpup.innerHTML = '<span class="material-symbols-rounded">keyboard_double_arrow_up</span>';

        let announcer = document.createElement("div");
        announcer.classList.add("announcer");

        announcer.append("Hay cambios sin guardar")

        let save = document.createElement("div")
        save.classList.add("button");
        save.innerHTML = "Guardar";
        save.id = "saveChanges";

        let cancel = document.createElement("p")
        cancel.id = "cancelChanges";
        cancel.classList.add("link-show")
        cancel.innerHTML = "Cancelar";
        cancel.style.marginLeft = "auto";
        cancel.style.marginRight = ".4em";
        cancel.style.fontSize = ".7em";

        announcer.append(cancel)
        announcer.appendChild(save)

        document.body.appendChild(announcer);
        document.body.appendChild(jumpup)

        // cambiar el titulo
        const title = document.querySelector("#gname");
        title.innerHTML = this.guild.name;
        title.parentNode.href = `./${this.guild.id}`;

        // agregar secciones al sidebar
        this.sidebar = document.querySelector("div#sidebar");

        const active = this.#createSidebarOption("active_modules", "Módulos activos")
        const minimum = this.#createSidebarOption("minimum", "Cantidades mínimas")
        const functions = this.#createSidebarOption("functions", "Funciones")

        this.#addSeparator(this.sidebar);

        const admins = this.#createSidebarOption("admins", "Roles de Adminstración")
        const staffs = this.#createSidebarOption("staffs", "Roles de STAFF")
        const bots = this.#createSidebarOption("bots", "Roles de Bots")
        const levels = this.#createSidebarOption("bots", "Roles de niveles")
        
        const users = this.#createSidebarOption("users", "Roles de Usuarios")

        this.#addSeparator(this.sidebar);   

        const logs = this.#createSidebarOption("logs", "Canales de logs")
        const rewards = this.#createSidebarOption("chat_rewards", "Canales de recompensas")

        const notif = this.#createSidebarOption("notifier", "Canales de notificaciones")
        const general = this.#createSidebarOption("general", "Canales de generales")
        const dschannels = this.#createSidebarOption("darkshop", "Canales de DarkShop")

        this.#handleQueries();
    }

    async save(type) {
        if (!type) return console.error("🔴 NO TYPE SPECIFIED");

        const objChanges = Object.fromEntries(this.changes);
        const changes = JSON.stringify(objChanges);
        let valid = true;
        let problems = new Map();

        /**
         * ================
         * = VERIFICACION =
         * =   CAMBIOS    =
         * ================
         */
        validation:
        for (const prop in objChanges) {
            let inputElement = document.querySelector(`#${prop}`)
            const value = objChanges[prop]; // El valor que sería guardado en la base de datos

            // VALIDATION
            switch (inputElement.type) {
                case "number":
                    // revisar que sea un numero y que cumpla con las condiciones de minimo y maximo
                    if (
                        (typeof value !== "number" && isNaN(value)) ||
                        value < inputElement.min ||
                        value > inputElement.max
                    ) {
                        valid = false;
                        problems.set(inputElement.parentElement, value);
                    }
                    break;
            }

            if(!valid) break validation;

            // Actualizar los datasets para evitar que el announcer se active incorrectamente
            inputElement.dataset.db = String(value);
            this.initial.set(prop, value);
        }

        if (!valid) {
            const announcer = document.querySelector(".announcer");
            const initialTransform = getComputedStyle(announcer).transform

            const announcerKeyframes = [
                { transform: `${initialTransform} rotate(1deg)`, backgroundColor: "#f00", easing: "ease" },
                { transform: `${initialTransform} rotate(-1deg)` },
                { transform: `${initialTransform} rotate(0)` },
            ];

            for (const element of Array.from(problems.keys())) {
                const initialColorEl = getComputedStyle(element).backgroundColor

                const elementKeyframes = [
                    { backgroundColor: "#f00", easing: "ease" },
                    { backgroundColor: initialColorEl, easing: "ease" }
                ];

                element.scrollIntoView({ behavior: "smooth" })
                element.animate(elementKeyframes, {
                    duration: 2000,
                    iterations: 1,
                })
            }

            return announcer.animate(announcerKeyframes, {
                duration: 100,
                iterations: 3,
            })
        }

        let q = await fetch("/api/db/update", {
            body: changes,
            headers: {
                "guildid": this.guild.id,
                "updatetype": type,
                'Content-Type': 'application/json'
            },
            method: "POST"
        });

        let res = await q.json();

        if (res) {
            this.changes.clear();
            this.#checkChanges();
        }

        return res
    }
}