//requires
const express = require('express');
const app = express();
//importar paquete npm fileUpload para subir archivos al servidor
const fileUpload = require('express-fileupload');
// importar tabla de usuario para poder grabar en ella 
// tambien asi tener acceso a propiedades y metodos de cualquier Usuario
const Usuario = require('../models/usuario');
// importar tabla de prodcutos para poder grabar en ella 
// tambien asi tener acceso a propiedades y metodos de cualquier producto
const Producto = require('../models/producto');
//importar file system para poder borrar archivos ( nativo de node)
const fs = require('fs');
//importar path para manejar las rutas a las carpetas de archivos ( nativo de node)
const path = require('path');

//Documentacion indica llamar el middleware fileUploap con flags para versiones recientes
//cuando se llama a fileUpload() todos los archivos que se carguen
// pueden ser referenciados mediante el objeto 'req.files' de express
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// ruta PUT para cargar archivos al servidor
//usaremos ':tipo' para clasificar a quien corresponde el archivo ej: a 'usuario' o a 'producto'
//usaremos 'id' para especificar el objeto al que pertenecera el archivo, ej: usuario o producto especifico
app.put('/upload/:tipo/:id', function(req, res) {
    // 'tipo' y 'id' se reciben como paramentros dentro de la url
    let tipo = req.params.tipo;
    let id = req.params.id;
    // clasificar archivos por parametro '/:tipo' 
    // tiposValidos sera un arreglo con categorias de archvivos de interes
    // en este caso habra archivos relacionados con 'productos' o con 'usuarios'
    let tiposValidos = ['productos', 'usuarios'];
    // verificar si el 'tipo' recibido esta dentro del arreglo de validacion
    // ( si existe en el array entonces .indexOf() retorna 0 o mayor)
    if (tiposValidos.indexOf(tipo) < 0) {
        // si ocurre error moviendo el archivo a la carpeta de 'uploads' indicarlo y abortar
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Primer parametro no reconocido. Valores permitidos: /' + tiposValidos.join(' , /')
            }
        });
    }
    //validar que subio el archivo
    // si req.files esta vacio o es null es que no se cargo ningun archivo
    // resolver indicando el error y aborta
    if (!req.files) {
        return res.statusCode(400).json({
            ok: false,
            err: {
                message: 'Error al cargar el archivo'
            }
        });
    }
    // si llega aqui no hubo error y se ejecuto el fileUpload()
    //notar que 'req.files.<nombre de archivo> contiene el/los archivos
    //<nombre de archivo> se obtiene de un parametro con mismo nombre literal
    // que se pasa en el 'body'  tipo 'form-data' de la peticion 'PUT' 
    //en este caso el parametro de 'body' debe llamarse: 'archivo'
    let archivo = req.files.archivo;
    // obtener nombre del archivo como arreglo separando nombre de la extension con .name.split('.')
    let nombreArchivo = archivo.name.split('.');
    // aqui nombreArchivo[0] es el filename y nombreArchivo[1] es la extesion
    let extension = nombreArchivo[1];
    //filtrar extensiones permitidas
    let extensionesValidas = ['png', 'jpg', 'gif', 'bmp'];
    //buscar si la extension del archivo esta en el arreglo de extensiones permitidas 
    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Archivo no permitido. Los tipos de archivo permitidos son: ' + extensionesValidas.join(', ')
            }
        });
    }
    //personalizar el nombre de Archivo con valor unico
    nombreArchivo = `${id}_${new Date().getMilliseconds()}.${extension}`

    // los archivos suben a carpeta temporal del servidor
    // de ahi hay que moverlos y nombrarlos como deseemos
    // en este caso a una carpeta segun parametro tipo de este Ruta
    // y con un nombre relacionado al parametro ID de esta Ruta
    archivo.mv(`uploads/${tipo}/${nombreArchivo}`, (err) => {
        // si ocurre error moviendo el archivo a la carpeta de 'uploads' indicarlo y abortar
        if (err) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'Error al cargar el archivo',
                }
            });
        }
        // aqui ya el archivo esta cargado en nuestro servidor en la carpeta correspondiente
        // identificar llave de categoria ( tipo ) recibido 
        switch (tipo) {
            case 'usuarios':
                //llamar a funcion que atualiza la imagen en BD del usuario por el ID recibido
                imagenUsuario(id, res, nombreArchivo);
                break;
            case 'productos':
                //llamar a funcion que atualiza la imagen en BD del producto por el ID recibido
                imagenProducto(id, res, nombreArchivo);
                break;
            default: // parametro no valido
                return res.status(400).json({
                    ok: false,
                    error: {
                        message: 'Parametros no reconocidos. Revise sintaxis'
                    }
                });
        }
    });
});

// esta funcion borra un archivo
// argumento 1: nombre del archivo a borrar
// argumento 2: nombre de carpeta dentro de nuestra ruta de 'uploads'
function borrarArchivo(nombreArchivo, tipo) {
    // validar la ruta del archivo
    //construir ruta con nombre del archivo de imagen existente antes del cambiarla
    let pathImagenExistente = path.resolve(__dirname, `../../uploads/${tipo}/${nombreArchivo}`)
        // si existe un archivo con ese nombre y ruta borrarlo
    if (fs.existsSync(pathImagenExistente)) {
        fs.unlinkSync(pathImagenExistente); // esto borra el archivo
    }
};

// funcion para asignar un archivo de imagen subida al usuario en BD
function imagenUsuario(id, res, nombreArchivo) {
    //buscar el usuario en la BD
    Usuario.findById(id, (err, usuarioDB) => {
        // si ocurre error del servidor borrar el archivo cargado, indicar error y abortar
        if (err) {
            borrarArchivo(nombreArchivo, 'usuarios');
            return res.status(500).json({
                ok: false,
                err
            });
        }
        // Si no se encuentra el usuario en BD: borrar archivo indicar error y abortar
        if ((!usuarioDB) || (usuarioDB === null)) {
            borrarArchivo(nombreArchivo, 'usuarios');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Usuario no encontrado'
                }
            });
        }
        // si llega aqui el usuario existe y podemos hacer validaciones y asignar la imagen al record del usuario
        // primero: borrar imagen existente antes de asignarle la nueva
        borrarArchivo(usuarioDB.img, 'usuarios');
        // actualizar base de datos
        usuarioDB.img = nombreArchivo;
        usuarioDB.save((err, usuarioGuardado) => {
            res.json({
                ok: true,
                message: 'Imagen cargada y renombrada correctamente',
                img: nombreArchivo,
                usuario: usuarioGuardado
            });
        });

    });
};

// funcion para cargar imagen subida como foto de un producto en BD
function imagenProducto(id, res, nombreArchivo) {
    //buscar el producto en la BD
    Producto.findById(id, (err, productoDB) => {
        // si ocurre error del servidor borrar el archivo cargado, indicar error y abortar
        if (err) {
            borrarArchivo(nombreArchivo, 'productos');
            return res.status(500).json({
                ok: false,
                err
            });
        }
        // Si no se encuentra el producto en BD: borrar archivo indicar error y abortar
        if ((!productoDB) || (productoDB === null)) {
            borrarArchivo(nombreArchivo, 'productos');
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no encontrado'
                }
            });
        }
        // si llega aqui el producto existe y podemos hacer validaciones y asignar la imagen al record del producto
        // primero: borrar imagen existente antes de asignarle la nueva
        borrarArchivo(productoDB.img, 'productos');
        // actualizar base de datos
        productoDB.img = nombreArchivo;
        productoDB.save((err, productoGuardado) => {
            if (err) {
                borrarArchivo(nombreArchivo, 'productos');
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'Error al actualizar base de datos. Repita el proceso'
                    }
                });
            }
            // si llega aqui se guardo todo bien
            res.json({
                ok: true,
                message: 'Imagen cargada y renombrada correctamente',
                img: nombreArchivo,
                producto: productoGuardado
            });
        });
    });
};


module.exports = app;