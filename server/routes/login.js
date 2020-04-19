//express
const express = require('express');

//importar paquete 'bcrypt' para encriptar passwords
const bcrypt = require('bcrypt');

//importar paquete npm jaonwebtoken
const jwt = require('jsonwebtoken');


// importar tabla de usuarios
const Usuario = require('../models/usuario');

//definir app como objeto de Express
const app = express();

// implementar login con POST
app.post('/login', (req, res) => {
    // leo parametros desde 'body' en la web y lo asigno a variable 'body'
    let body = req.body;

    //dentro de findOne{} se pasa filtro deseado
    //en este caso se busca por email que coincida con elobtenido en 'body'
    //si un email coincide elrecord se guarda en usuarioDB
    //sino ocurre un error y/o usuarioDB es null
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        // si ocurre error indicarlo y abortar funcion
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        //si llega aqui no dio error. Validar Usuario y Password
        if ((!usuarioDB) || (usuarioDB === null)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: '(Usuario) o contraseña incorrecta'
                }
            });
        }
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o (contraseña) incorrecta'
                }
            });
        }
        // si llega aqui paso validaciones, y se confirma login
        let token = jwt.sign({
            usuario: usuarioDB

        }, process.env.TOKEN_SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });

        res.json({
            ok: true,
            uuario: usuarioDB,
            token: token
        });
    });
});
module.exports = app;