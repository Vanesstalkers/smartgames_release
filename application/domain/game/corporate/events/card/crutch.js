(function event() {
    const event = domain.game.events.card.crutch();

    const game = this.game();
    const commonHandActive = game.merged || game.isSuperGame;
    if (!commonHandActive) return event;

    event.init = function () {
        const { game, player } = this.eventContext();
        const decks = [player.game().find('Deck[domino_common]'), ...player.select('Deck')];

        const eventData = { dside: {} };
        for (const deck of decks) {
            if (deck.type !== 'domino') continue;
            for (const dice of deck.select('Dice')) {
                for (const dside of dice.select('DiceSide')) {
                    eventData.dside[dside.id()] = { selectable: true };
                }
            }
        }
        if (Object.keys(eventData.dside).length === 0) return { resetEvent: true };

        player.set({ eventData });
    };

    return event;
})