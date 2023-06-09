const Shop = require("./ShopClass");

class DarkShop extends Shop {
    static async getWork(id) {
        return await this.findOne({
            guild_id: id
        }) ?? null;
    }
}

module.exports = DarkShop;