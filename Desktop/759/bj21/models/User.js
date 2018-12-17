// const bcrypt = require('bcrypt');
// const saltRounds = 10;
//const sequelize = require('../routes/db');
module.exports = function(sequelize) {
    var Users = sequelize.define('users', {
        id: {
            type: sequelize.Sequelize.STRING,
            field: 'usrid',
            allowNull: false,
            primaryKey: true
        },
        username: {
            type: sequelize.Sequelize.STRING,
            field: 'usrnm', // Will result in an attribute that is username when user facing but usrnm in the database
            allowNull: false
        },
        password: {
            type: sequelize.Sequelize.STRING,
            field: 'pswd',
            allowNull: false
        },
        pswd_salt: {
            type: sequelize.Sequelize.STRING,
            filed: 'pswd_salt',
            allowNull: false
        }
    });
    return Users;
}
    // Users.sync();
    // module.exports = Users;
