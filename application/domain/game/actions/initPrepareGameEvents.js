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

        player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null, roundBtn: { label: 'Помочь выложить' } } });

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

          const eventData = { plane: {} };

          if (eventPlanes[planeId]?.extraPlane) {
            eventData.plane[planeId] = { extraPlane: null };

            // дополнительные блоки не обязательны к размещению - убираем из руки, чтобы не мешались
            const planes = handPlanes.filter((p) => eventPlanes[p.id()]?.extraPlane);
            for (const plane of planes) {
              plane.moveToTarget(deck);
              eventData.plane[plane.id()] = { extraPlane: null };
            }

          } else if (eventPlanes[planeId]?.oneOfMany) {
            eventData.plane[planeId] = { oneOfMany: null };

            // убираем остальные блоки из группы "один из многих"
            const planes = handPlanes.filter((p) => eventPlanes[p.id()]?.oneOfMany);
            for (const plane of planes) {
              plane.moveToTarget(deck);
              eventData.plane[plane.id()] = { oneOfMany: null };
            }

          }
          player.set({ eventData });

          const remainPlanes = hand.getAllItems().find((p) => !eventPlanes[p.id()]?.extraPlane && !eventPlanes[p.id()]?.oneOfMany);
          if (remainPlanes) {
            // еще остались обязательные к размещению блоки
            this.emit('NO_AVAILABLE_PORTS');
            return { preventListenerRemove: true };
          }

          player.deactivate();
          player.set({ eventData: { showNoAvailablePortsBtn: null, fakePlaneAddBtn: null } });
          hand.moveAllItems({ target: deck });

          if (game.settings.planesNeedToStart > game.decks.table.itemsCount()) {
            this.initPrepareStartFieldStep();
            return { preventListenerRemove: true };
          }

          if (!this.addPlaneRecursiveMode) {
            this.emit('RESET');
            game.run('startGame');
            return;
          }
          return { preventListenerRemove: true };
        },

        ADD_PLANE_RECURSIVE_STARTED() {
          // без этого события не решить, т.к. ADD_PLANE будет частью рекурсии, которая заберет в обработку plane-ы, добавленные в playRoundStartCards
          this.addPlaneRecursiveMode = true;
        },
        ADD_PLANE_RECURSIVE_ENDED() {
          const { game } = this.eventContext();
          if (game.settings.planesNeedToStart > game.decks.table.itemsCount()) return { preventListenerRemove: true };

          this.emit('RESET');
          game.run('startGame');
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

          game.set({ availablePorts: [] });

          for (const player of game.players()) {
            player.set({ eventData: { roundBtn: null } })
            player.removeEventWithTriggerListener();

            if (!player.eventData.plane) continue;

            const eventData = { plane: {} };
            for (const [planeId, { initPlane }] of Object.entries(player.eventData.plane)) {
              if (!initPlane) continue; // возможно тут будут plane-ы, добавленные картами событий, иницированными на старте раунда (pilot, req_*)
              player.get(planeId).moveToTarget(deck);
              eventData.plane[planeId] = { oneOfMany: null };
            }
            player.set({ eventData }); // не удаляем через {eventData: {plane: null}}, потому что при авторозыгрыше dream на фронт придет {selectable: true}, а об {oneOfMany: null} он не узнает
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
