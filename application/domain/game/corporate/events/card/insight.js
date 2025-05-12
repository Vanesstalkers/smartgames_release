(function event() {
    const event = domain.game.events.card.insight();

    event.init = function () {
        const { game, player } = this.eventContext();
        const playerGame = player.game();
        const hand = player.getHandDominoDeck();

        playerGame.find('Deck[domino]').moveRandomItems({ count: 1, target: hand });

        return { resetEvent: true };
    };

    return event;
})