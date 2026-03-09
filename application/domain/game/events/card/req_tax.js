() => {
  const event = domain.game.events.common.putPlaneFromHand();

  event.tutorial = {
    text: 'Игрок добавляет на игровое поле дополнительный блок-интеграцию. Заполнение этого блока инициирует событие РЕЛИЗ.',
  };

  event.init = function () {
    const { game, player, source: card } = this.eventContext();

    const plane = game.addCardPlane(card);
    plane.set({ visible: true }); // чтобы на фронт приходил не фейковый id, и в интерфейсы отображалась корректная карта
    plane.moveToTarget(player.find('Deck[plane]'));

    player.set({
      eventData: { plane: { [plane.id()]: { mustBePlaced: true } } },
    });

    game.run('showPlanePortsAvailability', { joinPlaneId: plane.id() }, player);
  };

  return event;
};
