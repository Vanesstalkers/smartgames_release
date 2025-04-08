(function event() {
    const event = domain.game.events.card.showoff();

    event.init = function () {
        const { game, player } = this.eventContext();
        const playerGame = player.game();
        const deck = playerGame.find('Deck[domino]');
        const hand = playerGame.merged ? playerGame.find('Deck[domino_common]') : player.find('Deck[domino]');
        const count = hand.itemsCount();
        const handLimit = playerGame.merged ? playerGame.settings.playerHandLimit * playerGame.players().length : playerGame.settings.playerHandLimit;

        deck.moveRandomItems({
            count: handLimit - count,
            target: hand,
        });

        return { resetEvent: true };  
    };

    return event;
})