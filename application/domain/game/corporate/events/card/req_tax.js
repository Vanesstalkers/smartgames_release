() => {
    const event = domain.game.events.card.req_tax();
    const originalInit = event.init;
    event.init = function () {
        const { game, player, source: card } = this.eventContext();
        if (game.mergeStatus() === 'freezed') {
            const message = `Карта "${card.title}" не имеет эффекта в текущем статусе игры.`;
            game.logs(message);
            player.notifyUser(message);
            return { resetEvent: true };
        }

        player.set({ eventData: { plane: null } }); // внутри много мусора и ниже for отработает с ошибкой

        originalInit.call(this);

        for (const planeId of Object.keys(player.eventData.plane)) {
            const plane = game.get(planeId);
            plane.set({ anchorGameId: player.game().id() }); // иначе с фронта для всех событий plane-а будет приходить его sourceGameId (зависит от колоды-источника, а не от игрока)
        }
    };
    return event;
} 