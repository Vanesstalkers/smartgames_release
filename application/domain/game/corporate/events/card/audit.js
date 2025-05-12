(function event() {
    const event = domain.game.events.card.audit();

    event.init = function () {
        const { game, player } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;

        const eventData = { player: {} };
        for (const player of superGame.players()) {
            eventData.player[player.id()] = { selectable: true };
        }
        player.set({ eventData });
    };

    event.getPlayerDeck = function (player) {
        return player.getHandDominoDeck();
    };

    return event;
})