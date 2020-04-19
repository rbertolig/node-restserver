//===================
//  Puerto
//===================

process.env.PORT = process.env.PORT || 3000;

//===================
// Entorno
//===================
// Determinar si estamos en entorno de produccion o desarrollo
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

//===================
// Seed / Secret del Token
//===================
//Personalizar y para mantener secreto usar variable global de entorno de produccion
//ejemplo: heroku config:set TOKEN_SEED="mi-token-seed-de-desarrollo"
process.env.TOKEN_SEED = process.env.TOKEN_SEED || 'este-es-el-secret-de-desarrollo';

//===================
// Expiracion del Token ( en segundos )
//===================
// 30 dias 
process.env.CADUCIDAD_TOKEN = 60 * 60 * 24 * 30;


//===========================================
// definir cadena de conexion a base de datos
//===========================================
let urlDB; // contendra la cadena de conexion correcta
if (process.env.NODE_ENV === 'dev') {
    urlDB = 'mongodb://localhost:27017/cafe';
} else {
    // process.env.MONGO_URI contiene la canera de conexion a BD de produccion
    //ejemplo: heroku config:set MONGO_URI="mi-cadena-de-conexion-a-BD-online"
    urlDB = process.env.MONGO_URI;
}

//exportar a variable global la cadena de conexion a la BD
process.env.URLDB = urlDB;

//===================
// Google CLIENT_ID
//===================
process.env.CLIENT_ID = process.env.CLIENT_ID || '387222356332-bgjhsomhos529h40arq9dpe2jcutr41c.apps.googleusercontent.com'