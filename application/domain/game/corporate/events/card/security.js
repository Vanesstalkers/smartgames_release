(function event() {

    const event = domain.game.events.card.security();

    event.init = function () {
        const { game, player } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;
        const isCooperativeGame = game.gameConfig === 'cooperative';

        const eventData = { game: {} };
        for (const game of superGame.getAllGames()) {
            if (isCooperativeGame && game.fieldIsBlocked()) continue;
            eventData.game[game.id()] = { selectable: true };
        }

        if (Object.keys(eventData.game).length === 0) {
            superGame.logs(`Розыгрыш карты <a>${this.getTitle()}</a> отменен, так как не найдено доступных целей.`);
            return { resetEvent: true };
        }

        player.set({ eventData });
    };

    event.handlers = {
        RESET: function () {
            const { game, player } = this.eventContext();
            player.set({ eventData: { game: null } });
            this.destroy();
        },
        TRIGGER: function ({ target: targetGame }) {
            const { game, player } = this.eventContext();
            const superGame = game.hasSuperGame ? game.game() : game;
            const isCooperativeGame = game.gameConfig === 'cooperative';

            superGame.logs(`Команда <team team="${targetGame.templates.code}">${targetGame.title}</team> стала целью события <a>${this.getTitle()}</a>.`);

            const anchorGameId = targetGame.id();
            const bridges = superGame.select({ className: 'Bridge', attr: { anchorGameId } });
            if (targetGame.merged) {
                const superGameBridges = isCooperativeGame
                    ? superGame.select({ className: 'Bridge', attr: { sourceGameId: superGame.id() } })
                        .filter(({ mergedGameId }) => !mergedGameId || mergedGameId === anchorGameId)
                    : superGame.select({ className: 'Bridge', attr: { mergedGameId: anchorGameId } });
                bridges.push(...superGameBridges);
            }
            const deck = targetGame.find('Deck[domino]');
            const ids = [];
            for (const bridge of bridges) {
                for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
                    if (dice.deleted) continue;

                    dice.moveToTarget(deck);
                    ids.push(dice.id());
                    bridge.set({ release: null });
                }
            }

            if (ids.length) {
                const superGame = targetGame.hasSuperGame ? targetGame.game() : targetGame;
                superGame.broadcastEvent('DICES_REMOVED', { ids }); // если у кто активирован refactoring
            }

            this.emit('RESET');
        },
        END_ROUND: function () {
            const { game, player } = this.eventContext();
            const superGame = game.hasSuperGame ? game.game() : game;
            const isCooperativeGame = game.gameConfig === 'cooperative';

            let target = player.game();
            if (isCooperativeGame && target.fieldIsBlocked()) {
                const targetId = Object.keys(player.eventData.game || {}).filter((id) => id !== target.id())[0];
                target = superGame.get(targetId);
            }

            if (target) return this.emit('TRIGGER', { target });
            this.emit('RESET');
        },
    }

    return event;
})