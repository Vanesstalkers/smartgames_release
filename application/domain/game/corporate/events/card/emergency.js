(function event() {
    const event = domain.game.events.card.emergency();
    const game = this.game();

    if (game.gameConfig === 'cooperative') {
        event.init = function () {
            const { game, player } = this.eventContext();
            const superGame = game.hasSuperGame ? game.game() : game;

            for (const game of superGame.getAllGames()) {
                if (game.merged) {
                    const deck = game.find('Deck[domino]');
                    const hand = game.find('Deck[domino_common]');
                    const count = hand.itemsCount();
                    const handLimit = game.settings.playerHandLimit * game.players().length;
                    deck.moveRandomItems({ count: handLimit - count, target: hand });
                } else {
                    this.fillHandWithDices(game);
                }
            }

            return { resetEvent: true };
        };
    }

    if (game.gameConfig === 'competition') {
        event.init = function () {
            const { game, player } = this.eventContext();
            this.fillHandWithDices(player.game());
        }
    }

    return event;
})