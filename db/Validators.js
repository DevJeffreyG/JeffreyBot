module.exports = {
    integerValidator: {
        validator: (v) => {
            return Number.isInteger(v);
        },
        message: "Tiene que ser un entero"
    },
    positiveValidator: [0, "Tiene que ser un número positivo"],
    canBeNumber: {
        validator: (v) => {
            if(v === null) return true;
            try {
                return BigInt(v)
            } catch(err) {
                return false
            }
        },
        message: "El string no es realmente un número"
    }
}