//===================
//  Puerto
//===================

process.env.PORT = process.env.PORT || 3000;

//===================
// Entorno
//===================
// Determinar si estamos en entorno de produccion o desarrollo
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//===========================================
// definir cadena de conexion a base de datos
//===========================================
let urlDB; // contendra la cadena de conexion correcta
if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/cafe';
} else {
    // process.env.MONGO_URI contiene la canera de conexion a BD de produccion
    urlDB = process.env.MONGO_URI;
}

//exportar a variable global la cadena de conexion a la BD
process.env.URLDB = urlDB;