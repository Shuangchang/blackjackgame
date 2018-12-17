module.exports = function(sequelize) {
    const Player = sequelize.define('players', {
        id: {
            type: sequelize.Sequelize.STRING,
            field: 'playerid',
            allowNull: false,
            primaryKey: true
        },
        playername: {
            type: sequelize.Sequelize.STRING,
            field: 'playername', // Will result in an attribute that is username when user facing but usrnm in the database
            allowNull: false
        },
        gameid: {
            type: sequelize.Sequelize.STRING,
            field: 'gameid',
            allowNull: false,
            primaryKey: true
        }
    });
    return Player;
}