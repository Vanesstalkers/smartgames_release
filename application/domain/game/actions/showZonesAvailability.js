(function ({ diceId }) {
  const player = this.roundActivePlayer();
  if (player.triggerEventEnabled())
    throw new Error('Игрок не может совершить это действие, пока не завершит активное событие.');

  const dice = this.get(diceId);
  const currentZone = dice.getParent();
  const availableZones = [];

  this.disableChanges();
  {
    // чтобы не мешать расчету для соседних зон при перемещении из одной зоны в другую (ниже вернем состояние)
    const deletedDices = this.getDeletedDices();
    for (const dice of deletedDices) dice.getParent().removeItem(dice);

    for (const { zone, status: zoneAvailable } of dice.findAvailableZones()) {
      if (zone === currentZone) continue;
      if (!zoneAvailable) continue;
      availableZones.push(zone._id);
    }

    // восстанавливаем состояние для ранее удаленного dice (без force сработает правило обязательности заполнения прилегающих зон для bridge)
    for (const dice of deletedDices) dice.getParent().addItem(dice, { force: true });
  }
  this.enableChanges();

  player.set({ eventData: { availableZones } });
});
