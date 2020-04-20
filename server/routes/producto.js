//requires
const express = require('express');

const { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

let app = express();

//importar parquete 'underscore' para filtrar datos
const _ = require('underscore');

let Producto = require('../models/producto');


// ==================================================
// Servicio ( Ruta GET ): Mostrar todos los productos
// ==================================================
app.get('/productos', verificaToken, (req, res) => {
    // obtener parametro'desde' para indicar record inicial
    // como 'desde' llega en texto uso Number() para convertirlo y si falla entonces es 0
    let desde = Number(req.query.desde) || 0;
    //obtener limite de paginacion de url ( sera numero o 5) 
    let limite = Number(req.query.limite) || 5;
    //buscar registros en la tabla
    //dentro de {} se pone condiciones para filtrar en caso deseado
    //y en una cadena de texto como segundo parametro se puede filtrar campos separados por espacio
    Producto.find({ disponible: true })
        .skip(desde)
        .limit(limite)
        .sort('nombre') // para ordenar
        // '.populate' importa registros de otra tabla que esten indexados por un campo tipo'ObjectID'
        // en este caso la tabla 'Categoria' tiene un campo llamado 'usuario' que indexa la tabla 'Usuario'
        .populate('usuario', 'nombre email') // con la cadena de texto se filtran los campos de interes a traer
        .populate('categoria', 'descripcion')
        .exec((err, producto) => {
            // si ocurre error del servidor indicarlo y abortar funcion
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            //si ocurre error obteniendo records visualizarlo y abortar
            if (!producto) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            // si llega aqui no hubo error y tomamos acciones
            // dentro de {} se pone condicion para filtrar en caso deseado
            Producto.countDocuments({ disponible: true }, (err, conteo) => {
                //si hay error del servidor indicarlo y abortar
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }
                res.json({
                    ok: true,
                    producto,
                    cantidad: conteo
                });
            });
        });

});

// ===================================================
// Servicio ( Ruta GET ): Mostrar un producto por su ID
// ===================================================
app.get('/productos/:id', verificaToken, (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;
    //buscar producto con el id indicado en nuestra BD
    Producto.findById(id)
        .populate('usuario', 'nombre email') // con la cadena de texto se filtran los campos de interes a traer
        .populate('categoria', 'descripcion')
        .exec((err, productoDB) => {
            //si hay error del servidor indicarlo y abortar
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            //si no encontro el registro indicarlo y abortar
            if ((!productoDB) || (productoDB === null)) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Producto no encontrado'
                    }
                });
            }
            // si llega aqui resolver registro encontrado
            return res.json({
                ok: true,
                producto: productoDB
            });
        });
});

// ===================================================
// Servicio ( Ruta GET ): BUscar un producto por texto
// ===================================================
app.get('/productos/buscar/:termino', verificaToken, (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let termino = req.params.termino;
    //convertir termino de busqueda a 'expression regular' para que no sea literal
    let regex = new RegExp(termino, 'i');
    //buscar producto con el id indicado en nuestra BD
    Producto.find({ nombre: regex })
        .populate('categoria', 'descripcion') // con la cadena de texto se filtran los campos de interes a traer
        .exec((err, productoDB) => {
            //si hay error del servidor indicarlo y abortar
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            //si no encontro el registro indicarlo y abortar
            if ((!productoDB) || (productoDB === null)) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No se encontraron elementos que coindiden con la busqueda'
                    }
                });
            }
            // si llega aqui resolver registro encontrado
            return res.json({
                ok: true,
                producto: productoDB
            });
        });
});



// ===============================================
// Servicio ( Ruta POST ): Crear un  producto
// ===============================================
app.post('/productos', verificaToken, (req, res) => {
    // leo parametros desde 'body' en la web y lo asigno a variable 'body'
    let body = req.body;
    let usuarioActivo = req.usuario._id;
    //variable 'categoria' es el record en que se trabajara
    // esto lo llena con la estructura del record definida en tabla 'Categoria'
    // al mismo tiempo que le asigna los valores leidos en 'body'
    let producto = new Producto({
        nombre: body.nombre, //string
        precioUni: body.precioUni, //number
        descripcion: body.descripcion, //string
        disponible: body.disponible, //boolean
        categoria: body.categoria, //ObjectId
        usuario: usuarioActivo //ObjectId
    });
    //grabar en base de datos lo almacenado en record 'producto' importados del 'body' 
    producto.save((err, productoDB) => {
        // si ocurre error del servidor indicarlo y abortar funcion
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        // si ocurre error indicarlo y abortar funcion
        if ((!productoDB) || (productoDB === null)) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        // si llega aqui es que no hubo error
        //indicar status OK: 200 y hacer toJSON a categoriaDB recien grabado
        res.status(201).json({
            ok: true,
            producto: productoDB
        });
    });
});

// ===============================================
// Servicio ( Ruta PUT ): Actualizar una producto
// ===============================================
app.put('/productos/:id', verificaToken, (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;
    //'req.usuario._id' contiene el ID del usuario autenticado
    let usuarioActivo = req.usuario._id;
    //obtener el body filtrado con _.pick() para los campos que quiero actualizar
    // (evita que pasen ID de usuario manipulando el creador del record)
    let body = _.pick(req.body, ['nombre', 'precioUni', 'descripcion', 'categoria']);
    //si el usuario activo es el mismo del record 'producto' o es un ADMIN_ROLE: Actualizar producto
    // sino denegar peticion
    //buscar producto con el id indicado en nuestra BD
    Producto.findById(id, (err, productoDB) => {
        // si ocurre error del servidor indicarlo y abortar funcion
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        //si ocurre error por registro no encontrado indicarlo y abortar
        if ((!productoDB) || (productoDB === null)) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no encontrado'
                }
            });
        }
        //si el usuario autenticado no es ADMIN_ROLE y no es el mismo que creo la categoria da error y aborta       
        if (!(productoDB.usuario == usuarioActivo)) {
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
        //scanear tabla que aqui es  el objeto 'Producto' para encontrar 
        //el record ( 'producto' ) con ID solicitado 
        // y lo actualiza de una vez con el contenido del objeto 'body'
        Producto.findByIdAndUpdate(id, body, { new: true }, (err, productoDB) => {
            //si hay error del servidor indicarlo y abortar
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }
            // si ocurre error indicarlo y abortar funcion
            if ((!productoDB) || (productoDB === null)) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }
            // si llega aqui es que no hubo error
            //indicar status OK: 200 y hace toJSON al record productoDB recien grabado
            //{new:true} arriba en la funcion hace que el objeto a 'resolver' sea el actualizado y no el viejo
            res.json({
                ok: true,
                producto: productoDB
            });
        });
    });
});

//implementar peticiones DELETE para ruta /producto. NO lo borraremos,
//se realiza actualizando a falso un campo que representa el estado
//se extre el ID de usuario de la URL: '/:<parametro>'
app.delete('/productos/:id', [verificaToken, verificaAdmin_Role], (req, res) => {
    //'req.params.id' contiene el parametro 'id' dentro de la url
    let id = req.params.id;
    //obtener el body filtrado con _.pick() para los campos que quiero actualizar
    let cambiaEstado = { disponible: false };
    //scanear tabla producto que aqui es  el objeto 'Producto' para encontrar 
    //el record ( 'producto' ) con ID solicitado y le desabilita el flag de estado
    Producto.findByIdAndUpdate(id, cambiaEstado, { new: true, }, (err, productoDB) => {
        // si ocurre error del servidor indicarlo y abortar funcion
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        // si no se encuentra el producto enbase de datos
        if ((!productoDB) || (productoDB === null)) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        // si llega aqui es que no hubo error
        //indicar status OK: 200 y hace resolve al productoDB recien borrado
        res.json({
            ok: true,
            producto: productoDB,
            message: 'Producto marcado como no disponible'
        });
    })
});

module.exports = app;