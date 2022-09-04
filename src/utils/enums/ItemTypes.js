class ItemTypes {

    static StackOverflow = new ItemTypes(1);
    static ResetInterest = new ItemTypes(2);

    constructor(value){
        this.value = value;
    }
}

module.exports = ItemTypes;