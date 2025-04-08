(function event() {
    const event = domain.game.events.card.transfer();

    event.init = function () {
        const { game, player } = this.eventContext();
        const playerGame = player.game();
        const playerHand = playerGame.merged ? playerGame.find('Deck[domino_common]') : player.find('Deck[domino]');
        const gameDeck = playerGame.find('Deck[domino]');
        const count = playerHand.itemsCount();
    
        playerHand.moveAllItems({ target: gameDeck });
        gameDeck.moveRandomItems({ count, target: playerHand });
        
        return { resetEvent: true };
    };

    return event;
})