require('dotenv').config();
const session = require('express-session');
var Sequelize = require("sequelize");
const SequelizeStore = require('connect-session-sequelize')(session.Store);
var sequelize = new Sequelize(
        // process.env.DBNM,
        // process.env.DBUSRNAME,
        // process.env.DBPSW,
    process.env.DATABASE_URL,
    {
        dialect: "postgres",
        storage: "./session.postgres",
        port: 5432,
        host: "<heroku host>",
        ssl: true
    });
    sequelize.Sequelize = Sequelize;
// var myStore = new SequelizeStore({
//     db: sequelize
// })
var Session = sequelize.define('sessions', {
    sid: {
        type: Sequelize.STRING,
        primaryKey: true
    },
    userId: Sequelize.STRING,
    expires: Sequelize.DATE,
    data: Sequelize.STRING(50000)
});

function extendDefaultFields(defaults, session) {
    return {
        data: defaults.data,
        expires: defaults.expires,
        userId: session.userId
    };
}
var myStore = new SequelizeStore({
    db: sequelize,
    table: 'sessions',
    extendDefaultFields: extendDefaultFields
});
myStore.sync();
sequelize.myStore = myStore;
module.exports = sequelize;

