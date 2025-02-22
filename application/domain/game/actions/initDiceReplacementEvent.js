(function ({ dice }) {
  const eventName = 'diceReplacementEvent';
  let event = this.eventData.activeEvents.find((e) => e.name === eventName);

  if (!event) {
    event = this.initEvent(
      {
        name: eventName,
        deletedDices: new Set(),
        placedDices: new Set(),
        possibleReleases: new Map(),
        savedRotations: new Map(),
        addDeletedDice(dice) {
          const { deletedDices, savedRotations } = this;

          dice.set({ deleted: true });
          deletedDices.add(dice);

          const observeDices = [dice, ...dice.getNearestDices()];
          for (const dice of observeDices) {
            if (savedRotations.has(dice)) continue;
            savedRotations.set(dice, dice.getRotation());
          }
        },
        handlers: {
          DICE_PLACED: function ({ dice, initPlayer: player }) {
            const { game } = this.eventContext();
            const { deletedDices, placedDices, possibleReleases } = this;
            const deck = game.find('Deck[domino]');

            if (
              deletedDices.has(dice) // восстановление удаленной dice
            ) {
              deletedDices.delete(dice);
              dice.set({ deleted: null });
            } else {
              placedDices.add(dice);
            }

            possibleReleases.set(dice.parent().parent(), player);

            const notReplacedDeletedDices = [...deletedDices].filter((d) => !d.parent().getItem());
            if (notReplacedDeletedDices.length > 0) {
              // не все удаленные dice заменены
              return { preventListenerRemove: true };
            }

            for (const dice of deletedDices) dice.moveToDeck();

            for (const [plane, player] of possibleReleases) {
              game.checkForRelease({ plane, player });
            }

            this.emit('RESET');
          },
          DICE_RESTORE_NOT_AVAILABLE: function ({ msg = '' }) {
            // при любом подозрении на ошибку с размещением костяшки восстанавливаем исходное состояние стола

            const { game, player } = this.eventContext();
            const { deletedDices, placedDices, savedRotations } = this;
            const playerHand = player.find('Deck[domino]');

            // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
            for (const dice of deletedDices) {
              dice.set({ deleted: null });
              dice.parent().updateValues();
            }

            // уже успели заменить часть из удаленных dice - возвращаем все в руку
            for (const dice of placedDices) {
              dice.moveToTarget(playerHand);
            }

            // восстанавливаем положение повернутых dice
            for (const [dice, rotation] of savedRotations) {
              if (dice.getRotation() !== rotation) dice.rotate();
            }

            if (msg) {
              game.logs({ msg, userId: player.userId });
              lib.store.broadcaster.publishAction(`user-${player.userId}`, 'broadcastToSessions', {
                data: { message: msg },
                config: { hideTime: 0 },
              });
            }
            game.logs({
              msg:
                `Найдены удаленные, но не замененные костяшки. Вся группа удаленных костяшек была восстановлена.` +
                (placedDices.size > 0
                  ? ` Уже размещенные костяшки, были возвращены обратно в руку игрока {{player}}.`
                  : ''),
              userId: player.userId,
            });

            this.emit('RESET');
          },
          END_ROUND: function () {
            const { game, player } = this.eventContext();

            if (game.status !== 'IN_PROCESS') return; // ??? тут конец игры

            if (this.deletedDices.size > 0) return this.emit('DICE_RESTORE_NOT_AVAILABLE');

            this.emit('RESET');
          },
        },
      },
      {
        allowedPlayers: this.hasSuperGame ? this.game().players() : this.players(),
      }
    );
  }

  event.addDeletedDice(dice);
});
