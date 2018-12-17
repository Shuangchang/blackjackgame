module.exports = function(sequelize) {
    const Game = sequelize.define('games', {
        id: {
            type: sequelize.Sequelize.STRING,
            field: 'gameid',
            allowNull: false,
            primaryKey: true
        }
    });
    return Game;
}