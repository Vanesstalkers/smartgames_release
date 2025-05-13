() => {

    const event = domain.game.events.card.dream();

    event.init = function () {
        const { game, player } = this.eventContext();
        const isCompetitionGame = game.gameConfig === 'competition';
        const isCooperativeGame = game.gameConfig === 'cooperative';

        const games =
            isCompetitionGame
                ? game.game().getAllGames()
                : game.isSuperGame && game.allGamesMerged()
                    ? [game]
                    : game.game().getAllGames().filter((g) => !g.merged);

        const eventData = { plane: {} };
        for (const game of games) {
            if (isCooperativeGame && game.fieldIsBlocked()) continue;

            const gameId = game.id();
            const planes = isCompetitionGame
                ? game.merged
                    ? game.game().decks.table.items().filter(p => p.anchorGameId === gameId || p.mergedGameId === gameId || p.customClass.includes('central'))
                    : game.decks.table.items()
                : game.decks.table.select({ className: 'Plane', attr: { anchorGameId: gameId } });

            for (const plane of planes) {
                if (plane.isCardPlane()) continue;
                if (plane.select({ className: 'Dice', directParent: false, attr: { deleted: true } }).length) continue;

                eventData.plane[plane.id()] = { selectable: true };
            }
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

        if (ids.length === 0) {
            const planeIds = parent.isGame() ? parent.decks.table.items().map((p) => p.id()) : [parent.id()];
            ids.push(...planeIds);
        }

        if (player.eventData.plane) {
            const eventData = { plane: {} };
            for (const planeId of Object.keys(player.eventData.plane)) {
                if (ids.includes(planeId)) {
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