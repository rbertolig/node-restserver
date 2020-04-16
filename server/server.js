//requires
require('./config/config');

//express
const express = require('express');
const app = express();

//usar paquete npm body-parser (requiere instalacion)
const bodyParser = require('body-parser');

// body-parser: parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser: parse application/json
app.use(bodyParser.json())

//implementar peticiones get, post, put y delete para una misma url
app.get('/usuario', function(req, res) {
    res.json('get usuario');
});

app.post('/usuario', function(req, res) {
    let body = req.body;

    if (body.nombre === undefined) {
        res.status(400).json({
            ok: false,
            mensaje: 'El nombre es necesario'
        });
    } else {
        res.json({
            persona: body
        });
    }
});


//para pasar parametros en la url usando 'put' se implementa: '/:<parametro>'
app.put('/usuario/:id', function(req, res) {
    let id = req.params.id; //'req.params.id' indexa el parametro 'id'
    res.json({
        id
    });
});

app.delete('/usuario', function(req, res) {
    res.json('delete usuario');
});

app.listen(process.env.PORT, () => {
    console.log(`Escuchando en puerto: ${process.env.PORT}`);

});