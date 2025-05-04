() => {

    const event = domain.game.events.card.dream();

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

        const eventData = { plane: {} };
        const planes = game.decks.table.select({ className: 'Plane', attr: { anchorGameId: game.id() } });
        for (const plane of planes) {
            if (plane.isCardPlane()) continue;
            if (plane.select({ className: 'Dice', directParent: false, attr: { deleted: true } }).length) continue;

            eventData.plane[plane.id()] = { selectable: true };
        }
        player.set({ eventData });
    };

    event.handlers['TRIGGER'] = function ({ target }) {
        if (!target) return;

        const { game, player } = this.eventContext();
        const deck = game.find('Deck[domino]');

        const ids = [];
        for (const dice of target.select({ className: 'Dice', directParent: false })) {
            dice.moveToTarget(deck);
            ids.push(dice.id());
        }
        target.set({ release: null });

        if (ids.length) {
            const superGame = game.hasSuperGame ? game.game() : game;
            superGame.broadcastEvent('DICES_REMOVED', { ids }); // если у кто активирован refactoring
        }
        this.emit('RESET');
    }
    event.handlers['DICES_DISABLED'] = function ({ parent, ids = [] }) {
        const { game, player } = this.eventContext();

        if (parent === game) return; // тут roundReady, следом вызовется END_ROUND из roundEnd

        if (player.eventData.plane) {
            const eventData = { plane: {} };
            for (const planeId of Object.keys(player.eventData.plane)) {
                if (parent.id() === planeId) {
                    eventData.plane[planeId] = null;
                }
            }
            player.set({ eventData });
        }

        if (Object.keys(player.eventData.plane).length === 0) {
            return this.emit('RESET');
        } else {
            return { preventListenerRemove: true };
        }
    }

    return event;
}