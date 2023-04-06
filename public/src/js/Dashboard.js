/**
 * Crea un Dashboard.
 * - Puede que esto no lo entienda en el futuro, pero por algo se empieza :D
 */
class Dashboard {
    #type;
    #querytype;
    /**
     * 
     * @param {Guild} guild Discord Guild Object
     * @param {Enums.ApiUpdate} enums 
     */
    constructor(guild, enums) {
        this.ApiUpdate = enums;
        this.guild = guild;

        this.guild.allchannels = guild.channels;

        this.guild.channels = this.guild.allchannels.filter(x => x.type === 0 || x.type === 2 || x.type === 5);
        this.guild.categories = this.guild.allchannels.filter(x => x.type === 4);

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
     * 
     * @param {Array} array Array de los elementos en total
     * @param {NodeListOf<ChildNode>} excludeChildren Lista de los nodos que ya existen
     * @param {Boolean} hidden Determina si la lista está oculta inicialmente
     * @param {Boolean} excludeEveryone Determina si se elimina el rol '@everyone'
     */
    #createList(array, excludeChildren, hidden = true, excludeEveryone = true) {
        let list = document.createElement("ul")
        list.classList.add("item-list");
        if (!hidden) list.classList.add("active")

        let exists = array;
        excluding:
        for (const child of Array.from(excludeChildren)) {
            if (!child.dataset.id) continue excluding;
            exists = exists?.filter(x => x.id != child.dataset.id)
        }

        if (excludeEveryone)
            exists = exists?.filter(x => x.id != this.guild.id)

        // Discord Object
        for (const item of exists) {
            let gen = this.#itemOfList(item.id);
            let element = document.createElement("li");

            // solo dejar el color de texto
            gen.style.cssText = `color: ${gen.style.color};`;

            element.append(gen);

            list.appendChild(element);
        }

        return list
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
     * @returns {HTMLElement} Parent
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
     * @returns {HTMLElement} Parent
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
     * Crea un Item para seleccionar roles del Guild
     * @param {String} parentId 
     * @returns {HTMLElement} Parent
     */
    #createRoleSelector(parentId, { title, id, max, min }, interactable = true) {
        const parent = this.#createDivItem(parentId);
        parent.classList.add("role-selector");

        const div = document.createElement("div")
        div.classList.add("role-drop")
        div.id = id
        if (interactable) {
            let plus = document.createElement("span")
            plus.classList.add("material-symbols-rounded")
            plus.append("add_circle");
            plus.id = "plus-icon"
            div.appendChild(plus)

            div.dataset.interactable = "";

        }

        parent.append(title)
        parent.appendChild(div)

        if (max) div.dataset.max = max;
        if (min) div.dataset.min = min;

        return parent
    }

    /**
     * Crea un Item para seleccionar canales del Guild
     * @param {String} parentId 
     * @returns {HTMLElement} Parent
     */
    #createChannelSelector(parentId, { title, id, max, min }, interactable = true) {
        const parent = this.#createDivItem(parentId);
        parent.classList.add("channel-selector");

        const div = document.createElement("div")
        div.classList.add("channel-drop")
        div.id = id
        if (interactable) {
            let plus = document.createElement("span")
            plus.classList.add("material-symbols-rounded")
            plus.append("add_circle");
            plus.id = "plus-icon"
            div.appendChild(plus)

            div.dataset.interactable = "";

        }

        parent.append(title)
        parent.appendChild(div)

        div.dataset.max = max || Infinity;
        div.dataset.min = min || 0;

        return parent
    }

    /**
     * Crea un Item para seleccionar categorías del Guild
     * @param {String} parentId 
     * @returns {HTMLElement} Parent
     */
    #createCategorySelector(parentId, { title, id, max, min }, interactable = true) {
        const parent = this.#createDivItem(parentId);
        parent.classList.add("channel-selector");

        const div = document.createElement("div")
        div.classList.add("category-drop")
        div.id = id
        if (interactable) {
            let plus = document.createElement("span")
            plus.classList.add("material-symbols-rounded")
            plus.append("add_circle");
            plus.id = "plus-icon"
            div.appendChild(plus)

            div.dataset.interactable = "";

        }

        parent.append(title)
        parent.appendChild(div)

        div.dataset.max = max || Infinity;
        div.dataset.min = min || 0;

        return parent
    }

    /**
     * Crea un link y se agrega al this.sidebar
     * @param {String} id La id con la que se creará el link
     * @param {String} title El texto que saldrá en el sidebar
     */
    #createSidebarOption(id, title) {
        let module = document.createElement("a");
        module.href = id ? `./${this.guild.id}?page=${id}` : `./${this.guild.id}`;
        module.innerText = title

        sidebar.appendChild(module);
    }

    /**
     * Crea el copyright en el Sidebar
     */
    #createSidebarCopy() {

        let wrapper = document.querySelector(".sidebar-wrap")

        /**
         * <div id="copyright">
            <label id="copyright"></label>
        </div>
         */
        let wrap = document.createElement("div");
        wrap.id = "copyright";
        let label = document.createElement("label")
        label.id = "copyright"

        wrap.appendChild(label)

        wrapper.appendChild(wrap);
    }

    #createButton({ title, id }) {
        let button = document.createElement("button")
        button.classList.add("button")
        button.id = id;
        button.style.width = "40%"

        button.append(title)

        return button
    }

    #checkChanges() {
        const announcer = document.querySelector(".announcer");
        if (this.changes.size > 0) announcer.classList.add("active");
        else announcer.classList.remove("active")
    }

    /**
     * Crea un item para una lista de tipo Role o Channels
     * @param {String} id 
     * @returns {HTMLElement}
     */
    #itemOfList(id) {
        let d = document.createElement("div");

        let f = x => x.id === id;
        let guildItem = this.guild.roles.find(f) || this.guild.channels.find(f) || this.guild.categories.find(f);

        if (!guildItem) guildItem = {
            name: "[ ELIMINADO ]"
        };

        d.dataset.id = id;
        d.innerHTML = guildItem.name;

        if (guildItem.color) {
            let hexColor = guildItem.color.toString(16);

            if (hexColor.length < 6) hexColor = `${"0".repeat(6 - hexColor.length)}${hexColor}`;

            d.style.borderColor = `#${hexColor}`
            d.style.backgroundColor = `#${hexColor}3d` // opactity 20%
            d.style.color = `#${hexColor}`;
        }

        return d;
    }

    #sync() {
        const active = this.doc.settings.active_modules

        this.#findAndSync("functions-suggestions", active)
        this.#findAndSync("functions-tickets", active)
        this.#findAndSync("functions-logs", active)
        this.#findAndSync("functions-birthdays", active)
        this.#findAndSync("functions-darkshop", active)
        this.#findAndSync("functions-rep_to_currency", active)
        this.#findAndSync("functions-currency_to_exp", active)
        this.#findAndSync("functions-staff_reminders", active)

        this.#findAndSync("logs-guild-messageDelete", active)
        this.#findAndSync("logs-guild-messageUpdate", active)

        this.#findAndSync("logs-moderation-warns", active)
        this.#findAndSync("logs-moderation-softwarns", active)
        this.#findAndSync("logs-moderation-pardons", active)
        this.#findAndSync("logs-moderation-bans", active)
        this.#findAndSync("logs-moderation-timeouts", active)
        this.#findAndSync("logs-moderation-clears", active)
        this.#findAndSync("logs-moderation-automod", active)

        this.#findAndSync("logs-staff-tickets", active)
        this.#findAndSync("logs-staff-settings", active)
        this.#findAndSync("logs-staff-errors", active)

        this.#findAndSync("automoderation-remove_links", active)

        const quantities = this.doc.settings.quantities;
        this.#findAndSync("blackjack_bet", quantities);
        this.#findAndSync("darkshop_level", quantities);
        this.#findAndSync("percentage_skipfirewall", quantities);
        this.#findAndSync("rob-percentage", quantities);

        this.#findAndSync("baseprice_darkshop", quantities);
        this.#findAndSync("currency_per_rep", quantities);

        this.#findAndSync("min_exp", quantities);
        this.#findAndSync("max_exp", quantities);
        this.#findAndSync("min_curr", quantities);
        this.#findAndSync("max_curr", quantities);

        this.#findAndSync("rob-min_success", quantities);
        this.#findAndSync("rob-max_success", quantities);;
        this.#findAndSync("rob-min_fail", quantities);
        this.#findAndSync("rob-max_fail", quantities);

        const functions = this.doc.settings.functions;
        this.#findAndSync("adjust_shop", functions);
        this.#findAndSync("adjust_darkshop", functions);
        this.#findAndSync("adjust_coins", functions);

        this.#findAndSync("levels_deleteOldRole", functions);
        this.#findAndSync("save_roles_onleft", functions);
        this.#findAndSync("sug_remind", functions);
        this.#findAndSync("ticket_remind", functions);

        const roles = this.doc.roles;
        this.#findAndSync("admins", roles)
        this.#findAndSync("staffs", roles)

        this.#findAndSync("users", roles)
        this.#findAndSync("bots", roles)

        this.#findAndSync("birthday", roles)
        this.#findAndSync("darkshop_news", roles)
        this.#findAndSync("suggester_role", roles)

        this.#findAndSync("notifications-youtube", roles)
        this.#findAndSync("notifications-youtube_shorts", roles)
        //this.#findAndSync("notifications-twitter", roles)
        this.#findAndSync("notifications-twitch", roles)

        this.#findAndSync("levels", roles)

        const channels = this.doc.channels;

        this.#findAndSync("general-rules", channels)
        this.#findAndSync("general-information", channels)
        this.#findAndSync("general-faq", channels)
        this.#findAndSync("general-announcements", channels)
        this.#findAndSync("general-halloffame", channels)

        this.#findAndSync("darkshop-events", channels)

        this.#findAndSync("logs-guild_logs", channels)
        this.#findAndSync("logs-moderation_logs", channels)
        this.#findAndSync("logs-staff_logs", channels)
        this.#findAndSync("logs-suggestions", channels)
        this.#findAndSync("logs-user_left", channels)

        this.#findAndSync("notifier-youtube_notif", channels)
        //this.#findAndSync("notifier-twitter_notif", channels)
        this.#findAndSync("notifier-twitch_notif", channels)


        this.#findAndSync("chat_rewards", channels)

        const categories = this.doc.categories;

        this.#findAndSync("tickets", categories)

    }

    /**
         * 
         * @param {String} id 
         * @param {*} root 
         */
    #findAndSync(id, root) {
        /**
         * 
         * @param {*} id 
         * @returns {HTMLElement}
         */
        function findWithId(id) {
            return document.querySelector(`#${id}`);
        }

        let el = findWithId(id);
        if (!el) return;

        if (el.dataset.type?.includes("sync")) return this.#syncWork(el);

        let path = id.replace(/-/g, ".");
        let active = root;
        for (const p of path.split(".")) {
            active = active ? active[p] : undefined;
        }

        let listType = el.className.includes("role") ? this.guild.roles :
            el.className.includes("channel") ? this.guild.channels : this.guild.categories;

        switch (typeof active) {
            case "boolean": // Switches
                if (active) el.classList.add("active");
                else el.classList.remove("active");
                break;

            case "number":
                el.value = String(active);
                el.dataset.db = String(active);
                break;

            case "object":
                if (Array.isArray(active)) {
                    el.innerHTML = "";
                    active.forEach(id => {
                        let d = this.#itemOfList(id)
                        el.appendChild(d)
                    })

                    const synced = el.childNodes;

                    let list = this.#createList(listType, synced);
                    el.append(list)
                } else {

                }
                break;

            case "string":
                if (el.className.includes("drop")) {
                    if (active.length > 0) {
                        el.innerHTML = "";
                        let d = this.#itemOfList(active)
                        el.appendChild(d)
                    }

                    let list = this.#createList(listType, el.childNodes);
                    el.append(list)
                }
                break;

            default:
                if (el.className.includes("drop")) {
                    el.innerHTML = "";
                    let list = this.#createList(listType, []);
                    el.append(list)
                }
        }

        if (typeof el.dataset.interactable != "undefined") {
            let plus = document.createElement("span")
            plus.classList.add("material-symbols-rounded")
            plus.append("add_circle");
            plus.id = "plus-icon"

            el.appendChild(plus)
        }

        return el;

    }

    /**
         * 
         * @param {HTMLElement} element 
         */
    #syncWork(element) {
        let syncType = element.dataset.type.split("-")[1];
        switch (syncType) {
            case "levels": {
                let root = this.doc.roles.levels;

                for (const data of root) {
                    let { level, roles } = data;

                    let levelWrapper = this.#createDivSection(String(level));

                    let rolesSelector = this.#createRoleSelector("levelwrap", {
                        title: `Para el nivel ${level}`,
                        id: level
                    }, false)

                    for (const roleId of roles) {
                        let e = this.#itemOfList(roleId)
                        rolesSelector.firstElementChild.appendChild(e);
                    }

                    // <span class="material-symbols-rounded">close</span>
                    let closeSpan = document.createElement("span");
                    closeSpan.classList.add("material-symbols-rounded")
                    closeSpan.append("close");

                    let remove = this.#createButton({ title: closeSpan, id: "removeItem" })
                    remove.style.width = "40px";

                    rolesSelector.appendChild(remove)

                    levelWrapper.appendChild(rolesSelector)

                    if (!element.querySelector(`[id='${level}']`)) element.appendChild(levelWrapper);
                }
                break;
            }

            case "channelrewards": {
                let root = this.doc.channels.chat_rewards;

                for (const data of root) {
                    let { channel, multiplier } = data;

                    let channelWrapper = this.#createDivSection(String(channel));

                    let channelSelector = this.#createChannelSelector("channelwrap", {
                        title: `Multiplicador x${multiplier} en`,
                        id: channel
                    }, false)

                    channelSelector.dataset.multiplier = multiplier;

                    let e = this.#itemOfList(channel)
                    channelSelector.firstElementChild.appendChild(e);

                    // <span class="material-symbols-rounded">close</span>
                    let closeSpan = document.createElement("span");
                    closeSpan.classList.add("material-symbols-rounded")
                    closeSpan.append("close");

                    let remove = this.#createButton({ title: closeSpan, id: "removeItem" })
                    remove.style.width = "40px";

                    channelSelector.appendChild(remove)

                    channelWrapper.appendChild(channelSelector)

                    if (!element.querySelector(`[id='${channel}']`)) element.appendChild(channelWrapper);
                }
                break;
            }
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
        let staffreminders = this.#createBoolSelector("staff_reminders", { title: "Recordatorios al STAFF", id: "functions-staff_reminders" });

        this.#appendChilds(funciones, [suggestions, tickets, flogs, bd, ds, repcurr, currexp, staffreminders]);

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
    }

    async #quantitiesHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Cantidades";
        contents.appendChild(title)

        container.appendChild(contents);

        let min = this.#createDivSection("min");
        min.classList.add("wrap")
        min.append("Mínimos")

        let blackjackbet = this.#createNumberSelector("blackjackbet", {
            title: "Apuesta mínima en Blackjack",
            placeholder: "Cantidad mínima para apostar",
            id: "blackjack_bet"
        }, { min: 1 });

        let darkshoplvl = this.#createNumberSelector("dslevel", {
            title: "Nivel para usar la DarkShop",
            placeholder: "El nivel mínimo necesario",
            id: "darkshop_level"
        }, { min: 0 });

        let skipfirewall = this.#createNumberSelector("dsskip", {
            title: "%Probabilidad de saltarse la Firewall",
            placeholder: "Probabilidad de que el item funcione",
            id: "percentage_skipfirewall"
        }, { min: 0, max: 100 });

        let robPerc = this.#createNumberSelector("robperc", {
            title: "%Probabilidad de robo exitoso",
            placeholder: "Probabilidad de que el robo funcione",
            id: "rob-percentage"
        }, { min: 0, max: 100 });

        this.#appendChilds(min, [blackjackbet, darkshoplvl, skipfirewall, robPerc]);

        let bases = this.#createDivSection("bases")
        bases.classList.add("wrap")
        bases.append("Valores base")

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

        let minexp = this.#createNumberSelector("minexp", {
            title: "Mínima EXP dada por hablar",
            placeholder: "Debe ser menor que el máximo",
            id: "min_exp"
        }, { min: 1 });

        let maxexp = this.#createNumberSelector("maxexp", {
            title: "Máxima EXP dada por hablar",
            placeholder: "Debe ser mayor que el mínimo",
            id: "max_exp"
        }, { min: 1 });

        let mincur = this.#createNumberSelector("mincur", {
            title: "Mínimo dinero dado por hablar",
            placeholder: "Debe ser menor que el máximo",
            id: "min_curr"
        }, { min: 1 });

        let maxcur = this.#createNumberSelector("maxcur", {
            title: "Máximo dinero dado por hablar",
            placeholder: "Debe ser mayor que el mínimo",
            id: "max_curr"
        }, { min: 1 });

        let rob_minscs = this.#createNumberSelector("robminscs", {
            title: "(Robar) %Mínima recompensa",
            placeholder: "Debe ser menor que el máximo",
            id: "rob-min_success"
        }, { min: 1 });

        let rob_maxscs = this.#createNumberSelector("robmaxscs", {
            title: "(Robar) %Máxima recompensa",
            placeholder: "Debe ser mayor que el mínimo",
            id: "rob-max_success"
        }, { min: 1 });

        let rob_minfail = this.#createNumberSelector("robminfail", {
            title: "(Robar) %Mínimo castigo",
            placeholder: "Debe ser menor que el máximo",
            id: "rob-min_fail"
        }, { min: 0, max: 100 });

        let rob_maxfail = this.#createNumberSelector("robmaxfail", {
            title: "(Robar) %Máximo castigo",
            placeholder: "Debe ser mayor que el mínimo",
            id: "rob-max_fail"
        }, { min: 0, min: 100 });

        this.#appendChilds(bases, [basedarkshop, currperrep, minexp, maxexp, mincur, maxcur, rob_minscs, rob_maxscs, rob_minfail, rob_maxfail]);

        this.#appendChilds(contents, [min, bases])
    }

    async #functionsHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Funciones";
        contents.appendChild(title)

        container.appendChild(contents);

        // GENERALES
        let main = this.#createDivSection("main");
        main.classList.add("wrap")
        main.append("Generales")

        let saveRoles = this.#createBoolSelector("lvloldr", {
            title: "Guardar roles al salir del server",
            id: "save_roles_onleft"
        });

        let lvlsOldRole = this.#createBoolSelector("lvloldr", {
            title: "Eliminar roles viejos por nivel",
            id: "levels_deleteOldRole"
        });

        let dayRemindSug = this.#createNumberSelector("sugremind", {
            title: "Días pasados necesarios (sugerencias)",
            placeholder: "Días para que se recuerde las sugerencias sin respuesta",
            id: "sug_remind"
        }, { min: 1 });

        let dayRemindTicket = this.#createNumberSelector("ticketremind", {
            title: "Días pasados necesarios (tickets)",
            placeholder: "Días para que se recuerde los tickets sin respuesta",
            id: "ticket_remind"
        }, { min: 1 });

        // ECONOMIA
        let money = this.#createDivSection("money");
        money.classList.add("wrap")
        money.append("Economía")

        let shopadjust = this.#createBoolSelector("adjshop", {
            title: "Ajustar precios de la tienda",
            id: "adjust_shop"
        });

        let dsadjust = this.#createBoolSelector("adjds", {
            title: "Ajustar precios de la DarkShop",
            id: "adjust_darkshop"
        });

        let coinsadjust = this.#createBoolSelector("adjds", {
            title: "Ajustar recompensas de /coins",
            id: "adjust_coins"
        });

        this.#appendChilds(main, [saveRoles, lvlsOldRole, dayRemindSug, dayRemindTicket]);
        this.#appendChilds(money, [shopadjust, dsadjust, coinsadjust]);

        this.#appendChilds(contents, [main, money])
    }

    async #rolesHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Roles";
        contents.appendChild(title)

        container.appendChild(contents);

        let staff = this.#createDivSection("staff");
        staff.classList.add("wrap")
        staff.append("De STAFF")

        let admins = this.#createRoleSelector("radmins", {
            title: "Roles de Admins",
            id: "admins"
        });

        let staffs = this.#createRoleSelector("rstaffs", {
            title: "Roles de Staffs",
            id: "staffs"
        });

        this.#appendChilds(staff, [admins, staffs]);

        let generals = this.#createDivSection("generals");
        generals.classList.add("wrap")
        generals.append("Generales")

        let users = this.#createRoleSelector("radmins", {
            title: "Roles de usuario",
            id: "users"
        });

        let bots = this.#createRoleSelector("rstaffs", {
            title: "Roles de Bots",
            id: "bots"
        });

        let bd = this.#createRoleSelector("rbd", {
            title: "Role de Cumpleaños",
            id: "birthday",
            max: 1
        });

        let suggester = this.#createRoleSelector("rbd", {
            title: "Role de recompensa de sugerencias",
            id: "suggester_role",
            max: 1
        });

        let dsRole = this.#createRoleSelector("rbd", {
            title: "Role de eventos DarkShop",
            id: "darkshop_news",
            max: 1
        });

        this.#appendChilds(generals, [users, bots, bd, suggester, dsRole]);

        let noti = this.#createDivSection("generals");
        noti.classList.add("wrap")
        noti.append("Notifier [JeffreyG Only (WIP)]")

        let yt = this.#createRoleSelector("ryt", {
            title: "YouTube",
            id: "notifications-youtube",
            max: 1
        });

        let ytshorts = this.#createRoleSelector("ryt", {
            title: "YouTube Shorts",
            id: "notifications-youtube_shorts",
            max: 1
        });

        /* let tw = this.#createRoleSelector("rtw", {
            title: "Twitter",
            id: "notifications-twitter",
            max: 1
        }); */

        let tv = this.#createRoleSelector("rtv", {
            title: "Twitch",
            id: "notifications-twitch",
            max: 1
        });

        this.#appendChilds(noti, [yt, ytshorts, tv]);

        this.#appendChilds(contents, [staff, generals, noti])
    }

    async #channelsHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Canales";
        contents.appendChild(title)

        container.appendChild(contents);

        let general = this.#createDivSection("general");
        general.classList.add("wrap")
        general.append("Generales")

        let rules = this.#createChannelSelector("crules", {
            title: "Reglas",
            id: "general-rules",
            max: 1
        });

        let info = this.#createChannelSelector("cinfo", {
            title: "Información",
            id: "general-information",
            max: 1
        });

        let faq = this.#createChannelSelector("cfaq", {
            title: "FAQ",
            id: "general-faq",
            max: 1
        });

        let news = this.#createChannelSelector("cnews", {
            title: "Anuncios",
            id: "general-announcements",
            max: 1
        });

        let hof = this.#createChannelSelector("chall", {
            title: "Salón de la fama",
            id: "general-halloffame",
            max: 1
        });

        this.#appendChilds(general, [rules, info, faq, news, hof]);

        let ds = this.#createDivSection("darkshop");
        ds.classList.add("wrap")
        ds.append("DarkShop")

        let events = this.#createChannelSelector("cdsevents", {
            title: "Eventos",
            id: "darkshop-events",
            max: 1
        });

        this.#appendChilds(ds, [events]);

        let logs = this.#createDivSection("logs");
        logs.classList.add("wrap")
        logs.append("Logs")

        let guilds = this.#createChannelSelector("lguild", {
            title: "Guild",
            id: "logs-guild_logs",
            max: 1
        });

        let moderation = this.#createChannelSelector("lmod", {
            title: "Moderación",
            id: "logs-moderation_logs",
            max: 1
        });

        let staff = this.#createChannelSelector("lstaff", {
            title: "STAFF",
            id: "logs-staff_logs",
            max: 1
        });

        let sugs = this.#createChannelSelector("lsugs", {
            title: "Sugerencias",
            id: "logs-suggestions",
            max: 1
        });

        let user_left = this.#createChannelSelector("luserleft", {
            title: "Usuario se va del server",
            id: "logs-user_left",
            max: 1
        });

        this.#appendChilds(logs, [guilds, moderation, staff, sugs, user_left]);

        let noti = this.#createDivSection("logs");
        noti.classList.add("wrap")
        noti.append("Notifier [JeffreyG Only (WIP)]")

        let yt = this.#createChannelSelector("cyt", {
            title: "YouTube",
            id: "notifier-youtube_notif",
            max: 1
        });

        /* let tw = this.#createChannelSelector("ctw", {
            title: "Twitter",
            id: "notifier-twitter_notif",
            max: 1
        }); */

        let tv = this.#createChannelSelector("ctv", {
            title: "Twitch",
            id: "notifier-twitch_notif",
            max: 1
        });

        this.#appendChilds(noti, [yt, tv]);

        this.#appendChilds(contents, [general, ds, logs, noti])
    }

    async #categoriesHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Categorías";
        contents.appendChild(title)

        container.appendChild(contents);

        let main = this.#createDivSection("main");
        main.classList.add("wrap")

        let tickets = this.#createCategorySelector("ctickets", {
            title: "Tickets",
            id: "tickets",
            max: 1
        });

        this.#appendChilds(main, [tickets]);

        this.#appendChilds(contents, [main])
    }

    async #levelRolesHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Roles por Niveles";
        contents.appendChild(title)

        container.appendChild(contents);

        let toadd = this.#createDivSection("toadd");
        toadd.classList.add("wrap")
        toadd.classList.add("join")
        toadd.dataset.ignoreSync = "";

        let existing = this.#createDivSection("main");
        existing.classList.add("wrap")
        existing.append("Actuales");
        let actual = this.#createDivItem("levels")
        actual.dataset.type = "sync-levels";
        existing.appendChild(actual);

        let addLevel = this.#createNumberSelector("addlevel", {
            title: "Nivel requerido",
            placeholder: "Nivel cuando se le darán los roles",
            id: "level"
        }, {
            min: 1
        })

        addLevel.classList.add("border-up");

        let addRole = this.#createRoleSelector("addrole", {
            title: "Roles dados",
            id: "roles",
            min: 1
        })

        addRole.classList.add("border-down");

        let roleList = this.#createList(this.guild.roles, [])
        addRole.firstElementChild.appendChild(roleList);

        let submit = this.#createButton({
            title: "Agregar",
            id: "submit"
        })

        this.#appendChilds(toadd, [addLevel, addRole, submit]);

        this.#appendChilds(contents, [toadd, existing])
    }

    async #channelRewardsHandler() {
        const container = this.container;
        const contents = document.createElement("div")
        contents.id = "contents";

        let title = document.createElement("h1");
        title.innerText = "Recompensas en los canales";
        contents.appendChild(title)

        container.appendChild(contents);

        let toadd = this.#createDivSection("toadd");
        toadd.classList.add("wrap")
        toadd.classList.add("join")
        toadd.dataset.ignoreSync = "";

        let existing = this.#createDivSection("main");
        existing.classList.add("wrap")
        existing.append("Actuales");
        let actual = this.#createDivItem("chat_rewards")
        actual.dataset.type = "sync-channelrewards";
        existing.appendChild(actual);

        let addChannel = this.#createChannelSelector("addchannel", {
            title: "El canal configurado",
            id: "channel",
            min: 1,
            max: 1
        })

        addChannel.classList.add("border-up");

        let addMulti = this.#createNumberSelector("addmultiplier", {
            title: "El multiplicador de la EXP y dinero",
            placeholder: "La base de lo que se gana se multiplica por esto",
            id: "multiplier"
        }, {
            min: 0.01
        })

        addMulti.classList.add("border-down");

        let channelList = this.#createList(this.guild.channels, [])
        addChannel.firstElementChild.appendChild(channelList);

        let submit = this.#createButton({
            title: "Agregar",
            id: "submit"
        })

        this.#appendChilds(toadd, [addChannel, addMulti, submit]);

        this.#appendChilds(contents, [toadd, existing])
    }

    async #handleQueries() {
        // Si se clickea fuera, cerrar los dropdowns abiertos (.active)
        var dropdowns = document.createElement('script');
        dropdowns.src = '/src/js/DropDowns.js';
        document.head.appendChild(dropdowns);

        await this.#getDocument();
        this.container = document.querySelector("div.container");

        // Página
        switch (this.query?.page) {
            case "active_modules":
                await this.#activeModulesHandler();
                this.#type = this.ApiUpdate.ActiveModules;
                break;

            case "quantities":
                await this.#quantitiesHandler();
                this.#type = this.ApiUpdate.Quantities;
                break;

            case "functions":
                await this.#functionsHandler();
                this.#type = this.ApiUpdate.Functions;
                break;

            case "roles":
                await this.#rolesHandler();
                this.#type = this.ApiUpdate.Roles;
                break;

            case "levels":
                await this.#levelRolesHandler();
                this.#type = this.ApiUpdate.LevelRoles;
                break;

            case "categories":
                await this.#categoriesHandler();
                this.#type = this.ApiUpdate.Categories;
                break;

            case "channels":
                await this.#channelsHandler();
                this.#type = this.ApiUpdate.Channels;
                break;

            case "chat_rewards":
                await this.#channelRewardsHandler();
                this.#type = this.ApiUpdate.RewardChannels;
                break;
        }

        this.#sync()

        // Cambiar el color del boton del sidebar seleccionado
        let sidebarItems = Array.from(this.sidebar.querySelectorAll("a"));
        const subpageSelected = sidebarItems.find(x => x.href.includes(this.query?.page));
        if (subpageSelected) subpageSelected.classList.add("active");
        else sidebarItems.find(x => x.getAttribute("href") === `./${this.guild.id}`)?.classList.add("active");

        if (this.sidebar.clientHeight / subpageSelected?.offsetTop < 1.5) {
            console.info(this.sidebar.clientHeight / subpageSelected.offsetTop)
            this.sidebar.parentElement.scroll({ top: subpageSelected.offsetTop, behavior: "smooth" })
        }

        this.#switches();
        this.#inputs();

        this.#drop("role-drop");
        this.#drop("channel-drop");
        this.#drop("category-drop");

        this.#buttons();
    }

    /**
     * 
     * @param {HTMLElement} element
     * @returns 
     */
    #ignoreSync(element) {
        if (element.closest("[data-ignore-sync]")) return true
        return false
    }

    #switches() {
        var switches = document.querySelectorAll(".switch");
        for (const Switch of switches) {
            Switch.addEventListener("click", () => {
                Switch.classList.toggle("active");

                const id = Switch.id;

                let get = this.changes.get(id);

                if (typeof get === "undefined") this.changes.set(id, Switch.classList.contains("active"));
                else this.changes.delete(id);

                if (!this.#ignoreSync(Switch)) this.#checkChanges();
            })
        }
    }

    #inputs() {
        var inputs = document.querySelectorAll("input");
        for (const input of inputs) {
            this.initial.set(input.id, input.dataset.db ?? input.value);

            input.addEventListener("input", () => {
                const id = input.id;
                let get = this.changes.get(id);

                if (typeof get === "undefined" || this.initial.get(id) != input.value) this.changes.set(id, input.value)
                else this.changes.delete(id)

                if (!this.#ignoreSync(input)) this.#checkChanges();
            })
        }
    }

    /**
     * @param {String} classname
     */
    #drop(classname) {
        var array = document.querySelectorAll(`.${classname}`);
        let dropList = classname.includes("role") ? this.guild.roles :
            classname.includes("channel") ? this.guild.channels : this.guild.categories;

        for (const drop of array) {
            function translate(nodes) {
                let translated = Array.from(nodes)
                    .filter(x => !x.classList.contains("item-list") && typeof x.dataset?.id != "undefined") // eliminar la lista de todos los roles & todo lo que no sea la info de role
                    .flatMap(x => x.dataset.id) // sacar solo las ids

                return translated
            }

            if (typeof drop.dataset.interactable === "undefined") continue;

            this.initial.set(drop.id, translate(drop.childNodes));

            drop.addEventListener("click", (click) => {
                function arrayEquals(a, b) {
                    return Array.isArray(a) &&
                        Array.isArray(b) &&
                        a.length === b.length &&
                        a.every((val, index) => val === b[index]);
                }

                let clicked = click.target;


                if (clicked.className.length < 1) {
                    clicked = clicked.querySelector("div") ?? clicked;

                    if (clicked.closest(".item-list")) { // Un item de la lista a agregar
                        let gen = this.#itemOfList(clicked.dataset.id);
                        drop.appendChild(gen)

                        clicked.closest("li").remove();
                    } else if (clicked.closest(`.${classname}`)) { // Un item que ya está agregado a la lista
                        clicked.remove()

                        let actualList = drop.querySelector(".item-list");
                        let newList = this.#createList(dropList, drop.childNodes)

                        drop.replaceChild(newList, actualList)
                    }

                    const id = drop.id;

                    this.changes.set(id, translate(drop.childNodes))

                    if (arrayEquals(this.initial.get(id), this.changes.get(id))) this.changes.delete(id);

                    if (!this.#ignoreSync(drop)) this.#checkChanges();
                    return;
                }

                let list = drop.querySelector("ul")
                list.classList.toggle("active");
            })
        }

    }

    /**
     * @param {Number} type El tipo de query para usar save()
     */
    #buttons() {
        let removeWork = () => {
            const removeButtons = document.querySelectorAll("#removeItem")
            for (const button of removeButtons) {
                button.addEventListener("click", () => {
                    const item = button.parentElement;
                    let info = item.querySelector("div");

                    this.changes.set(info.id, info.childNodes)
                    item.closest("div.section").remove();

                    this.#checkChanges();
                })
            }
        }

        const cancelButton = document.querySelector("#cancelChanges");
        cancelButton.addEventListener("click", async () => {
            await this.#getDocument();
            this.#sync();
            this.changes.clear();
            removeWork();

            const announcer = document.querySelector(".announcer");
            announcer.classList.remove("active");
        })

        const saveButton = document.querySelector("#saveChanges");
        saveButton.addEventListener("click", async () => {
            await this.save();
        })

        const jumpUp = document.querySelector("#jumpUp");
        jumpUp?.addEventListener("click", () => {
            this.container.scroll({ top: 0, behavior: "smooth" });
        })

        const submit = document.querySelector("#submit");
        submit?.addEventListener("click", async () => {
            await this.add();
        })

        removeWork();
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

        const home = this.#createSidebarOption(null, "Inicio")

        this.#addSeparator(this.sidebar);

        const active = this.#createSidebarOption("active_modules", "Módulos activos")
        const quantities = this.#createSidebarOption("quantities", "Cantidades")
        const functions = this.#createSidebarOption("functions", "Funciones")

        this.#addSeparator(this.sidebar);

        const roles = this.#createSidebarOption("roles", "Roles")
        const levels = this.#createSidebarOption("levels", "Roles de niveles")

        this.#addSeparator(this.sidebar);

        const canales = this.#createSidebarOption("channels", "Canales")
        const categorias = this.#createSidebarOption("categories", "Categorías")
        const rewards = this.#createSidebarOption("chat_rewards", "Canales de recompensas")

        this.#addSeparator(this.sidebar);
        const ayuda = this.#createSidebarOption("help", "Ayuda")
        const faq = this.#createSidebarOption("faq", "FAQ")

        this.#addSeparator(this.sidebar);

        this.#createSidebarCopy()

        this.#handleQueries();
    }

    async #validate() {
        this.problems = new Map();

        let valid = true;
        const objChanges = Object.fromEntries(this.changes);
        this.pushable_changes = JSON.stringify(objChanges);

        if (this.changes.size === 0) valid = false;

        if (this.#type === this.ApiUpdate.LevelRoles) {
            const parent = document.querySelector("[data-type='sync-levels'");
            let rawData = Array.from(parent.childNodes);

            if (this.#querytype === "save") { // se está eliminado un role de niveles
                let info = [];

                for (const section of rawData) {
                    const id = section.id; // el nivel req

                    const rolesContainer = section.querySelector(`[id='${id}'].role-drop`);
                    const roles = Array.from(rolesContainer.childNodes).flatMap(x => x.dataset.id)

                    info.push({
                        level: id,
                        roles
                    })
                }

                this.pushable_changes = JSON.stringify(info);

                return valid;
            } else if (this.#querytype === "add") {
                // buscar que no exista ya
                if (rawData.find(x => x.id === objChanges.level)) {
                    this.problems.set(rawData.find(x => x.id === objChanges.level).firstChild, {})
                    valid = false;
                }
            }
        }
        else if (this.#type === this.ApiUpdate.RewardChannels) {
            const parent = document.querySelector("[data-type='sync-channelrewards'");
            let rawData = Array.from(parent.childNodes);

            if (this.#querytype === "save") { // se está eliminado un role de niveles
                let info = [];

                for (const section of rawData) {
                    const id = section.id; // la id del canal

                    const channelContainer = section.querySelector(`[id='${id}'].channel-drop`);
                    const channel = channelContainer.firstElementChild.dataset.id;

                    info.push({
                        channel,
                        multiplier: section.dataset.multiplier
                    })
                }

                this.pushable_changes = JSON.stringify(info);

                return valid;
            } else if (this.#querytype === "add") {
                // buscar que no exista ya
                if (rawData.find(x => x.id === objChanges.level)) {
                    this.problems.set(rawData.find(x => x.id === objChanges.level).firstChild, {})
                    valid = false;
                }
            }
        }

        /**
                 * ================
                 * = VERIFICACION =
                 * =   CAMBIOS    =
                 * ================
                 */
        validation:
        for (const prop in objChanges) {
            if (!valid) break validation;
            let inputElement = document.getElementById(prop);

            if (!inputElement) continue; // fue eliminado

            const value = objChanges[prop]; // El valor que sería guardado en la base de datos

            let parent = inputElement.closest("div.section");
            let allReq = parent.querySelectorAll("div.item");

            let changed = Array.from(allReq).filter(x => typeof x.parentElement.dataset.ignoreSync != "undefined").flatMap(x => x.firstElementChild.id);

            for (const req of changed) {
                if (!this.changes.get(req)) {
                    valid = false
                    this.problems.set(parent.querySelector(`#${req}`).parentElement, {})
                }
            }

            // VALIDATION
            inputV:
            switch (inputElement.type) {
                case "number":
                    // revisar que sea un numero y que cumpla con las condiciones de minimo y maximo
                    if (
                        (typeof value !== "number" && isNaN(value)) ||
                        Number(value) < Number(inputElement.min) ||
                        Number(value) > Number(inputElement.max)
                    ) {
                        valid = false;
                        this.problems.set(inputElement.parentElement, value);
                    }
                    break inputV;
            }

            if (inputElement.className.includes("drop")) {
                let childs = Array.from(inputElement.childNodes).filter(x => x.nodeName === "DIV");

                if (childs.length > Number(inputElement.dataset.max) || childs.length < Number(inputElement.dataset.min)) {
                    this.problems.set(inputElement.parentElement, value);
                    valid = false;
                }

                if (inputElement.dataset.max === "1") { // Convertir el cambio en string
                    this.changes.set(inputElement.id, childs.flatMap(x => x.dataset.id)[0] ?? String());
                    this.pushable_changes = JSON.stringify(Object.fromEntries(this.changes));
                }
            }

            if (!valid) break validation;

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

            for (const element of Array.from(this.problems.keys())) {
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

            announcer.animate(announcerKeyframes, {
                duration: 100,
                iterations: 3,
            })

            console.info(this.problems);

            return valid;
        }

        // Check Permissions
        let qperms = await fetch("/api/guild/has-permissions", {
            headers: {
                "guildid": this.guild.id
            }
        })

        let perms = await qperms.json();
        if (!perms) return this.logout();

        return valid;
    }

    async save() {
        this.#querytype = "save";

        const type = this.#type;
        if (!type) return console.error("🔴 NO TYPE SPECIFIED");

        if (!await this.#validate()) return;

        let q = await fetch("/api/db/update", {
            body: this.pushable_changes,
            headers: {
                "guildid": this.guild.id,
                "apitype": type,
                "querytype": "save",
                'Content-Type': 'application/json'
            },
            method: "POST"
        });

        let res = await q.json();

        if (res) {
            this.sendLog();
            this.initial.clear();
            this.changes.clear();
            this.#checkChanges();
        }

        return res
    }

    async add() {
        this.#querytype = "add";

        const type = this.#type;
        if (!type) return console.error("🔴 NO TYPE SPECIFIED");

        if (!await this.#validate()) return;

        let q = await fetch("/api/db/update", {
            body: this.pushable_changes,
            headers: {
                "guildid": this.guild.id,
                "apitype": type,
                "querytype": "add",
                'Content-Type': 'application/json'
            },
            method: "POST"
        });

        let res = await q.json();

        if (res) {
            this.sendLog();
            this.initial.clear();
            this.changes.clear();
            this.#checkChanges();

            window.location.reload();
        }

        return res
    }

    async sendLog() {
        await fetch("/api/sendlog", {
            headers: {
                "changes": JSON.stringify(this.pushable_changes),
                "page": this.query?.page,
                "channelid": this.doc.channels.logs.staff_logs
            }
        })
    }

    logout() {
        return window.location.replace("/logout");
    }
}