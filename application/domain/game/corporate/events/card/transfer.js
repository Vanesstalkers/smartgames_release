(function event() {
    const event = domain.game.events.card.transfer();

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
        const playerGame = targetPlayer.game();
        const playerHand = targetPlayer.getHandDominoDeck();
        const gameDeck = playerGame.find('Deck[domino]');
        const count = playerHand.itemsCount();

        playerGame.logs({
            msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
            userId: targetPlayer.userId,
        });

        playerHand.moveAllItems({ target: gameDeck });
        gameDeck.moveRandomItems({ count, target: playerHand });

        this.emit('RESET');
    }

    return event;
})