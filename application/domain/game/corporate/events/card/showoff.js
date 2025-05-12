(function event() {
    const event = domain.game.events.card.showoff();

    event.init = function () {
        const { game, player } = this.eventContext();
        const playerGame = player.game();
        const deck = playerGame.find('Deck[domino]');
        const hand = player.getHandDominoDeck();
        const count = hand.itemsCount();
        const handLimit = playerGame.merged && playerGame.gameConfig === 'cooperative' ? playerGame.settings.playerHandLimit * playerGame.players().length : playerGame.settings.playerHandLimit;

        deck.moveRandomItems({
            count: handLimit - count,
            target: hand,
        });

        return { resetEvent: true };
    };

    return event;
})