(function event() {
    const event = domain.game.events.card.insight();

    event.init = function () {
        const { game, player } = this.eventContext();
        const playerGame = player.game();
        const deck = playerGame.find('Deck[domino]');
        const hand = playerGame.merged ? playerGame.find('Deck[domino_common]') : player.find('Deck[domino]');
        
        deck.moveRandomItems({ count: 1, target: hand });
        
        return { resetEvent: true };
    };

    return event;
})