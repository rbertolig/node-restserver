//importaciones y definiciones necesarias
//importar mi version del objeto mongoose
const mongoose = require('../config/newmongoose');
// mongoose-unique-validator es paquete npm para validar coampos de datos
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

let categoriaSchema = new Schema({
    descripcion: {
        type: String,
        unique: true,
        required: [true, 'La descripcion es necesaria']
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario'
    }
});

categoriaSchema.plugin(uniqueValidator, { message: '{PATH} ya existe una Categoria con esa descripcion' });

module.exports = mongoose.model('Categoria', categoriaSchema);