//importaciones y definiciones necesarias para la ruta
const express = require('express');
let { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');
let app = express();
let Categoria = require('../models/categoria');
//importar parquete 'underscore' para filtrar datos
const _ = require('underscore');

// ===============================================
// Servicio ( Ruta GET ): Mostrar todas las categorias
// ===============================================
app.get('/categoria', verificaToken, (req, res) => {
    //buscar registros en la tabla
    //dentro de {} se pone condiciones para filtrar en caso deseado
    //y en una cadena de texto como segundo parametro se puede filtrar campos separados por espacio
    Categoria.find({}, 'descripcion usuario')
        .sort('descripcion') // para ordenar
        // '.populate' importa registros de otra tabla que esten indexados por un campo tipo'ObjectID'
        // en este caso la tabla 'Categoria' tiene un campo llamado 'usuario' que indexa la tabla 'Usuario'
        .populate('usuario', 'nombre email') // con la cadena de texto se filtran los campos de interes a traer
        .exec((err, categorias) => {
            // si ocurre error del servidor indicarlo y abortar funcion
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            //si ocurre error obteniendo records visualizarlo y abortar
            if (!categorias) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            // si llega aqui no hubo error y tomamos acciones
            // dentro de {} se pone condicion para filtrar en caso deseado
            Categoria.countDocuments({}, (err, conteo) => {
                //si hay error del servidor indicarlo y abortar
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                res.json({
                    ok: true,
                    categorias,
                    cantidad: conteo
                });
            });
        });

});

// ===================================================
// Servicio ( Ruta GET ): Mostrar una categoria por su ID
// ===================================================
app.get('/categoria/:id', verificaToken, (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;
    //buscar categoria con el id indicado en nuestra BD
    Categoria.findById(id, (err, categoriaDB) => {
        //si hay error del servidor indicarlo y abortar
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        //si ocurre error indicarlo y abortar
        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Categoria no encontrada'
                }
            });
        }
        // si llega aqui resolver registro encontrado
        return res.json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

// ===============================================
// Servicio ( Ruta POST ): Crear una  categoria
// ===============================================
app.post('/categoria', verificaToken, (req, res) => {
    // leo parametros desde 'body' en la web y lo asigno a variable 'body'
    let body = req.body;
    let usuarioActivo = req.usuario._id;
    //variable 'categoria' es el record en que se trabajara
    // esto lo llena con la estructura del record definida en tabla 'Categoria'
    // al mismo tiempo que le asigna los valores leidos en 'body'
    let categoria = new Categoria({
        descripcion: body.descripcion,
        usuario: usuarioActivo
    });
    //grabar en base de datos lo almacenado en record 'categoria' importados del 'body' 
    categoria.save((err, categoriaDB) => {
        // si ocurre error del servidor indicarlo y abortar funcion
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        // si ocurre error indicarlo y abortar funcion
        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        // si llega aqui es que no hubo error
        //indicar status OK: 200 y hacer toJSON a categoriaDB recien grabado
        res.status(201).json({
            ok: true,
            categoria: categoriaDB
        });
    });
});

// ===============================================
// Servicio ( Ruta PUT ): Actualizar una categoria
// ===============================================
app.put('/categoria/:id', verificaToken, (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;
    //'req.usuario._id' contiene el ID del usuario autenticado
    let usuarioActivo = req.usuario._id;
    //obtener el body filtrado con _.pick() para los campos que quiero actualizar
    // (evita que pasen ID de usuario manipulando el creador del record)
    let body = _.pick(req.body, ['descripcion']);
    //si el usuario activo es el mismo del record 'Categoria' o es un ADMIN_ROLE: Actualizar categoria
    // sino denegar peticion
    //buscar categoria con el id indicado en nuestra BD
    Categoria.findById(id, (err, categoriaDB) => {
        // si ocurre error del servidor indicarlo y abortar funcion
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        //si ocurre error por registro no encontrado indicarlo y abortar
        if (!categoriaDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Categoria no encontrada'
                }
            });
        }
        //si el usuario autenticado no es ADMIN_ROLE y no es el mismo que creo la categoria da error y aborta       
        if (!(categoriaDB.usuario == usuarioActivo)) {
            if (!(req.usuario.role === 'ADMIN_ROLE')) {
                return res.status(401).json({
                    ok: false,
                    err: {
                        message: 'Usuario no autorizado a realizar esa accion'
                    }
                });
            }
        }
        // si llega aqui el usuario esta autorizado y la actualizacion puede ser realizada
        //scanear tabla que aqui es  el objeto 'Categoria' para encontrar 
        //el record ( 'categoria' ) con ID solicitado 
        // y lo actualiza de una vez con el contenido del objeto 'body'
        Categoria.findByIdAndUpdate(id, body, { new: true }, (err, categoriaDB) => {
            //si hay error del servidor indicarlo y abortar
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            // si ocurre error indicarlo y abortar funcion
            if (!categoriaDB) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            // si llega aqui es que no hubo error
            //indicar status OK: 200 y hace toJSON al record categoriaDB recien grabado
            //{new:true} arriba en la funcion hace que el objeto a 'resolver' sea el actualizado y no el viejo
            res.json({
                ok: true,
                categoria: categoriaDB
            });
        });
    });
});

// ===============================================
// Servicio ( Ruta DETELE ): Borrar una categoria
// ===============================================
app.delete('/categoria/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    //si pasa validacion de next() en verificaAdminRole() llega aqui
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;
    //buscar categoria con el id indicado en nuestra BD
    Categoria.findByIdAndRemove(id, (err, categoriaBorrada) => {
        // si ocurre error del servidor indicarlo y abortar funcion
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        //si ocurre error debido que no se encontro el record que coincide: indicarlo y abortar
        if (!categoriaBorrada) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Categoria no encontrada'
                }
            });
        }
        // si llega aqui resolver registro borrado
        return res.json({
            ok: true,
            message: 'Categoria borrada',
            categoria: categoriaBorrada
        });
    });
});

module.exports = app;