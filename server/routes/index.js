//express
const express = require('express');
const app = express();

//importar las rutas
app.use(require('./usuario'));
app.use(require('./login'));
app.use(require('./categorias'));
app.use(require('./producto'));
app.use(require('./upload'));
app.use(require('./imagenes'));




module.exports = app;