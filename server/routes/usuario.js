//express
const express = require('express');

//importar paquete 'bcrypt' para encriptar passwords
const bcrypt = require('bcrypt');

//importar parquete 'underscore' para filtrar datos
const _ = require('underscore');

// importar definiciones de modelos ( tablas)
// la constante 'Usuario' sera aqui la tabla usuario de la BD
const Usuario = require('../models/usuario');

//importar funcion de validacion de token
const { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

//definir app como objeto de Express
const app = express();


//implementar peticiones GET para ruta /usuario
//se incluye funcion 'middleware' verificaToken usada para
//proteger que la ruta se ejecute mientras el middleware valida la sesion activa con comando 'next()'
app.get('/usuario', verificaToken, (req, res) => {
    // obtener parametro'desde' para indicar record inicial
    // como 'desde' llega en texto uso Number() para convertirlo y si falla entonces es 0
    let desde = Number(req.query.desde) || 0;

    //obtener limite de paginacion de url ( sera numero o 5) 
    let limite = Number(req.query.limite) || 5;

    //buscar registros en la tabla
    //dentro de {} se pone condiciones para filtrar en caso deseado
    //y en una cadena de texto se puede filtrar campos separados por espacio
    Usuario.find({ estado: true }, 'nombre email role estado google img')
        .skip(desde)
        .limit(limite)
        .exec((err, usuarios) => {
            //si ocurre error obteniendo records visualizarlo y abortar
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            // si llega aqui no hubo error y tomamos acciones
            // dentro de {} se pone condicion para filtrar en caso deseado
            Usuario.countDocuments({ estado: true }, (err, conteo) => {
                res.json({
                    ok: true,
                    usuarios,
                    cantidad: conteo
                });
            })
        });
});

//implementar peticiones POST para ruta /usuario
app.post('/usuario', [verificaToken, verificaAdmin_Role], (req, res) => {
    // leo parametros desde 'body' en la web y lo asigno a variable 'body'
    let body = req.body;

    //variable 'usuario' es el record en que se trabajara
    // esto lo llena con la estructura del record definida en tabla 'Usuario'
    // al mismo tiempo que le asigna los valores leidos en 'body'
    let usuario = Usuario({
        nombre: body.nombre,
        email: body.email,
        //encriptar clave usando 'bcrypt.hashSync(clave,<# de veces a aplicar al hash>)'
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });

    //grabar en base de datos lo almacenado en record 'usuario' importados del 'body' 
    usuario.save((err, usuarioDB) => {
        // si ocurre error indicarlo y abortar funcion
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        // si llega aqui es que no hubo error
        //indicar status OK: 200 y hace toJSON al usuarioDB recieb grabado
        // como modificamos el metodo toJSON de la tabla usuario
        // no se manda via browser nada del campo 'password'
        // ver model 'usuario' mdificacion de toJSON()
        res.json({
            ok: true,
            usuario: usuarioDB
        });
    });
});

//implementar peticiones PUT para ruta /usuario
//se usa para actualizar registros en este caso a la tabla Usuarios
//para pasar parametros en la url usando 'put' se implementa: '/:<parametro>'
app.put('/usuario/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;

    //obtener el body filtrado con _.pick() para los campos que quiero actualizar
    let body = _.pick(req.body, ['nombre', 'email', 'img', 'role', 'estado']);

    //scanear tabla usuario que aqui es  el objeto 'Usuario' para encontrar 
    //el record ( 'usuario' ) con ID solicitado 
    // y lo actualiza de una vez con el contenido del objeto 'body'
    Usuario.findByIdAndUpdate(id, body, {
        new: true
    }, (err, usuarioDB) => {
        // si ocurre error indicarlo y abortar funcion
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        // si llega aqui es que no hubo error
        //indicar status OK: 200 y hace toJSON al usuarioDB recien grabado
        // como modificamos el metodo toJSON de la tabla usuario
        // no se manda via browser nada del campo 'password'
        // ver model 'usuario' mdificacion de toJSON()
        res.json({
            ok: true,
            usuario: usuarioDB
        });
    })
});

//implementar peticiones DELETE para ruta /usuario. NO lo borraremos,
//se realiza actualizando a falso un campo que representa el estado
//se extre el ID de usuario de la URL: '/:<parametro>'
app.delete('/usuario/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;

    //obtener el body filtrado con _.pick() para los campos que quiero actualizar
    let cambiaEstado = { estado: false };

    //scanear tabla usuario que aqui es  el objeto 'Usuario' para encontrar 
    //el record ( 'usuario' ) con ID solicitado 
    // y lo actualiza de una vez con el contenido del objeto 'body'
    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioDB) => {
        // si ocurre error indicarlo y abortar funcion
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        // si llega aqui es que no hubo error
        //indicar status OK: 200 y hace toJSON al usuarioDB recien grabado
        // como modificamos el metodo toJSON de la tabla usuario
        // no se manda via browser nada del campo 'password'
        // ver model 'usuario' mdificacion de toJSON()
        res.json({
            ok: true,
            usuario: usuarioDB
        });
    })
});

/**
//Esta la formade eliminar fisicamente un registro en la tabla
//no se recomienda hacer eliminaciones, desabilitar los registros 
//mediante un campo destinado a al 'status'
//implementar peticiones DELETE para ruta /usuario
app.delete('/usuario/:id', verificaToken, (req, res) => {
    let id = req.params.id;
    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
        // si ocurre error indicarlo y abortar funcion
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        //validad si se intento borrar de nuevo un usuario que no existe
        if (usuarioBorrado === null) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        //si llega aqui no hubo error
        // se resuelve el usuario borrado en un JSON
        res.json({
            ok: true,
            usuario: usuarioBorrado
        });
    });
});
**/

module.exports = app;