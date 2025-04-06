(function event() {
    const event = domain.game.events.card.take_project();

    event.init = function () {
        const { game, player: activePlayer } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;

        const eventData = { dice: {}, player: {} };
        for (const player of superGame.players()) {
            if (player === activePlayer) continue;

            const playerGame = player.game();
            const deck = playerGame.merged ? playerGame.find('Deck[domino_common]') : player.find('Deck[domino]');
            for (const dice of deck.select('Dice')) {
                const diceId = dice.id();
                let visibleDiceId = diceId;
                if (!dice.visible) {
                    const fakeId = dice.fakeId[deck.id()];
                    visibleDiceId = fakeId;
                    this.fakeIdMapping[fakeId] = diceId;
                }
                eventData.dice[visibleDiceId] = { selectable: true };
            }
            eventData.player[player.id()] = { showDecks: true };
        }
        activePlayer.set({ eventData });

        if (Object.keys(eventData.dice).length === 0) return { resetEvent: true };
    };

    event.getTargetPlayer = function ({ targetPlayerId }) {
        const { game } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;
        const targetPlayer = superGame.get(targetPlayerId);
        const targetPlayerGame = targetPlayer.game();
        const targetPlayerHand = targetPlayerGame.merged ? targetPlayerGame.find('Deck[domino_common]') : targetPlayer.find('Deck[domino]');
        const handId = targetPlayerHand?.id();
        return { targetPlayer, targetPlayerHand, handId };
    }
    event.getRandomDice = function () {
        const { game, player: activePlayer } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;

        const availableDice = Object.keys(activePlayer.eventData.dice);
        if (availableDice.length === 0) return null;

        const sortedDice = availableDice.sort((diceId1, diceId2) => {
            const dice1Game = superGame.get(this.fakeIdMapping[diceId1] || diceId1).game();
            const dice2Game = superGame.get(this.fakeIdMapping[diceId2] || diceId2).game();
            return (dice2Game !== game) - (dice1Game !== game); // в приоритете рука игрока из другой игры
        });

        const diceId = sortedDice[0];
        return superGame.get(this.fakeIdMapping[diceId] || diceId);
    }

    return event;
})