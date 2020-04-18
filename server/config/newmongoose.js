// mongoose es el paquete para manejarBD Mongo
const newmongoose = require('mongoose');

// resolver los deprecation warning configurando los flags correspondientes
newmongoose.set('useNewUrlParser', true);
newmongoose.set('useFindAndModify', false);
newmongoose.set('useCreateIndex', true);
newmongoose.set('useUnifiedTopology', true);
newmongoose.set('useNewUrlParser', true);

module.exports = newmongoose;