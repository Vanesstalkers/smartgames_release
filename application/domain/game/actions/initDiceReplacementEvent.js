(function ({ dice }) {
  const eventExists = this.getDeletedDices().length > 0;

  dice.set({ deleted: true });
  if (!dice.rotationsBeforeDelete) dice.rotationsBeforeDelete = {};
  const dices = [dice, ...dice.getNearestDices()];
  for (const nearestDice of dices) {
    const diceId = nearestDice.id();
    if (dice.rotationsBeforeDelete[diceId]) continue;
    dice.rotationsBeforeDelete[diceId] = nearestDice.getRotation();
  }

  const zone = dice.getParent();
  zone.updateValues();

  if (eventExists) return;

  this.initEvent(
    {
      handlers: {
        DICE_PLACED: function () {
          const { game, player } = this.eventContext();
          const deletedDices = game.getDeletedDices();
          const notReplacedDeletedDices = deletedDices.filter((dice) => !dice.getParent().getItem());

          // не все удаленные dice заменены
          if (notReplacedDeletedDices.length > 0) {
            return { preventListenerRemove: true };
          }

          const deck = game.find('Deck[domino]');
          for (const dice of deletedDices) {
            delete dice.rotationsBeforeDelete;
            if (dice.relatedPlacement) delete dice.relatedPlacement;
            dice.set({ deleted: null });
            dice.moveToTarget(deck); // возвращаем удаленные dice в deck
          }

          this.emit('RESET');
        },
        DICE_RESTORE_NOT_AVAILABLE: function ({ msg = '' }) {
          // при любом подозрении на ошибку с размещением костяшки восстанавливаем исходное состояние стола

          const { game, player } = this.eventContext();
          const playerHand = player.find('Deck[domino]');

          // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
          const deletedDices = game.getDeletedDices();
          let restoreAlreadyPlacedDice = false;
          for (const dice of deletedDices) {
            const zone = dice.getParent();

            // уже успели заменить один из удаленных dice - возвращаем его в руку player закончившего ход
            const alreadyPlacedDice = zone.getItem();
            if (alreadyPlacedDice) {
              alreadyPlacedDice.moveToTarget(playerHand);
              restoreAlreadyPlacedDice = true;
            }

            const rotationsBeforeDelete = Object.entries(dice.rotationsBeforeDelete);
            for (const [diceId, rotation] of rotationsBeforeDelete) {
              const dice = game.get(diceId);
              if (dice.getRotation() !== rotation) dice.rotate();
            }

            if (dice.relatedPlacement) {
              for (const relatedDiceId of Object.keys(dice.relatedPlacement)) {
                const relatedDice = game.get(relatedDiceId);
                relatedDice.moveToTarget(playerHand);
              }
              delete dice.relatedPlacement;
            }

            delete dice.rotationsBeforeDelete;
            dice.set({ deleted: null });
            zone.updateValues();
          }

          if (msg) game.logs({ msg, userId: player.userId });
          game.logs({
            msg:
              `Найдены удаленные, но не замененные костяшки. Вся группа удаленных костяшек была восстановлена.` +
              (restoreAlreadyPlacedDice
                ? ` Уже размещенные костяшки, были возвращены обратно в руку игрока {{player}}.`
                : ''),
            userId: player.userId,
          });

          this.emit('RESET');
        },
        END_ROUND: function () {
          const { game, player } = this.eventContext();

          if (game.status !== 'IN_PROCESS') return;

          if (game.getDeletedDices().length) {
            return this.emit('DICE_RESTORE_NOT_AVAILABLE');
          }

          this.emit('RESET');
        },
      },
    },
    { allowedPlayers: this.players() }
  );
});
