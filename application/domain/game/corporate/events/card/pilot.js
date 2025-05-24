() => {
    const event = domain.game.events.card.pilot();
    const originalInit = event.init;

    event.init = function () {
        const { game, player, source: card } = this.eventContext();
        if (game.mergeStatus() === 'freezed') {
            const message = `Карта "${card.title}" не имеет эффекта в текущем статусе игры.`;
            game.logs(message);
            player.notifyUser(message);
            return { resetEvent: true };
        }
        originalInit.call(this);
    };

    return event;
} 