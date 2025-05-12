() => ({
  name: 'diceReplacementEvent',
  deletedDices: new Set(),
  placedDices: new Map(),
  possibleReleases: new Map(),
  savedRotations: new Map(),
  disabledZoneParents: new Set(),
  addDeletedDice(dice) {
    const { deletedDices, savedRotations } = this;

    dice.set({ deleted: true });
    deletedDices.add(dice);

    const zone = dice.parent();
    this.disableZoneParent(zone.parent());
    if (zone.isBridgeZone()) {
      for (const nearZone of zone.getNearZones()) {
        this.disableZoneParent(nearZone.parent());
      }
    }

    const observeDices = [dice, ...dice.getNearestDices()];
    for (const dice of observeDices) {
      if (savedRotations.has(dice)) continue;
      savedRotations.set(dice, dice.getRotation());
    }
  },
  disableZoneParent(parent) {
    this.disabledZoneParents.add(parent);
  },
  handlers: {
    TRIGGER: function () {
      // фиктивный handler для срабатывания проверки player.triggerEventEnabled
      return { preventListenerRemove: true };
    },
    DICE_PLACED: function ({ dice, initPlayer: player }) {
      const { game } = this.eventContext();
      const { deletedDices, placedDices, possibleReleases, disabledZoneParents } = this;

      if (
        deletedDices.has(dice) // восстановление удаленной dice
      ) {
        deletedDices.delete(dice);
        dice.set({ deleted: null });
      } else {
        placedDices.set(dice, player);
      }

      const zone = dice.parent();
      possibleReleases.set(zone, player);
      this.disableZoneParent(zone.parent());

      const notReplacedDeletedDices = [...deletedDices].filter((d) => !d.parent().getItem());
      if (notReplacedDeletedDices.length > 0) {
        // не все удаленные dice заменены
        return { preventListenerRemove: true };
      }

      for (const dice of deletedDices) dice.moveToDeck();

      for (const [zone, player] of possibleReleases) {
        const zoneParent = zone.parent();
        game.checkForRelease({ zoneParent, player });
      }

      // убираем блокировку на действия с plane/bridge
      for (const zoneParent of disabledZoneParents) {
        zoneParent.set({ eventData: { actionsDisabled: null } });
      }

      this.emit('RESET');
    },
    DICE_RESTORE_NOT_AVAILABLE: function ({ msg = '', initPlayer: player }) {
      // при любом подозрении на ошибку с размещением костяшки восстанавливаем исходное состояние стола

      const { game } = this.eventContext();
      const { deletedDices, placedDices, savedRotations, disabledZoneParents } = this;

      // если есть временно удаленные dice, то восстанавливаем состояние до их удаления
      for (const dice of deletedDices) {
        dice.set({ deleted: null });
        const zone = dice.parent();
        zone.updateValues();
      }

      // уже успели заменить часть из удаленных dice - возвращаем все в руку
      for (const [dice, player] of placedDices.entries()) {
        dice.moveToTarget(player.find('Deck[domino]'));
      }

      // восстанавливаем положение повернутых dice
      for (const [dice, rotation] of savedRotations) {
        if (dice.getRotation() !== rotation) dice.rotate();
      }

      // убираем блокировку на действия с plane/bridge
      for (const zoneParent of disabledZoneParents) {
        zoneParent.set({ eventData: { actionsDisabled: null } });
      }

      if (msg) {
        game.logs({ msg, userId: player.userId });
        lib.store.broadcaster.publishAction(`gameuser-${player.userId}`, 'broadcastToSessions', {
          data: { message: msg },
          config: { hideTime: 0 },
        });
      }
      game.logs({
        msg:
          `Найдены удаленные, но не замененные костяшки. Вся группа удаленных костяшек была восстановлена.` +
          (placedDices.size > 0 ? ` Уже размещенные костяшки, были возвращены обратно в руку игрока {{player}}.` : ''),
        userId: player.userId,
      });

      this.emit('RESET');
    },
    END_ROUND: function () {
      const { game, player } = this.eventContext();

      if (game.status !== 'IN_PROCESS') return; // ??? тут конец игры

      if (this.deletedDices.size > 0) return this.emit('DICE_RESTORE_NOT_AVAILABLE', {}, player);

      this.emit('RESET');
    },
  },
});
