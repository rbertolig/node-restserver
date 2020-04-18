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
    urlDB = 'urlmongodb+srv://nodemongouser:ZkRf7AH4owTFhQET@cluster0-pp78t.mongodb.net/cafe';
}

//exportar a variable global la cadena de conexion a la BD
process.env.URLDB = urlDB;