() => {
  const {
    handlers: { RESET, DEACTIVATE, END_ROUND },
  } = domain.game.events.card.refactoring();

  return {
    init: function () {
      const { game, player } = this.eventContext();
      const planes = [];
      const bridges = [];
      const games =
        game.isSuperGame && game.allGamesMerged()
          ? [game]
          : game
            .game()
            .getAllGames()
            .filter((g) => !g.merged);

      for (const game of games) {
        if (game.fieldIsBlocked()) continue;

        planes.push(...game.decks.table.getAllItems().filter((p) => !p.eventData.actionsDisabled));
        bridges.push(...game.select('Bridge').filter((b) => !b.eventData.actionsDisabled));
      }

      const eventData = { dice: {} };
      for (const plane of planes) {
        for (const dice of plane.select({ className: 'Dice', directParent: false })) {
          if (dice.deleted) continue;
          eventData.dice[dice.id()] = { selectable: true };
        }
      }
      for (const bridge of bridges) {
        for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
          if (dice.deleted) continue;
          eventData.dice[dice.id()] = { selectable: true };
        }
      }

      if (Object.keys(eventData.dice).length === 0) return { resetEvent: true };

      player.set({ eventData });
    },
    handlers: {
      RESET,
      DEACTIVATE,
      END_ROUND,
      TRIGGER: function ({ target: dice }) {
        const { game: eventGame, player } = this.eventContext();
        const zoneParent = dice.findParent({ className: 'Zone' }).parent(); // plane или bridge
        const game = zoneParent.game();
        const playerHand = player.find('Deck[domino]');

        const fieldIsBlocked = game.fieldIsBlocked();
        if (
          // у текущей игры мог завершиться раунд (сработает fieldIsBlocked), но TRIGGED вызвался из END_ROUND
          game !== eventGame &&
          fieldIsBlocked
        ) {
          const eventData = { dice: {} };
          for (const diceId of Object.keys(player.eventData.dice)) {
            if (game.get(diceId, { directParent: true })) {
              eventData.dice[diceId] = null;
            }
          }
          player.set({ eventData });

          if (Object.keys(player.eventData.dice).length === 0) {
            return this.emit('RESET');
          } else {
            return { preventListenerRemove: true };
          }
        }

        dice.moveToTarget(playerHand);
        dice.set({ visible: true, locked: true });
        zoneParent.set({ release: null });

        game.logs({
          msg: `Игрок {{player}} забрал со стола костяшку "${dice.getTitle()}".`,
          userId: player.userId,
        });

        this.targetDice = dice;
        this.emit('DEACTIVATE'); // не удаляем событие, чтобы в конце раунда снялся locked-флаг
        eventGame.removeEventListener({ handler: 'DICES_DISABLED', eventToRemove: this }); // пока раунд не завершен этот handler могут вызвать события, например удаление костяшки
        game.game().broadcastEvent('DICES_DISABLED', { ids: [dice.id()] }); // если у кто тоже активирован refactoring
      },
      DICES_REMOVED: function ({ parent, ids = [] }) {
        this.emit('DICES_DISABLED', { parent, ids });
      },
      DICES_DISABLED: function ({ parent, ids = [] }) {
        const { game, player } = this.eventContext();

        if (parent === game) return; // тут roundReady, следом вызовется END_ROUND из roundEnd

        if (player.eventData.dice) {
          const eventData = { dice: {} };
          for (const diceId of Object.keys(player.eventData.dice)) {
            if (parent?.get(diceId, { directParent: true }) || ids.includes(diceId)) {
              eventData.dice[diceId] = null;
            }
          }
          player.set({ eventData });
        }

        if (Object.keys(player.eventData.dice).length === 0) {
          return this.emit('RESET');
        } else {
          return { preventListenerRemove: true };
        }
      },
    },
    getRandomDice() {
      const { game, player } = this.eventContext();
      const playerGameId = player.gameId;

      if (!this.targetDice) {
        const planes = game.decks.table.items();
        const bridges = game.select('Bridge');
        const items = [
          ...planes.filter(p => p.anchorGameId === playerGameId),
          ...bridges.filter(b => b.anchorGameId === playerGameId),
          ...planes.filter(p => p.anchorGameId !== playerGameId),
          ...bridges.filter(b => b.anchorGameId !== playerGameId),
        ];

        for (const item of items) {
          for (const dice of item.select({ className: 'Dice', directParent: false })) {
            this.emit('TRIGGER', { target: dice });
            if (this.targetDice) return;
          }
        }
      }
    }
  };
};
