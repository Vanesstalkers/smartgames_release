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
            msg: `Игрок {{player}} стал целью события "${this.getTitle()}".`,
            userId: targetPlayer.userId,
        });

        const targetPlayerGame = targetPlayer.game();
        const targetHand = targetPlayerGame.merged ? targetPlayerGame.find('Deck[domino_common]') : targetPlayer.find('Deck[domino]');

        for (const dice of targetHand.items()) {
            dice.moveToDeck();
        }

        this.emit('RESET');
    }

    return event;
})