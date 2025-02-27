const { init, handlers } = domain.game.events.card.refactoring();

return {
  init,
  handlers: {
    ...handlers,
    RELEASE: function ({ initPlayer: player }) {
      const { game } = this.eventContext();
      
      if (game.checkFieldIsReady()) return game.run('endGame', { winningPlayer: player });
      
      const playerCardDeck = player.find('Deck[card]');
      game.run('smartMoveRandomCard', { target: playerCardDeck });
      lib.timers.timerRestart(game, { extraTime: game.settings.timerReleasePremium });
      
      game.logs(`Игрок {{player}} инициировал РЕЛИЗ, за что получает дополнительную карту-события в руку.`);

      return { preventListenerRemove: true };
    },
    ADD_PLANE: function ({ target: plane }) {
      const { game, player } = this.eventContext();

      for (const event of plane.eventData.activeEvents) {
        event.emit('ADD_PLANE');
      }

      game.checkDiceResource();

      return { preventListenerRemove: true };
    },
  },
};

() => ({
  init: function () {
    let { game: eventGame, player } = this.eventContext();
    let planes = eventGame.decks.table.select('Plane');
    let bridges = eventGame.select('Bridge');

    if (eventGame.hasSuperGame || (eventGame.isSuperGame && !eventGame.allGamesMerged())) {
      const games = eventGame.isSuperGame
        ? eventGame.getAllGames().filter((g) => !g.merged)
        : eventGame.game().getAllGames();
      planes = [];
      bridges = [];
      for (const game of games) {
        if (game.fieldIsBlocked()) continue;

        // if (game !== eventGame) {
        //   this.relatedGames.add(game);
        //   game.relatedEvents({ add: this });
        // }

        planes.push(...game.decks.table.getAllItems());
        bridges.push(...game.select('Bridge'));
      }
    }

    const eventData = { dice: {} };
    let diceFound = false;
    for (const plane of planes) {
      for (const dice of plane.select({ className: 'Dice', directParent: false })) {
        eventData.dice[dice.id()] = { selectable: true };
        diceFound = true;
      }
    }
    for (const bridge of bridges) {
      for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
        eventData.dice[dice.id()] = { selectable: true };
        diceFound = true;
      }
    }

    if (!diceFound) return { resetEvent: true };

    player.set({ eventData });
  },
  handlers: {
    RESET: function () {
      this.emit('DEACTIVATE');

      // for (const game of this.relatedGames) {
      //   this.relatedGames.delete(game);
      //   game.relatedEvents({ remove: this });
      // }

      this.destroy();
    },
    DEACTIVATE: function () {
      let { game, player } = this.eventContext();
      if (game.hasSuperGame && game.checkFieldIsReady()) game = game.game();

      player.set({ eventData: { dice: null } });
      player.removeEventWithTriggerListener();
    },
    TRIGGER: function ({ target: dice }) {
      const { game, player } = this.eventContext();
      const zoneParent = dice.findParent({ className: 'Zone' }).parent(); // plane или bridge
      const playerHand = player.find('Deck[domino]');

      if (zoneParent.eventData.actionsDisabled) {
        lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
          data: { message: zoneParent.eventData.actionsDisabled },
          // config: { hideTime: 3000 },
        });

        const eventData = { dice: {} };
        for (const diceId of Object.keys(player.eventData.dice)) {
          if (zoneParent.get(diceId, { directParent: true })) {
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
    },
    END_ROUND: function () {
      let { game } = this.eventContext();
      if (game.hasSuperGame && game.checkFieldIsReady()) game = game.game();

      if (!this.targetDice) {
        // ищем первый попавшийся dice
        for (const plane of game.decks.table.getAllItems()) {
          for (const dice of plane.select({ className: 'Dice', directParent: false })) {
            this.emit('TRIGGER', { target: dice });
            if (this.targetDice) break;
          }
          if (this.targetDice) break;
        }
      }
      if (!this.targetDice) {
        for (const bridge of game.select('Bridge')) {
          for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
            this.emit('TRIGGER', { target: dice });
            if (this.targetDice) break;
          }
          if (this.targetDice) break;
        }
      }

      this.targetDice?.set({ locked: null });

      this.emit('RESET');
    },
    GAME_FIELD_DISABLED: function ({ game }) {
      let { game: eventGame, player } = this.eventContext();
      if (game === eventGame) return; // следом вызовется END_ROUND из updateRoundStep

      if (player.eventData.dice) {
        const eventData = { dice: {} };
        for (const diceId of Object.keys(player.eventData.dice)) {
          if (game.get(diceId, { directParent: true })) {
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
});
