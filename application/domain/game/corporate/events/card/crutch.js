(function event() {
    const event = domain.game.events.card.crutch();

    event.handlers['DICE_ADDED'] = function ({ dice }) {
        const { game, player } = this.eventContext();

        const eventData = { dside: {} };
        for (const dside of dice.select('DiceSide')) {
            eventData.dside[dside.id()] = { selectable: true };
        }
        player.set({ eventData });
    }

    const game = this.game();
    const commonHandActive = game.merged || game.isSuperGame;
    if (!commonHandActive) return event;

    event.init = function () {
        const { game, player } = this.eventContext();
        const decks = [...player.select('Deck')];
        if (game.gameConfig === 'cooperative') decks.push(player.game().find('Deck[domino_common]'));

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