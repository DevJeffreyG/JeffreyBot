const { ItemTypes } = require("../../utils/Enums");

class Shop {
    static async getWork(id) {
        return await this.findOne({
            guild_id: id
        }) ?? await new this({
            guild_id: id
        }).save();
    }

    /**
     * Busca un Item
     * @param {Number} itemId El ID del item a buscar
     * @param {Boolean} strict Tiene que estar habilitad y listo para usar?
     * @returns 
     */
    findItem(itemId, strict = true) {
        return strict ?
            this.items.find(x => x.id === itemId && !x.disabled && x.use_info.action) :
            this.items.find(x => x.id === itemId);
    }

    findItemIndex(itemId) {
        let x = this.items.findIndex(x => x.id === itemId);
        return x < 0 ? null : x;
    }

    isUsable(item) {
        return item.use_info.action !== null && !item.disabled;
    }

    getItemType(item) {
        return item.use_info.item_info.type;
    }

    isSub(item) {
        return this.getItemType(item) === ItemTypes.Subscription;
    }
}

module.exports = Shop;