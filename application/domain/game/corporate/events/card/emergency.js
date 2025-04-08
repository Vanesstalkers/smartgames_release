(function event() {
    const event = domain.game.events.card.emergency();

    event.init = function () {
        const { game, player } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;

        for (const game of superGame.getAllGames()) {
            const deck = game.find('Deck[domino]');

            if (game.merged) {
                const hand = game.find('Deck[domino_common]');
                const count = hand.itemsCount();
                const handLimit = game.settings.playerHandLimit * game.players().length;
                deck.moveRandomItems({ count: handLimit - count, target: hand });
            } else {
                for (const player of game.players()) {
                    const hand = player.find('Deck[domino]');
                    const count = hand.itemsCount();
                    const handLimit = game.settings.playerHandLimit;
                    deck.moveRandomItems({ count: handLimit - count, target: hand });
                }
            }
        }

        return { resetEvent: true };
    };

    return event;
})