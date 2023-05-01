const { CustomElements, Users } = require("mongoose").models;
const { CommandInteraction, ModalSubmitInteraction } = require("discord.js");
const { FindNewId, Confirmation } = require("./functions");
const Embed = require("./Embed");
const { BadParamsError, DoesntExistsError } = require("../errors");

class CustomTrophy {
    /**
     * @param {CommandInteraction | ModalSubmitInteraction } interaction 
     * @param {*} params 
     */
    constructor(interaction) {
        this.interaction = interaction;
    }

    async save() {
        this.doc = await CustomElements.getOrCreate(this.interaction.guild.id);
        const id = FindNewId(await CustomElements.find(), "trophies", "id")

        this.doc.addTrophy(this, id)
        await this.doc.save()

        return await this.interaction.editReply({
            embeds: [
                new Embed({
                    type: "success",
                    data: {
                        desc: [
                            `Se ha creado el Trofeo. Usa ${this.interaction.client.mentionCommand("elements trophies edit")} para hacerle cambios`,
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

        let confirmation = await Confirmation("Eliminar Trofeo", [
            "Se eliminará este Trofeo de todos los perfiles de los usuarios"
        ], this.interaction);
        if (!confirmation) return;

        try {
            const users = await Users.find({ guild_id: this.interaction.guild.id });
            let count = 0;
            for await (const user of users) {
                let index = user.data.achievements.findIndex(x => x.isTrophy && x.achievement === id);
                if (index === -1) continue;
                count++
                user.data.achievements.splice(index, 1);

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
            throw new DoesntExistsError(this.interaction, `El Trofeo con ID \`${id}\``, "este servidor");
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