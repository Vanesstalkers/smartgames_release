(function event() {
    const event = domain.game.events.card.give_project();

    event.init = function () {
        const { game, player } = this.eventContext();
        const deck = player.getHandDominoDeck();

        const eventData = { dice: {} };
        for (const dice of deck.select('Dice')) {
            eventData.dice[dice.id()] = { selectable: true };
        }
        if (Object.keys(eventData.dice).length === 0) return { resetEvent: true };

        player.set({ eventData });
    };

    event.handlers['TRIGGER'] = function ({ target }) {
        const { game, player: activePlayer } = this.eventContext();
        const superGame = game.hasSuperGame ? game.game() : game;

        if (!target) return this.emit('RESET');

        if (!this.targetDice) {
            this.targetDice = target;

            this.emit('DEACTIVATE');

            const eventData = { player: {} };
            for (const player of superGame.players()) {
                if (player === activePlayer) continue;
                eventData.player[player.id()] = { selectable: true };
            }
            activePlayer.set({ eventData });

            return { preventListenerRemove: true };
        }

        const playerHand = target.getHandDominoDeck();
        this.targetDice.moveToTarget(playerHand);
        target.game().toggleEventHandlers('DICE_ADDED', { dice: this.targetDice }, target); // в качестве initPlayer-а указывает target, чтобы прошла access-проверка

        game.logs({
            msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
            userId: target.userId,
        });

        this.emit('RESET');
    }

    event.handlers['END_ROUND'] = function () {
        const { game, player } = this.eventContext();
        let players = game.players();
        if (players.length === 1) players = game.game().players();
        const playerGame = player.game();
        if (playerGame.merged) players = players.filter(p => p.gameId !== playerGame.id()); // иначе будет возврат в общую руку

        if (!this.targetDice) {
            const deck = player.getHandDominoDeck();
            this.targetDice = deck.select('Dice')[0]; // не берем из eventData.dice, т.к. dice могли уже забрать из руки (событие take_project)
        }

        const activePlayerIndex = players.findIndex(p => p === player);
        const nextPlayerIndex = (activePlayerIndex + 1) % players.length;

        this.emit('TRIGGER', {
            target: players[nextPlayerIndex],
        });
    }

    return event;
})