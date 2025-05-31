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

                eventData.plane[plane.id()] = { selectable: true, anchorGameId: plane.anchorGameId, dicesCount: plane.dicesCount() };
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
    event.handlers['END_ROUND'] = function () {
        const { game, player } = this.eventContext();

        const targetId = Object.entries(player.eventData.plane)
            .sort(([idA, p1], [idB, p2]) => {
                // делаем через player.gameId, потому что в game может быть super-игра
                if (p1.anchorGameId === player.gameId && p2.anchorGameId !== player.gameId) return -1;
                if (p1.anchorGameId !== player.gameId && p2.anchorGameId === player.gameId) return 1;
                return (p2.dicesCount || 0) - (p1.dicesCount || 0); // plane с наибольшим количеством костяшек
            })
            .find(([id, p]) => p.selectable)?.[0];

        if (!targetId) return this.emit('RESET');

        const target = game.get(targetId);
        this.emit('TRIGGER', { target });
    }
    event.handlers['DICES_DISABLED'] = function ({ parent, ids = [] }) {
        const { game, player } = this.eventContext();

        if (parent === game) return this.emit('END_ROUND'); // событие должно отработать до того, как все блоки всех игру будут заблокированы

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