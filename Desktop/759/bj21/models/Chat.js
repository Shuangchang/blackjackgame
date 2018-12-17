// const bcrypt = require('bcrypt');
// const saltRounds = 10;
//const sequelize = require('../routes/db');
module.exports = function(sequelize) {
    var Chats = sequelize.define('chats', {
        id: {
            type: sequelize.Sequelize.STRING,
            field: 'msgid',
            allowNull: false,
            primaryKey: true
        },
        userid: {
            type: sequelize.Sequelize.STRING,
            field: 'usrid', // Will result in an attribute that is username when user facing but usrnm in the database
            allowNull: false
        },
        message: {
            type: sequelize.Sequelize.STRING,
            field: 'msg',
            allowNull: false
        }
    });
    return Chats;
}
