() => {
  const {
    handlers: { RESET, DEACTIVATE, END_ROUND },
  } = domain.game.events.card.refactoring();

  return {
    init: function () {
      const { game, player } = this.eventContext();
      const isCompetitionGame = game.gameConfig === 'competition';
      const isCooperativeGame = game.gameConfig === 'cooperative';

      let planes = [];
      let bridges = [];

      const games =
        isCompetitionGame
          ? game.game().getAllGames()
          : game.isSuperGame && game.allGamesMerged()
            ? [game]
            : game.game().getAllGames().filter((g) => !g.merged);

      for (const game of games) {
        if (isCooperativeGame && game.fieldIsBlocked()) continue;
        const gameId = game.id();

        const availablePlanes = isCompetitionGame
          ? game.merged
            ? game.game().decks.table.items().filter(p => p.anchorGameId === gameId || p.mergedGameId === gameId || p.customClass.includes('central'))
            : game.decks.table.items()
          : game.decks.table.getAllItems();
        const availableBridges = isCompetitionGame
          ? game.merged
            ? game.game().select('Bridge').filter(b => b.anchorGameId === gameId || b.mergedGameId === gameId)
            : game.select('Bridge')
          : game.select('Bridge');

        planes.push(...availablePlanes.filter((p) => !p.eventData.actionsDisabled));
        bridges.push(...availableBridges.filter((b) => !b.eventData.actionsDisabled));
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
        const zone = dice.findParent({ className: 'Zone' });
        if(!zone) return this.emit('RESET'); // в конце раунда при нескольких активированных refactoring не успевает отработать DICES_DISABLED у второго

        const zoneParent = zone.parent(); // plane или bridge
        const game = zoneParent.game();
        const isCooperativeGame = game.gameConfig === 'cooperative';
        const playerHand = player.find('Deck[domino]');

        const fieldIsBlocked = isCooperativeGame && game.fieldIsBlocked();
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

        const anchorGame = lib.store('game').get(zoneParent.anchorGameId);
        const tableTitle = `<team team="${anchorGame.templates.code || 'super'}">стола</team>`;
        anchorGame.logs({
          msg: `Игрок {{player}} забрал со ${tableTitle} костяшку "${dice.getTitle()}".`,
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

      if (!this.targetDice) {
        const superGame = game.isSuperGame ? game : game.game();
        const ids = Object.keys(player.eventData.dice);
        const diceId = ids[Math.floor(Math.random() * ids.length)]
        const dice = superGame.get(diceId);

        if (dice) this.emit('TRIGGER', { target: dice });
      }
    }
  };
};
