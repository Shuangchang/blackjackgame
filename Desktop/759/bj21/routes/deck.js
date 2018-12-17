class Deck {
    constructor(gameid) {
        this.deck = [];

        const suits = ['Hearts', 'Spades', 'Clubs', 'Diamonds'];
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

        let id = 0;
        for(let i = 1; i<=4; i++){
            for(let j=1; j<=13; j++){
                this.deck.push({
                    id:id,
                    cardValue:j,
                    cardSuit:i,
                    playerid:null,
                    game:gameid
                });
                id++;
            }
        }
        // for (let suit in suits) {
        //     for (let value in values) {
        //         this.deck.push({
        //             id:id,
        //             cardValue:value,
        //             cardSuit:suit,
        //             playerid:null,
        //             game:gameid
        //         });
        //         id++;
        //     }
        // }
    }
    shuffle(){
        for (let i = 51; i > 0; i--) {
            let r = Math.floor((i+1)*Math.random(i));
            let temp = this.deck[r];
            this.deck[r] = this.deck[i];
            this.deck[i] = temp;
        }
        this.count = 52;
    }
}

module.exports = Deck;
