(function () {
  const {
    data,
    handlers: {
      //
      NO_AVAILABLE_PORTS,
      TRIGGER,
      TRIGGER_EXTRA_PLANE,
      CHECK_PLANES_IN_HANDS,
    },
  } = domain.game.events.common.putPlaneFromHand();

  const event = this.initEvent(
    {
      data,
      initPrepareStartFieldStep() {
        const { game } = this.eventContext();
        const deck = game.find('Deck[plane]');

        const player = game.selectNextActivePlayer();
        const hand = player.find('Deck[plane]');

        for (let j = 0; j < game.settings.planesToChoose; j++) {
          const plane = deck.getRandomItem();
          if (plane) plane.moveToTarget(hand);
        }

        player.activate();
        lib.timers.timerRestart(game, { time: game.settings.timeToPlaceStartPlane });
      },
      init() {
        const { game } = this.eventContext();
        const {
          settings: { planesAtStart, planesNeedToStart, timeToPlaceStartPlane },
        } = game;

        game.run('putStartPlanes');

        if (planesNeedToStart <= planesAtStart) {
          game.run('startGame');
          return { resetEvent: true };
        }

        game.set({ statusLabel: 'Подготовка к игре', status: 'PREPARE_START' });

        this.initPrepareStartFieldStep();
      },
      handlers: {
        NO_AVAILABLE_PORTS,
        TRIGGER,
        TRIGGER_EXTRA_PLANE,
        CHECK_PLANES_IN_HANDS,
        ADD_PLANE({ target: plane }) {
          const { game } = this.eventContext();
          const deck = game.find('Deck[plane]');
          const player = game.roundActivePlayer();
          const hand = player.find('Deck[plane]');
          const handPlanes = hand.getAllItems();

          if (!plane.eventData.moveToHand && !plane.eventData.extraPlane) {
            // один из блоков для размещения на выбор - остальные можно убрать
            const planes = handPlanes.filter(({ eventData: { moveToHand, extraPlane } }) => !moveToHand && !extraPlane);
            for (const plane of planes) plane.moveToTarget(deck);
          }

          if (plane.eventData.extraPlane) {
            plane.set({ eventData: { extraPlane: null } });

            // дополнительные блоки не обязательны к размещению - убираем из руки, чтобы не мешались
            const planes = handPlanes.filter((plane) => plane.eventData.extraPlane);
            for (const plane of planes) {
              plane.moveToTarget(deck);
              plane.set({ eventData: { extraPlane: null } });
            }
          }

          const remainPlanes = hand.getAllItems().find((plane) => !plane.eventData.extraPlane);
          if (remainPlanes) {
            // еще остались обязательные к размещению блоки
            this.emit('NO_AVAILABLE_PORTS');
            return { preventListenerRemove: true };
          }

          player.deactivate();
          player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null } });
          hand.moveAllItems({ target: deck });
          hand.updateAllItems({
            eventData: { selectable: null, moveToHand: null, extraPlane: null },
          });

          if (game.settings.planesNeedToStart > game.decks.table.itemsCount()) {
            this.initPrepareStartFieldStep();
            return { preventListenerRemove: true };
          }

          this.emit('RESET');

          game.run('startGame');
          return { preventListenerRemove: true }; // без этого удалится обработчик ADD_PLANE из startGame
        },
        // глобальный PLAYER_TIMER_END появится только в initGameProcessEvents
        PLAYER_TIMER_END() {
          this.emit('END_ROUND');
          return { preventListenerRemove: true };
        },
        END_ROUND() {
          const { game, player } = this.eventContext();

          if (game.status === 'FINISHED') return; // чтобы ошибка не зациклилась, если возникли проблемы с выкладыванием стартовых блоков

          game.logs({
            msg: `Блок игрового поля из руки {{player}} размещен автоматически.`,
            userId: player.userId,
          });
          this.emit('CHECK_PLANES_IN_HANDS');
          return { preventListenerRemove: true };
        },
        RESET() {
          const { game } = this.eventContext();
          const deck = game.find('Deck[plane]');

          game.decks.table.updateAllItems({
            eventData: { selectable: null, moveToHand: null, extraPlane: null },
          });

          for (const player of game.players()) {
            const hand = player.find('Deck[plane]');
            hand.updateAllItems({
              eventData: { selectable: null, moveToHand: null, extraPlane: null },
            });
            hand.moveAllItems({ target: deck });
          }

          for (const player of game.players()) {
            player.removeEventWithTriggerListener();
          }
          this.destroy();
        },
      },
    },
    { allowedPlayers: this.players() }
  );

  if (!event) return;

  for (const player of this.players()) {
    player.setEventWithTriggerListener(event);
  }
});
