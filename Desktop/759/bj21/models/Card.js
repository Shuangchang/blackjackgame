module.exports = function(sequelize) {
    const Card = sequelize.define('cards', {
        id: {
            type: sequelize.Sequelize.INTEGER,
            field: 'cardid',
            allowNull: false,
            primaryKey: true
        },
        cardValue: {
            type: sequelize.Sequelize.INTEGER,
            field: 'cardValue', // Will result in an attribute that is username when user facing but usrnm in the database
            allowNull: false
        },
        cardSuit:{
            type: sequelize.Sequelize.STRING,
            field: 'cardSuit', // Will result in an attribute that is username when user facing but usrnm in the database
            allowNull: false
        },
        playerid:{
            type: sequelize.Sequelize.STRING,
            field: 'playerid',
            allowNull: true
        },
        game:{
            type: sequelize.Sequelize.STRING,
            field: 'gameid',
            allowNull: false,
            primaryKey: true
        }
    });
    return Card;
}
