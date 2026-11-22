module.exports = {
    integerValidator: {
        id: "integer",
        validator: (v) => {
            return Number.isInteger(v);
        },
        message: "Tiene que ser un entero"
    },
    integerOrInfinityValidator: {
        id: "integerOrInfinity",
        validator: (v) => {
            return Number.isInteger(v) || v === Infinity;
        },
        message: "Tiene que ser un entero o Infinity"
    },
    positiveValidator: {
        id: "positive",
        validator: (v) => {
            return v > 0;
        },
        message: "Tiene que ser un número positivo"
    },
    positiveWithZeroValidator: {
        id: "positiveWithZero",
        validator: (v) => {
            return v >= 0;
        },
        message: "Tiene que ser un número positivo o cero"
    },
    canBeNumber: {
        id: "canBeNumber",
        validator: (v) => {
            if (v === null) return true;
            try {
                return BigInt(v)
            } catch (err) {
                return false
            }
        },
        message: "El string no es realmente un número"
    }
}