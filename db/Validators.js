module.exports = {
    integerValidator: {
        validator: (v) => {
            return Number.isInteger(v);
        },
        message: "Tiene que ser un entero"
    },
    positiveValidator: [0, "Tiene que ser un número positivo"]
}