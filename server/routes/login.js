//express
const express = require('express');

//importar paquete 'bcrypt' para encriptar passwords
const bcrypt = require('bcrypt');

//importar paquete npm jaonwebtoken
const jwt = require('jsonwebtoken');

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.CLIENT_ID);

// importar tabla de usuarios
const Usuario = require('../models/usuario');

//definir app como objeto de Express
const app = express();

/**
 * Este es mi codigo para Login normal (/login) con cuenta local de nuestra app
 **/

// implementar login con POST a ruta /login
app.post('/login', (req, res) => {
    // leo parametros desde 'body' en la web y lo asigno a variable 'body'
    let body = req.body;
    //dentro de findOne{} se pasa filtro deseado
    //en este caso se busca por email que coincida con el obtenido en 'body'
    //sino ocurre un error y/o usuarioDB es null
    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {
        // si ocurre error del servidor en la busqueda indicarlo y abortar funcion ej: fallo la conexion a BD, etc
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        //si llega aqui no dio error de servidor y hay que validar si encontro coincidencia de email en la tabla
        //'usuarioDB' contendra un objeto con usuario valido si existe o vacio si no lo encontro
        if ((!usuarioDB) || (usuarioDB === null)) {
            // si no encontro coincidencias de usuario indicar error y abortar
            return res.status(400).json({
                ok: false,
                err: {
                    message: '(Usuario) o contraseña incorrecta'
                }
            });
        }
        //si el usuario existe, validar el password usando funcion bcrypt para comparar clave entrada encriptada con la almacenada 
        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            // si el password no es correcto indicar error y abortar
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario o (contraseña) incorrecta'
                }
            });
        }
        // si llega aqui paso validaciones: el usuario existe y el password entrado es correcto
        // renovar token de sesion con jwt.sign()
        // el payload del token sera el objeto del usuario, el 'secret' y caducidad seran los efinidos en /config/config.js 
        let token = jwt.sign({
            usuario: usuarioDB
        }, process.env.TOKEN_SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });
        // resuelvo con json de usuario autenticado y token de sesion renovado
        res.json({
            ok: true,
            uuario: usuarioDB,
            token: token
        });
    });
});
/**
 * fin del codigo para Login normal (/login) con cuenta local de nuestra app
 **/



/**
 * Configuraciones de Login y Registro usando API de Google-LogIn
 **/

//funcion para validar token de Google
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID, // especifica el CLIENT_ID de mi app dentro de la Dev. console de google para esta app
        // implementacion opcional: if multiple clients access the backend: [CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    // conseguir el payload dentro del token
    const payload = ticket.getPayload();
    // retornar el objeto json del usuario autenticado
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }
};

//Implementar Ruta para login via Google LogIn API
app.post('/google', async(req, res) => {
    //nuestra pagina de login en html frontend hara un POST http a esta ruta
    //para entregar al servidor nuestro el token de google contenido en 'idtoken' dentro del 'body' del POST
    //y lo extraemos en el objeto 'token'
    let token = req.body.idtoken;
    // googleUser va a ser el retorno de la funcion verify()
    // que en caso exitoso sera el objeto json del usuario autenticado
    let googleUser = await verify(token)
        // capturar error en formato 'promesa'en caso que la validacion del token falle  y abortar
        .catch(e => {
            return res.status(403).json({
                ok: false,
                err: e
            });
        });
    // si el token fue valido: busco en base de datos si ya existe un usuario con el email del usuario google
    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
        // si hay error lo indico y aborto
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        };
        // si llega aqui: existe el email del usuario google en nuestra tabla de usuarios
        // si ese email fue usado para crear el usuario pero por via normal ( usuario.google= false)
        // generar error para que el usuario entre con metodo login normal de nuestra  app y no con token google
        if (usuarioDB) {
            if (usuarioDB.google === false) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Debe entrar con su informacion de usuario y clave de este sitio'
                    }
                });
            } else {
                // si llega aqui paso validaciones: es usuario existente y creo cuenta con token google
                // se confirma login renovando el token de sesion, y se resuelve el json con datos de usuario y token
                let token = jwt.sign({
                    usuario: usuarioDB
                }, process.env.TOKEN_SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });
                return res.json({
                    ok: true,
                    usuario: usuarioDB,
                    token
                });
            }
        } else {
            // si llega aaqui el usuario no exite en BD procedo a crearlo con los datos recibidos de google
            let usuario = new Usuario();
            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true,
                // como la clave es obligatoria en nuestra tabla de usuarios debemos definir una 'dummy'
                // no hay riesgo porque el password en nuestra BD no se usa en cuentas con google=true 
                // esos usuarios se autentican con token de google
                usuario.password = ':p'
                //guardar el record del nuevo usuario en nuestra BD
            usuario.save((err, usuarioDB) => {
                // si hay error lo indica y aborta
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                // si llega aqui no hubo error
                // paso validaciones, y se confirma login
                let token = jwt.sign({
                    usuario: usuarioDB
                }, process.env.TOKEN_SEED, { expiresIn: process.env.CADUCIDAD_TOKEN });
                // retorno respuesta json exitosa conteniendo info de usuarioy token de sesion renovado 
                return res.json({
                    ok: true,
                    usuario: usuarioDB,
                    token
                });
            });
        }
    });
});
/**
 * Fin de Configuraciones de Usuario Google
 **/

module.exports = app;