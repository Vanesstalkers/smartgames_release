(function event() {
    const event = domain.game.events.card.flowstate();

    event.getDeck = function () {
        const { game, player } = this.eventContext();
        const deck = player.game().find('Deck[domino]');
        return deck;
    }

    return event;
})