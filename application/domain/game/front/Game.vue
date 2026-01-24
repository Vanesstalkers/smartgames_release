<template>
  <game :debug="false">
    <template #helper-guru="{ menuWrapper, menuButtonsMap } = {}">
      <tutorial :game="game" class="scroll-off" :customMenu="customMenu({ menuWrapper, menuButtonsMap })" />
    </template>

    <template #gameplane="{} = {}">
      <div :class="['gp-content']" :style="{ ...gamePlaneContentControlStyle }">
        <plane v-for="id in Object.keys(tablePlanes.itemMap)" :key="id" :planeId="id" />
        <!-- bridgeMap может не быть на старте игры при формировании поля с нуля -->
        <bridge v-for="id in Object.keys(game.bridgeMap || {})" :key="id" :bridgeId="id" />

        <div v-for="positions in possibleAddPlanePositions" :key="JSON.stringify(positions)">
          <div
            v-for="position in positions"
            :key="position.joinPortId + position.joinPortDirect + position.targetPortId + position.targetPortDirect"
            :joinPortId="position.joinPortId"
            :joinPortDirect="position.joinPortDirect"
            :targetPortId="position.targetPortId"
            :targetPortDirect="position.targetPortDirect"
            :style="position.style"
            :class="['fake-plane', position.code === selectedFakePlanePosition ? 'hidden' : '']"
            @click="previewPlaneOnField($event, position)"
            @mouseenter="zIndexDecrease($event, position.code)"
            @mouseleave="zIndexRestore($event, position.code)"
          />
        </div>

        <plane
          v-for="[_id, style] of Object.entries(gameCustom.selectedFakePlanes)"
          :key="_id + '_preview'"
          :planeId="_id"
          :viewStyle="style"
          :class="['preview']"
        />
      </div>
    </template>

    <template #gameinfo="{} = {}">
      <div class="wrapper">
        <div class="game-status-label">
          Бюджет
          <span style="color: gold">{{ fullPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }}k ₽</span>
          {{ statusLabel }}
        </div>
        <div v-for="deck in deckList" :key="deck._id" class="deck" :code="deck.code">
          <div v-if="deck._id && deck.code === 'Deck[domino]'" class="hat" v-on:click="takeDice">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div
            v-if="deck._id && deck.code === 'Deck[card]'"
            class="card-event"
            :style="cardEventCustomStyle"
            v-on:click="takeCard"
          >
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_drop]'" class="card-event" :style="cardEventCustomStyle">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="showPlayerControls && deck._id && deck.code === 'Deck[card_active]'" class="deck-active">
            <!-- активная карта всегда первая - для верстки она должна стать последней -->
            <card
              v-for="{ _id, played } in sortedActiveCards(Object.keys(deck.itemMap))"
              :key="_id"
              :cardId="_id"
              :canPlay="!played && sessionPlayerIsActive()"
            />
          </div>
        </div>
      </div>
    </template>

    <template #player="{} = {}">
      <player
        :playerId="gameState.sessionPlayerId"
        :viewerId="gameState.sessionViewerId"
        :customClass="[`scale-${state.guiScale}`]"
        :iam="true"
        :showControls="showPlayerControls"
      />
    </template>
    <template #opponents="{} = {}">
      <player
        v-for="(id, index) in playerIds"
        :key="id"
        :playerId="id"
        :customClass="[`idx-${index}`]"
        :showControls="true"
      />
    </template>
  </game>
</template>

<script>
import { provide, reactive } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import releaseGameGlobals, { gameCustomArgs } from '~/domain/game/front/releaseGameGlobals.mjs';
import Game from '~/lib/game/front/Game.vue';
import tutorial from '~/lib/helper/front/helper.vue';

import card from './components/card.vue';
import player from './components/player.vue';
import plane from './components/plane.vue';
import bridge from './components/bridge.vue';

export default {
  components: {
    Game,
    player,
    card,
    tutorial,
    plane,
    bridge,
  },
  props: {},
  data() {
    return {
      selectedFakePlanePosition: '',
      zIndexDecreaseChangeTimeout: null,
    };
  },
  setup() {
    const gameGlobals = prepareGameGlobals({
      defaultDeviceOffset: 300,
      gameCustomArgs: {
        ...gameCustomArgs,
      },
    });

    Object.assign(gameGlobals, releaseGameGlobals);
    provide('gameGlobals', gameGlobals);
    return gameGlobals;
  },
  watch: {
    'player.eventData.triggerListenerEnabled': function () {
      this.gameCustom.pickedDiceId = '';
      if (
        this.gameDataLoaded // gameDataLoaded может не быть при restoreForced
      ) {
        this.hideZonesAvailability();
      }
    },
    'player.eventData.availablePorts': function (ports) {
      if(!ports.length) return;

      this.$nextTick(() => {
        this.state.gamePlaneNeedUpdate = true;
        this.selectedFakePlanePosition = '';
        this.gameState.cardWorkerAction = {};
        this.gameCustom.selectedFakePlanes = {};

        if (this.sessionPlayer().eventData.showNoAvailablePortsBtn && !this.gameFinished()) {
          this.gameState.cardWorkerAction = {
            show: true,
            label: 'Помочь выложить',
            style: { background: '#ffa500' },
            sendApiData: {
              path: 'game.api.action',
              args: [{ name: 'putPlaneOnFieldRecursive', data: { fromHand: true } }],
            },
          };
        } else {
          this.gameState.cardWorkerAction = null;
        }
      });
    },
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore() || {};
    },
    game() {
      return this.getGame();
    },
    gameDataLoaded() {
      return this.game.addTime;
    },
    player() {
      return this.store.player?.[this.gameState.sessionPlayerId] || {};
    },

    restoringGameState() {
      return this.game.status === 'RESTORING_GAME';
    },
    statusLabel() {
      return this.restoringGameState ? 'Восстановление игры' : this.game.statusLabel;
    },

    gamePlaneContentControlStyle() {
      const transformOrigin = this.gameCustom.gamePlaneTransformOrigin[this.gameState.gameId] ?? 'center center';
      const transform = [
        //
        `rotate(${this.gameCustom.gamePlaneRotation || 0}deg)`,
      ].join(' ');
      return { transform, transformOrigin };
    },

    showPlayerControls() {
      return ['IN_PROCESS', 'PREPARE_START'].includes(this.game.status);
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
    },
    sessionUserCardDeckLength() {
      return (
        Object.keys(
          Object.keys(this.sessionPlayer.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'card' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },

    fullPrice() {
      const { gameTimer, gameConfig } = this.game;
      const baseSum = Object.keys(this.tablePlanes.itemMap)
        .map((planeId) => this.store.plane?.[planeId] || {})
        .reduce((sum, plane) => sum + plane.price, 0);
      const timerMod = 30 / gameTimer;
      const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[gameConfig];
      return Math.floor(baseSum * timerMod * configMod);
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
    tablePlanes() {
      return this.deckList.find((deck) => deck.subtype === 'table') || {};
    },
    activeCards() {
      return this.deckList.find((deck) => deck.subtype === 'active') || {};
    },

    possibleAddPlanePositions() {
      if (!this.sessionPlayerIsActive()) return [];
      const availablePorts = this.sessionPlayer().eventData.availablePorts || [];
      return availablePorts.map(
        ({ gameId, joinPlaneId, joinPortId, joinPortDirect, targetPortId, targetPortDirect, position }) => {
          return [
            {
              code: joinPortId + joinPortDirect + targetPortId + targetPortDirect,
              ...{ gameId, joinPlaneId, joinPortId, joinPortDirect, targetPortId, targetPortDirect },
              style: {
                left: position.left + 'px',
                top: position.top + 'px',
                width: position.right - position.left + 'px',
                height: position.bottom - position.top + 'px',
                rotation: position.rotation,
              },
            },
          ];
        }
      );
    },

    cardEventCustomStyle() {
      const {
        state: { serverOrigin },
        game,
      } = this;

      const rootPath = `${serverOrigin}/img/cards/${game.templates.card}`;
      return {
        backgroundImage: `url(${rootPath}/back-side.jpg)`,
      };
    },
  },
  methods: {
    customMenu({ menuWrapper, menuButtonsMap } = {}) {
      if (!menuButtonsMap) return [];

      const { cancel, restore, tutorials, helperLinks, leave } = menuButtonsMap();
      const fillTutorials = tutorials({
        showList: [
          { title: 'Стартовое приветствие игры', action: { tutorial: 'game-tutorial-start' } },
          { title: 'Управление игровым полем', action: { tutorial: 'game-tutorial-gamePlane' } },
        ],
      });

      return menuWrapper({
        buttons: [cancel(), restore(), fillTutorials, helperLinks({ inGame: true }), leave()],
      });
    },
    sortedActiveCards(arr) {
      return arr
        .map((id) => this.store.card?.[id] || {})
        .sort((a, b) => (a.played > b.played ? 1 : -1)) // сортируем по времени сыгрывания
        .sort((a, b) => (a.played ? 0 : 1)); // переносим не сыгранные в конец
    },
    async takeDice() {
      // return;
      await this.handleGameApi({ name: 'takeDice', data: { count: 3 } });
    },
    async takeCard() {
      // return;
      await this.handleGameApi({ name: 'takeCard', data: { count: 5 } });
    },
    async previewPlaneOnField(event, position) {
      const { joinPlaneId, style: previewStyle, code } = position;
      const style = { ...previewStyle };
      switch (style.rotation) {
        case 1:
          style.left = parseInt(style.left) + parseInt(style.width);
          break;
        case 2:
          style.left = parseInt(style.left) + parseInt(style.width);
          style.top = parseInt(style.top) + parseInt(style.height);
          break;
        case 3:
          style.top = parseInt(style.top) + parseInt(style.height);
          break;
      }
      delete style.width;
      delete style.height;

      this.hidePreviewPlanes();
      this.$set(this.gameCustom.selectedFakePlanes, joinPlaneId, style);

      this.gameState.cardWorkerAction = {
        show: true,
        label: 'Сделать выбор',
        style: { background: '#ffa500' },
        sendApiData: {
          path: 'game.api.action',
          args: [
            {
              name: 'putPlaneOnField',
              data: {
                joinPortId: event.target.attributes.joinPortId.value,
                targetPortId: event.target.attributes.targetPortId.value,
                joinPortDirect: event.target.attributes.joinPortDirect.value,
                targetPortDirect: event.target.attributes.targetPortDirect.value,
              },
            },
          ],
        },
      };

      this.selectedFakePlanePosition = code;
    },
    zIndexDecrease(event) {
      clearTimeout(this.zIndexDecreaseChangeTimeout);

      this.zIndexDecreaseChangeTimeout = setTimeout(() => {
        event.target.classList.add('low-zindex');
      }, 1000);
    },
    zIndexRestore(event) {
      clearTimeout(this.zIndexDecreaseChangeTimeout);
      event.target.classList.remove('low-zindex');
    },
  },
};
</script>
<style lang="scss">
#gamePlane {
  transform-origin: left top !important;
}

#gamePlane .gp-content {
  position: absolute;
}

.deck > .card-event {
  width: 60px;
  height: 90px;
  border: none;
  font-size: 36px;
  display: flex;
  justify-content: center;
  align-content: center;
  color: #ff5900;
  text-shadow: 1px 1px 0 #fff;
  background-image: url(./assets/back-side.jpg);
}

.deck[code='Deck[domino]'] {
  position: absolute;
  top: 35px;
  right: 100px;
  background: url(assets/dices/deck.png);
  background-size: cover;
  padding: 14px;
  cursor: default;
}

.deck[code='Deck[domino]'] > .hat {
  color: white;
  font-size: 36px;
  padding: 14px;
  padding-top: 10px;
  border-radius: 50%;
  color: #ff5900;
  text-shadow: 1px 1px 0px #fff;
}

.deck[code='Deck[card]'] {
  position: absolute;
  top: 35px;
  right: 30px;
  cursor: default;
}

.deck[code='Deck[card_drop]'] {
  position: absolute;
  filter: grayscale(1);
  transform: scale(0.5);
  top: 65px;
  right: -10px;
  cursor: default;
}

.deck[code='Deck[card_drop]'] > .card-event {
  color: #ccc;
}

.deck[code='Deck[card_active]'] {
  position: absolute;
  top: 140px;
  right: 0px;
  display: flex;

  .card-event {
    margin-top: -135px;

    &:first-child {
      margin-top: 0px !important;
    }
  }
}

.deck-active {
  display: flex;
  flex-direction: column;
}

.game-status-label {
  text-align: right;
  color: white;
  font-weight: bold;
  font-size: 2em;
  white-space: nowrap;
  text-shadow: black 1px 0 10px;
}

.plane {
  position: absolute;
  transform-origin: 0 0;
}

.plane.card-event {
  display: block;
  margin: 0px;
}

.plane.preview {
  opacity: 0.5;
}

.fake-plane {
  position: absolute;
  background: #ffa500;
  border: 1px solid;
  opacity: 0.5;

  &:hover {
    opacity: 1;
    z-index: 1;
    cursor: pointer;
  }

  &.low-zindex {
    z-index: -1;
  }

  &.hidden {
    display: none;
  }
}

#game.mobile-view {
  .deck-active {
    flex-direction: row-reverse;
  }

  .deck[code='Deck[card_active]'] {
    .card-event {
      margin-top: 0px;
      margin-left: -75px;
    }
  }

  .game-status-label {
    font-size: 1.5em;
  }
}
</style>
