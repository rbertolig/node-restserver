//requires
require('./config/config');

//express
const express = require('express');
const app = express();

// usar mi 'newmongoose' para evitar deprecation warnings
const mongoose = require('./config/newmongoose');

//importar 'path' para manejo de directorios.Viene integrado en Node
const path = require('path');

//usar paquete npm body-parser (requiere instalacion)
const bodyParser = require('body-parser');

// body-parser: parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// body-parser: parse application/json
app.use(bodyParser.json());

//habilitar acceso publico a nuestra carpeta public
//para poder abrir desde la web: index.html
// usamos 'path' para resolver la ruta correcta a la carpeta
app.use(express.static(path.resolve(__dirname, '../public')));

//importar configuracion global de las rutas
app.use(require('./routes/index'));


//otra forma de conectar a Base de datos
// mongoose.connect(process.env.URLDB, (err, res) => {
//     if (err) throw err;
//     console.log('Base de Datos ONLINE');
// });

//Conectar a Base de datos
mongoose.connect(process.env.URLDB)
    .then(console.log('Base de Datos ONLINE'))
    .catch(err => console.log('No se pudo abrir base de datos  ', err));

//habilitar servidor en el puerto correspondiente
app.listen(process.env.PORT, () => {
    console.log(`Escuchando en puerto: ${process.env.PORT}`);
});