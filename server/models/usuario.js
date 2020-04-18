// usar mi objeto 'newmongoose' para evitar deprecation warnings
const mongoose = require('../config/newmongoose');

// mongoose-unique-validator es paquete npm para validar coampos de datos
const uniqueValidator = require('mongoose-unique-validator');

// definir parametros validos en variales para usar luego con el mongoose-unique-validator
let rolesValidos = {
    values: ['ADMIN_ROLE', 'USER_ROLE'],
    message: '{VALUE} no es un rol valido'
};

// define en 'Schema' como objeto tipo base de datos Mongo
let Schema = mongoose.Schema;

//define 'usuarioSchema' como un objeto (tabla) y se declaran sus campos
let usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'El correo es necesario']
    },
    password: {
        type: String,
        required: [true, 'El la contraseña es obligatoria']
    },
    img: {
        type: String,
        required: [false, 'La imagen es opcional']
    },
    role: {
        type: String,
        default: 'USER_ROLE',
        enum: rolesValidos // especifica cuales son los valores validos para este campo
    },
    estado: {
        type: Boolean,
        default: true
    },
    google: {
        type: Boolean,
        default: false
    }
});

//modificamos metodo 'toJSON' de usuarioSchema
//para convertir el record Usuario en un objeto y quitarle el campo password
//esto se usa para no visualizar nada en relacion a la clave
usuarioSchema.methods.toJSON = function() {

    let user = this; // variable 'user' se carga con paarametro que recibio la llamda a 'toJSON' 
    let userObject = user.toObject(); //asigna version objeto de variable 'user' a variable 'userObject'
    delete userObject.password; // borra todo el parametro 'password' dentro de 'userObject'
    // aqui el objeto 'userObject' tiene toda la informacion que recibio el llamado 'toJSON()' 
    // pero sin campo 'password' y se retorna eso
    return userObject;
}

usuarioSchema.plugin(uniqueValidator, { message: '{PATH} ya existe un usuario registrado con ese email' })

module.exports = mongoose.model('Usuario', usuarioSchema);