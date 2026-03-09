(function event() {
  const event = domain.game.events.card.transfer();

  event.tutorial.text += '<br><a>Можно применять к игрокам любой команды</a>';

  event.init = function () {
    const { game, player } = this.eventContext();
    const superGame = game.hasSuperGame ? game.game() : game;

    const eventData = { player: {}, game: {} };
    for (const player of superGame.players()) {
      eventData.player[player.id()] = { selectable: true };

      const playerGame = player.game();
      if (playerGame !== game) eventData.game[playerGame.id()] = { highlight: true };
    }
    player.set({ eventData });
  };

  event.handlers['TRIGGER'] = function ({ target: targetPlayer }) {
    const playerGame = targetPlayer.game();
    const playerHand = targetPlayer.getHandDominoDeck();
    const gameDeck = playerGame.find('Deck[domino]');
    const count = playerHand.itemsCount();

    playerGame.logs({
      msg: `Игрок {{player}} стал целью события <a>${this.getTitle()}</a>.`,
      userId: targetPlayer.userId,
    });

    playerHand.moveAllItems({ target: gameDeck });
    gameDeck.moveRandomItems({ count, target: playerHand });

    this.emit('RESET');
  };

  return event;
});
