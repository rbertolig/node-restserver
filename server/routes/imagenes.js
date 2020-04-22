//requires
const express = require('express');
const app = express();

const { verificaTokenEnUrl } = require('../middlewares/autenticacion');

// importar tabla de usuario para poder grabar en ella 
// tambien asi tener acceso a propiedades y metodos de cualquier Usuario
//const Usuario = require('../models/usuario');

// importar tabla de prodcutos para poder grabar en ella 
// tambien asi tener acceso a propiedades y metodos de cualquier producto
//const Producto = require('../models/producto');

//importar file system para poder borrar archivos ( nativo de node)
const fs = require('fs');
//importar path para manejar las rutas a las carpetas de archivos ( nativo de node)
const path = require('path');

/**
//servicio GET para devolver la imagen que sea solicitada 
// logica: debe solcitarse el tipo ( usuarios o produtos) y el nombre exacto de la imagen
**/
app.get('/getimage/:tipo/:img', verificaTokenEnUrl, (req, res) => {
    // cargar parametros de la URL en variables para trabajar el servivio
    let tipo = req.params.tipo;
    let img = req.params.img;
    // construir el path del archivo desde parametros recibidos
    let pathImagen = path.resolve(__dirname, `../../uploads/${tipo}/${img}`);
    //validar si el archivo solicitado existe
    if (fs.existsSync(pathImagen)) {
        res.sendFile(pathImagen);
    } else {
        //no existe el archivo solicitado
        // contruir path de 'no-image.jpg' para retornarla en caso de error
        let noImagePath = path.resolve(__dirname, '../assets/no-image.jpg');
        // enviar una imagen tipo 'not found'
        res.sendFile(noImagePath);
    }
});

module.exports = app;