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
      name: 'initPrepareGameEvents',
      data,
      initPrepareStartFieldStep() {
        const { game } = this.eventContext();
        const player = game.selectNextActivePlayer();
        const hand = player.find('Deck[plane]');
        const deck = game.find('Deck[plane]');

        player.set({ eventData: { plane: null, showNoAvailablePortsBtn: null, fakePlaneAddBtn: null, roundBtn: { label: 'Помочь выложить' } } });

        const eventData = { plane: {} };
        for (let j = 0; j < game.settings.planesToChoose; j++) {
          const plane = deck.getRandomItem();
          if (!plane) continue;
          plane.moveToTarget(hand);
          eventData.plane[plane.id()] = { oneOfMany: true };
        }

        player.set({ eventData });
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
          const eventPlanes = player.eventData.plane || {};
          const hand = player.find('Deck[plane]');
          const handPlanes = hand.getAllItems();
          const planeId = plane.id();

          if (!eventPlanes[planeId]?.mustBePlaced && !eventPlanes[planeId]?.extraPlane) {
            // один из блоков для размещения на выбор - остальные можно убрать
            const planes = handPlanes.filter((plane) => {
              const planeData = eventPlanes[plane.id()];
              return !planeData?.mustBePlaced && !planeData?.extraPlane;
            });
            for (const plane of planes) {
              plane.moveToTarget(deck);
            }
          }

          if (eventPlanes[planeId]?.extraPlane) {
            const eventData = { plane: {} };
            eventData.plane[planeId] = { extraPlane: null };

            // дополнительные блоки не обязательны к размещению - убираем из руки, чтобы не мешались
            const planes = handPlanes.filter((p) => eventPlanes[p.id()]?.extraPlane);
            for (const plane of planes) {
              plane.moveToTarget(deck);
              eventData.plane[plane.id()] = { extraPlane: null };
            }

            player.set({ eventData });
          } else if (eventPlanes[planeId]?.oneOfMany) {
            const eventData = { plane: {} };
            eventData.plane[planeId] = { oneOfMany: null };

            // убираем остальные блоки из группы "один из многих"
            const planes = handPlanes.filter((p) => eventPlanes[p.id()]?.oneOfMany);
            for (const plane of planes) {
              plane.moveToTarget(deck);
              eventData.plane[plane.id()] = { oneOfMany: null };
            }

            player.set({ eventData });
          }

          const remainPlanes = hand.getAllItems().find((p) => !eventPlanes[p.id()]?.extraPlane && !eventPlanes[p.id()]?.oneOfMany);
          if (remainPlanes) {
            // еще остались обязательные к размещению блоки
            this.emit('NO_AVAILABLE_PORTS');
            return { preventListenerRemove: true };
          }

          player.deactivate();
          player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null, plane: null } });
          hand.moveAllItems({ target: deck });

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
          const { game, player } = this.eventContext();
          const deck = game.find('Deck[plane]');

          for (const player of game.players()) {
            player.find('Deck[plane]').moveAllItems({ target: deck });
          }

          player.set({ eventData: { roundBtn: null } })
          game.set({ availablePorts: [] });

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
