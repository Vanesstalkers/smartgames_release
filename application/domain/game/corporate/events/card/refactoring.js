() => {
  const {
    init,
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
      RESET,
      DEACTIVATE,
      END_ROUND,
      TRIGGER: function ({ target: dice }) {
        const { game: eventGame, player } = this.eventContext();
        const zoneParent = dice.findParent({ className: 'Zone' }).parent(); // plane или bridge
        const game = zoneParent.game();
        const playerHand = player.find('Deck[domino]');

        const fieldIsBlocked = game.fieldIsBlocked();
        if (fieldIsBlocked || zoneParent.eventData.actionsDisabled) {
          lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
            data: { message: zoneParent.eventData.actionsDisabled },
            // config: { hideTime: 3000 },
          });

          const parent = fieldIsBlocked ? game : zoneParent.eventData.actionsDisabled;

          const eventData = { dice: {} };
          for (const diceId of Object.keys(player.eventData.dice)) {
            if (parent.get(diceId, { directParent: true })) {
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
        eventGame.removeEventListener({ handler: 'GAME_FIELD_DISABLED', eventToRemove: this }); // пока раунд не завершен этот handler могут вызвать события, например удаление костяшки
      },
      GAME_FIELD_DISABLED: function ({ game, zoneParent }) {
        const { game: eventGame, player } = this.eventContext();
        if (game === eventGame) return; // тут roundReady, следом вызовется END_ROUND из updateRoundStep

        if (player.eventData.dice) {
          if (!zoneParent) zoneParent = game;

          const eventData = { dice: {} };
          for (const diceId of Object.keys(player.eventData.dice)) {
            if (zoneParent.get(diceId, { directParent: true })) {
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

        // () => ({
        //   init: function () {
        //     let { game: eventGame, player } = this.eventContext();
        //     let planes = eventGame.decks.table.select('Plane');
        //     let bridges = eventGame.select('Bridge');

        //     if (eventGame.hasSuperGame || (eventGame.isSuperGame && !eventGame.allGamesMerged())) {
        //       const games = eventGame.isSuperGame
        //         ? eventGame.getAllGames().filter((g) => !g.merged)
        //         : eventGame.game().getAllGames();
        //       planes = [];
        //       bridges = [];
        //       for (const game of games) {
        //         if (game.fieldIsBlocked()) continue;

        //         // if (game !== eventGame) {
        //         //   this.relatedGames.add(game);
        //         //   game.relatedEvents({ add: this });
        //         // }

        //         planes.push(...game.decks.table.getAllItems());
        //         bridges.push(...game.select('Bridge'));
        //       }
        //     }

        //     const eventData = { dice: {} };
        //     let diceFound = false;
        //     for (const plane of planes) {
        //       for (const dice of plane.select({ className: 'Dice', directParent: false })) {
        //         eventData.dice[dice.id()] = { selectable: true };
        //         diceFound = true;
        //       }
        //     }
        //     for (const bridge of bridges) {
        //       for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
        //         eventData.dice[dice.id()] = { selectable: true };
        //         diceFound = true;
        //       }
        //     }

        //     if (!diceFound) return { resetEvent: true };

        //     player.set({ eventData });
        //   },
        //   handlers: {
        //     RESET: function () {
        //       this.emit('DEACTIVATE');
        //       this.destroy();
        //     },
        //     DEACTIVATE: function () {
        //       const { player } = this.eventContext();

        //       player.set({ eventData: { dice: null } });
        //       player.removeEventWithTriggerListener();
        //     },
        //     TRIGGER: function ({ target: dice }) {
        //       const { game, player } = this.eventContext();
        //       const zoneParent = dice.findParent({ className: 'Zone' }).parent(); // plane или bridge
        //       const playerHand = player.find('Deck[domino]');

        //       if (zoneParent.eventData.actionsDisabled) {
        //         lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
        //           data: { message: zoneParent.eventData.actionsDisabled },
        //           // config: { hideTime: 3000 },
        //         });

        //         const eventData = { dice: {} };
        //         for (const diceId of Object.keys(player.eventData.dice)) {
        //           if (zoneParent.get(diceId, { directParent: true })) {
        //             eventData.dice[diceId] = null;
        //           }
        //         }
        //         player.set({ eventData });

        //         if (Object.keys(player.eventData.dice).length === 0) {
        //           return this.emit('RESET');
        //         } else {
        //           return { preventListenerRemove: true };
        //         }
        //       }

        //       dice.moveToTarget(playerHand);
        //       dice.set({ visible: true, locked: true });
        //       zoneParent.set({ release: null });

        //       game.logs({
        //         msg: `Игрок {{player}} забрал со стола костяшку "${dice.getTitle()}".`,
        //         userId: player.userId,
        //       });

        //       this.targetDice = dice;
        //       this.emit('DEACTIVATE'); // не удаляем событие, чтобы в конце раунда снялся locked-флаг
        //     },
        //     END_ROUND: function () {
        //       let { game } = this.eventContext();
        //       if (game.hasSuperGame && game.checkFieldIsReady()) game = game.game();

        //       if (!this.targetDice) {
        //         // ищем первый попавшийся dice
        //         for (const plane of game.decks.table.getAllItems()) {
        //           for (const dice of plane.select({ className: 'Dice', directParent: false })) {
        //             this.emit('TRIGGER', { target: dice });
        //             if (this.targetDice) break;
        //           }
        //           if (this.targetDice) break;
        //         }
        //       }
        //       if (!this.targetDice) {
        //         for (const bridge of game.select('Bridge')) {
        //           for (const dice of bridge.select({ className: 'Dice', directParent: false })) {
        //             this.emit('TRIGGER', { target: dice });
        //             if (this.targetDice) break;
        //           }
        //           if (this.targetDice) break;
        //         }
        //       }

        //       this.targetDice?.set({ locked: null });

        //       this.emit('RESET');
        //     },
        //     GAME_FIELD_DISABLED: function ({ game }) {
        //       let { game: eventGame, player } = this.eventContext();
        //       if (game === eventGame) return; // следом вызовется END_ROUND из updateRoundStep

        //       if (player.eventData.dice) {
        //         const eventData = { dice: {} };
        //         for (const diceId of Object.keys(player.eventData.dice)) {
        //           if (game.get(diceId, { directParent: true })) {
        //             eventData.dice[diceId] = null;
        //           }
        //         }
        //         player.set({ eventData });
        //       }

        //       if (Object.keys(player.eventData.dice).length === 0) {
        //         return this.emit('RESET');
        //       } else {
        //         return { preventListenerRemove: true };
        //       }
        //     },
        //   },
        // });
      },
    },
  };
};
