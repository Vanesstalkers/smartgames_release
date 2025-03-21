() => {
    const event = domain.game.events.card.pilot();
    const originalInit = event.init;
    const originalAddPlane = event.handlers['ADD_PLANE'];

    event.init = function () {
        const { game, player, source: card } = this.eventContext();
        if (game.mergeStatus() === 'freezed') {
            const message = `Карта "${card.title}" не имеет эффекта в текущем статусе игры.`;
            game.logs(message);
            lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
                data: { message },
            });
            return { resetEvent: true };
        }
        originalInit.call(this);

        for (const planeId of Object.keys(player.eventData.plane)) {
            const plane = game.get(planeId);
            plane.set({ anchorGameId1: null });
        }
    };

    // event.handlers['ADD_PLANE'] = function ({ target: plane }) {
    //     const { game, player } = this.eventContext();
    //     plane.set({ anchorGameId: player.game().id() });
    //     originalAddPlane.call(this, { target: plane });
    // };

    return event;
} 