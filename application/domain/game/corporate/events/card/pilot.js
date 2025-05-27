() => {
    const event = domain.game.events.card.pilot();

    event.init = function () {
        let { game, player, source: card } = this.eventContext();
        if (game.isSuperGame) game = player.game();

        if (game.mergeStatus() === 'freezed') {
            const message = `Карта "${card.title}" не имеет эффекта в текущем статусе игры.`;
            game.logs(message);
            player.notifyUser(message);
            return { resetEvent: true };
        }

        const gameDeck = game.find('Deck[plane]');
        const playerDeck = player.find('Deck[plane]');

        if (!gameDeck.itemsCount()) return { resetEvent: true };

        const eventData = { plane: {} };

        for (let i = 0; i < game.settings.planesToChoose; i++) {
            const plane = gameDeck.getRandomItem();
            if (!plane) continue;

            plane.moveToTarget(playerDeck);
            eventData.plane[plane.id()] = { oneOfMany: true };
        }

        player.set({ eventData });
    };

    return event;
} 