(function event() {

    const event = domain.game.events.card.security();

    event.init = function () {
        const { game, player } = this.eventContext();

        if (game.fieldIsBlocked()) {
            const message = `Карта "${this.title}" не имеет эффекта в текущем статусе игры.`;
            game.logs(message);
            lib.store.broadcaster.publishAction(`gameuser-${player.userId}`, 'broadcastToSessions', {
                data: { message },
            });
            return { resetEvent: true };
        }

        const deck = game.find('Deck[domino]');
        const ids = [];
        for (const bridge of game.select({ className: 'Bridge', attr: { anchorGameId: game.id() } })) {
            for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
                if (dice.deleted) continue;

                dice.moveToTarget(deck);
                ids.push(dice.id());
                bridge.set({ release: null });
            }
        }

        if (ids.length) {
            const superGame = game.hasSuperGame ? game.game() : game;
            superGame.broadcastEvent('DICES_REMOVED', { ids }); // если у кто активирован refactoring
        }
    };

    return event;
})