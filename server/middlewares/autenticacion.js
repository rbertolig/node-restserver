//importar libreria jason web token
const jwt = require('jsonwebtoken');

//====================
//Verificar Token
//====================
let verificaToken = (req, res, next) => {
    //leer el token desde el Header
    let token = req.get('token');

    //verificar que el token es valido
    // la variable 'decoded' contendra el 'payload'
    jwt.verify(token, process.env.TOKEN_SEED, (err, decoded) => {
        //si ocurre error abortar con return indicando el error   
        if (err) {
            return res.status(401).json({
                ok: false,
                err: {
                    message: 'No ha iniciado sesion o su session ha expirado'
                }
            });
        }
        // si llega aqui no hubo error
        // asignar a 'req.usuario' el usuario extraido del payload en el token
        req.usuario = decoded.usuario;
        //finalmente validar con comando next() para que el middleware de luz verde al codigo que lo llamo
        next();
    });
};

//======================
//Verificar AdminRole
//======================
let verificaAdmin_Role = (req, res, next) => {
    //capturamos el objeto del usuario actual contenido en req.usuario
    let usuario = req.usuario;
    let err; // declarar variable 'err' para lanzar error de validacion
    //si el role del uauario es ADMIN_ROLE entonces validar middleware con next()
    if (usuario.role === 'ADMIN_ROLE') {
        next();
        return true;
    } else {
        //sino no se valida con next() y se retorna un error de validacion
        return res.status(401).json({
            ok: false,
            err: {
                message: 'Usuario no autorizado a realizar esa accion',
                err
            }
        });
    }
};

module.exports = {
    verificaToken,
    verificaAdmin_Role
}