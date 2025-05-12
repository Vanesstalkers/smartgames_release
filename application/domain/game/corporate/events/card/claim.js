(function event() {
    const event = domain.game.events.card.claim();

    event.init = function () {
        const { game, player } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;

        const eventData = { player: {} };
        for (const player of superGame.players()) {
            eventData.player[player.id()] = { selectable: true };
        }
        player.set({ eventData });
    };

    event.handlers['TRIGGER'] = function ({ target: targetPlayer }) {
        const { game, player } = this.eventContext();

        game.logs({
            msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
            userId: targetPlayer.userId,
        });

        for (const dice of targetPlayer.getHandDominoDeck().items()) {
            dice.moveToDeck();
        }

        this.emit('RESET');
    }

    return event;
})