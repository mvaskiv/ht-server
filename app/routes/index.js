const Routes        = require('./app_routes');
// const Init          = require('./sync_routes');

module.exports = function(app, db) {
    Routes(app, db);
}