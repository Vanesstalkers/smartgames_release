() => {
    const event = domain.game.events.card.pilot();

    event.init = function () {
        let { game, player, source: card } = this.eventContext();
        if (game.isSuperGame) game = player.game();

        if (game.mergeStatus() === 'freezed') {
            throw new Error(`Карта <a>${card.title}</a> не имеет эффекта в текущем статусе игры`);
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