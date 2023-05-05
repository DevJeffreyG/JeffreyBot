const { CustomElements, Users } = require("mongoose").models;
const { CommandInteraction, ModalSubmitInteraction, GuildMember, Guild } = require("discord.js");
const Embed = require("./Embed");
const { BadParamsError, DoesntExistsError, DMNotSentError } = require("../errors");
const { Colores } = require("../resources");

class CustomTrophy {
    /**
     * @param {CommandInteraction | ModalSubmitInteraction | Guild } interaction 
     * @param {*} params 
     */
    constructor(interaction) {
        this.interaction = interaction;
    }

    async save(id) {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);

        this.doc.addTrophy(this, id)
        await this.doc.save()

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Trofeo. Usa ${this.interaction.client.mentionCommand("elements trophies toggle")} para activarlo.`,
                            `Usa ${this.interaction.client.mentionCommand("elements trophies edit")} para hacerle cambios`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    async replace(id, params) {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);

        let actualTrophy = this.doc.getTrophy(id);
        if (!actualTrophy)
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");

        let trophyObj = new CustomTrophy(this.interaction).create(actualTrophy);
        let trophy = new CustomTrophy(this.interaction).create({
            name: params.name?.value ?? trophyObj.name,
            desc: params.desc?.value ?? trophyObj.desc,
            req: params.req?.value ?? trophyObj.req.role,
            dado: params.dado?.value ?? trophyObj.given.role
        });

        let index = this.doc.trophies.findIndex(x => x.id === id);
        this.doc.trophies[index] = { ...trophy, id };
        await this.doc.save();

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha editado el Trofeo`,
                            `ID: ${id}`
                        ]
                    }
                })
            ]
        })
    }

    async delete(id) {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);

        try {
            const users = await Users.find({ guild_id: this.interaction.guild.id });
            let count = 0;
            for await (const user of users) {
                let index = user.data.trophies.findIndex(x => x.element_id === id);
                if (index === -1) continue;
                count++
                user.data.trophies.splice(index, 1);

                await user.save();
            }

            this.doc.deleteTrophy(id);
            await this.doc.save();

            return await this.interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: ["Se ha eliminado el Trofeo", `Se eliminó el Trofeo de ${count} usuarios`]
                        }
                    })
                ]
            })
        } catch (err) {
            console.log(err);
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");
        }
    }

    async toggle(id) {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);

        try {
            let trophy = this.doc.getTrophy(id);
            if (trophy.enabled) trophy.enabled = false
            else trophy.enabled = true;

            await this.doc.save();

            return await this.interaction.editReply({
                embeds: [
                    new Embed({
                        type: "success",
                        data: {
                            desc: `Se ha ${trophy.enabled ? "activado" : "desactivado"} el Trofeo`
                        }
                    })
                ]
            })
        } catch (err) {
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");
        }
    }

    /**
     * @param {Number} id 
     * @param {GuildMember} member 
     * @returns {Promise<Boolean>}
     */
    async manage(id, member, newId) {
        this.doc = await CustomElements.getOrCreate(this.interaction instanceof Guild ? this.interaction.id : this.interaction.guild.id);
        const trophy = this.doc.getTrophy(id);

        let dbUser = await Users.getOrCreate({ user_id: member.id, guild_id: member.guild.id });
        let grant = true;
        const reqList = trophy.req;
        const givenList = trophy.given;

        if (dbUser.getTrophies().find(x => x.element_id === trophy.id)) grant = false;
        if (!trophy.enabled) grant = false;

        requirements:
        for (const prop of Object.keys(reqList)) {
            if (!grant) break requirements;
            const value = reqList[prop];
            if (!value) continue requirements;

            switch (prop) {
                case "role":
                    if (!member.roles.cache.get(value)) grant = false;
                    break;
                case "totals":
                    totalLoop:
                    for (const totalprop of Object.keys(value)) {
                        if (!grant) break totalLoop;

                        const totalValue = value[totalprop];
                        if (!totalValue) continue totalLoop;

                        let moduleCount = "";

                        switch (totalprop) {
                            case "currency":
                                moduleCount = "normal_currency"
                                break;
                            case "darkcurrency":
                                moduleCount = "dark_currency"
                                break;
                            case "warns":
                            case "blackjack":
                            case "roulette":
                                moduleCount = totalprop;
                                break;
                        }

                        if (dbUser.getCount(moduleCount) < totalValue) grant = false;
                    }
            }
        }

        if (!grant) return grant;

        given:
        for (const prop of Object.keys(givenList)) {
            const value = givenList[prop];
            if (!value) continue given;

            switch (prop) {
                case "role":
                    member.roles.add(value)
                        .catch(err => console.log(err));
                    break;
            }
        }

        // añadirlo a la lista de trophies
        dbUser.data.trophies.push({
            element_id: trophy.id,
            id: newId
        })

        await dbUser.save();

        try {
            console.log("digamos que le mandé el dm a %s", member.user.username);
            // TODO: await this.#sendDM(member, trophy);
        } catch (err) {
            console.log(err);
        }

        return grant;
    }

    /**
     * Agrega o elimina un Trofeo con ID
     * @param {Number} id 
     * @param {GuildMember} member 
     * @returns {Promise<Boolean>} Si se dio el Trofeo
     */
    async manual(id, member) {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);
        const trophy = this.doc.getTrophy(id);
        if (!trophy)
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");

        const f = x => x.element_id === trophy.id;

        let dbUser = await Users.getOrCreate({ user_id: member.id, guild_id: member.guild.id });
        let granted;

        // Ya tiene el Trofeo
        if (dbUser.getTrophies().find(f)) {
            let index = dbUser.data.trophies.findIndex(f);

            dbUser.data.trophies.splice(index, 1)
            granted = false;
        } else {
            // No lo tiene

            dbUser.data.trophies.push({
                element_id: trophy.id,
                id
            })
            granted = true;

            try {
                await this.#sendDM(member, trophy);
            } catch (err) {
                console.log(err);
            }
        }

        await dbUser.save();
        return granted;
    }

    async changeTotalReq(id, data) {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);
        const trophy = this.doc.getTrophy(id);
        if (!trophy)
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");

        for (const prop of Object.keys(data)) {
            const value = data[prop];

            if (!value) continue;
            trophy.req.totals[prop] = value;
        }

        await this.doc.save()
        return await this.interaction.editReply({ embeds: [new Embed({ type: "success" })] });
    }

    /**
     * @param {GuildMember} member 
     * @param {*} trophy 
     */
    async #sendDM(member, trophy) {
        try {
            await member.send({
                embeds: [
                    new Embed()
                        .defTitle(`Desbloqueaste un Trofeo en ${member.guild.name}`)
                        .defColor(Colores.verdejeffrey)
                        .defDesc(`**"${trophy.name}"**\n**—** ${trophy.desc}`)
                        .defFooter({ text: "Se mostrará en tu perfil al usar /stats", icon: member.guild.iconURL({ dynamic: true }) })
                ]
            })
        } catch (err) {
            throw new DMNotSentError(this.interaction, member, err.message);
        }
    }

    /**
     * @param {{name, desc, req, dado}} params 
     */
    create(params) {
        const { name, desc, req, dado } = params;

        if (!name)
            throw new BadParamsError(this.interaction, "El Trofeo debe tener al menos un nombre");

        this.name = name?.value ?? name;
        this.desc = desc?.value ?? desc;
        this.req = {
            role: req?.value ?? req
        }
        this.given = {
            role: dado?.value ?? dado
        }

        return this
    }
}

module.exports = CustomTrophy;