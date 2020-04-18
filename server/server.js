//requires
require('./config/config');

//express
const express = require('express');
const app = express();

// Using mongoose inside Node.js with `require()`
const mongoose = require('./config/newmongoose'); // usar mi 'newmongoose' para evitar deprecation warnings


//usar paquete npm body-parser (requiere instalacion)
const bodyParser = require('body-parser');

// body-parser: parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// body-parser: parse application/json
app.use(bodyParser.json());

app.use(require('./routes/usuario'));

// mongoose.connect('mongodb://localhost:27017/cafe', (err, resp) => {
//     if (err) throw err;
//     console.log('Base de Datos ONLINE');
// });

mongoose.connect(process.env.URLDB)
    .then(console.log('Base de Datos ONLINE'))
    .catch(err => console.log('No se pudo abrir base de datos  ', err));


app.listen(process.env.PORT, () => {
    console.log(`Escuchando en puerto: ${process.env.PORT}`);

});