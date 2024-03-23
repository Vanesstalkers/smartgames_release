<template>
  <game :gamePlaneScaleMin="0.3" :gamePlaneScaleMax="1">
    <template #gameplane="{ game = {}, gamePlaneScale } = {}">
      <plane v-for="id in Object.keys(game.planeMap)" :key="id" :planeId="id" :gamePlaneScale="gamePlaneScale" />
      <!-- bridgeMap может не быть на старте игры при формировании поля с нуля -->
      <bridge v-for="id in Object.keys(game.bridgeMap || {})" :key="id" :bridgeId="id" />

      <div
        v-for="position in possibleAddPlanePositions"
        :key="position.joinPortId + position.joinPortDirect + position.targetPortId + position.targetPortDirect"
        :joinPortId="position.joinPortId"
        :joinPortDirect="position.joinPortDirect"
        :targetPortId="position.targetPortId"
        :targetPortDirect="position.targetPortDirect"
        :style="position.style"
        class="fake-plane"
        v-on:click="putPlaneOnField"
      />
    </template>

    <template #gameinfo="{} = {}">
      <div class="wrapper">
        <div class="game-status-label">
          Бюджет <span style="color: gold">{{ fullPrice }}k</span> {{ game.statusLabel }}
        </div>
        <div v-for="deck in deckList" :key="deck._id" class="deck" :code="deck.code">
          <div v-if="deck._id && deck.code === 'Deck[domino]'" class="hat" v-on:click="takeDice">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card]'" class="card-event" v-on:click="takeCard">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_drop]'" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === 'Deck[card_active]'" class="deck-active">
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
        :showControls="false"
      />
    </template>
  </game>
</template>

<script>
import { provide, reactive } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import Game from '~/lib/game/front/Game.vue';
import card from '~/lib/game/front/components/card.vue';

import player from './components/player.vue';
import plane from './components/plane.vue';
import bridge from './components/bridge.vue';

export default {
  components: {
    Game,
    player,
    card,
    plane,
    bridge,
  },
  props: {},
  setup() {
    const gameGlobals = prepareGameGlobals();

    Object.assign(gameGlobals, {
      zoneAvailable(zoneId) {
        return (this.getStore().player?.[this.gameState.sessionPlayerId]?.availableZones || []).includes(zoneId);
      },
      hideZonesAvailability() {
        if (this.gameState.viewerMode) return;
        this.getStore().player[this.gameState.sessionPlayerId].availableZones = [];
      },
      calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
        const p = {};
        const gamePlane = document.getElementById('gamePlane');
        if (gamePlane instanceof HTMLElement) {
          const gamePlaneRect = gamePlane.getBoundingClientRect();

          gamePlane.querySelectorAll('.plane, .fake-plane').forEach((plane) => {
            const rect = plane.getBoundingClientRect();
            const offsetTop = rect.top - gamePlaneRect.top;
            const offsetLeft = rect.left - gamePlaneRect.left;

            if (p.t == undefined || rect.top < p.t) p.t = rect.top;
            if (p.b == undefined || rect.bottom > p.b) p.b = rect.bottom;
            if (p.l == undefined || rect.left < p.l) p.l = rect.left;
            if (p.r == undefined || rect.right > p.r) p.r = rect.right;

            if (p.ot == undefined || offsetTop < p.ot) p.ot = offsetTop;
            if (p.ol == undefined || offsetLeft < p.ol) p.ol = offsetLeft;
          });

          const planePadding = 300;
          return {
            height: planePadding + (p.b - p.t) / gamePlaneScale + 'px',
            width: planePadding + (p.r - p.l) / gamePlaneScale + 'px',
            top: 'calc(50% - ' + ((p.b - p.t) / 2 + p.ot * 1) + 'px)',
            left: `calc(${isMobile ? '65%' : '50%'} - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
          };
        }
      },
    });

    gameGlobals.gameCustom = reactive({
      pickedDiceId: '',
      selectedDiceSideId: '',
      selectedCard: '',
    });
    provide('gameGlobals', gameGlobals);

    return gameGlobals;
  },
  watch: {
    gameDataLoaded: function () {
      // тут ловим обновление страницы
      this.hideZonesAvailability();
    },
    'game.eventListeners.TRIGGER': function () {
      this.gameCustom.pickedDiceId = '';
      this.hideZonesAvailability();
    },
    // 'game.availablePorts': function (newValue, oldValue) {
    //   if (newValue?.length > 0 || oldValue?.length > 0) this.updatePlaneScale();
    // },
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
    showPlayerControls() {
      return this.game.status === 'IN_PROCESS';
    },
    playerIds() {
      const ids = Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      if (this.gameState.viewerMode) return ids;
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx));
      return result;
    },
    sessionPlayer() {
      return this.store.player?.[this.gameState.sessionPlayerId] || {};
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
      const baseSum = Object.keys(this.game.planeMap)
        .map((planeId) => this.store.plane?.[planeId] || {})
        .reduce((sum, plane) => sum + plane.price, 0);
      const timerMod = 30 / gameTimer;
      const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[gameConfig];
      return Math.floor(baseSum * timerMod * configMod);
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
    activeCards() {
      return this.deckList.find((deck) => deck.subtype === 'active') || {};
    },

    possibleAddPlanePositions() {
      if (!this.sessionPlayerIsActive()) return [];
      return (this.game.availablePorts || []).map(
        ({ joinPortId, joinPortDirect, targetPortId, targetPortDirect, position }) => {
          return {
            joinPortId,
            joinPortDirect,
            targetPortId,
            targetPortDirect,
            style: {
              left: position.left + 'px',
              top: position.top + 'px',
              width: position.right - position.left + 'px',
              height: position.bottom - position.top + 'px',
            },
          };
        }
      );
    },
  },
  methods: {
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
    async putPlaneOnField(event) {
      await this.handleGameApi({
        name: 'putPlaneOnField',
        data: {
          gameId: this.gameState.gameId,
          joinPortId: event.target.attributes.joinPortId.value,
          targetPortId: event.target.attributes.targetPortId.value,
          joinPortDirect: event.target.attributes.joinPortDirect.value,
          targetPortDirect: event.target.attributes.targetPortDirect.value,
        },
      });
    },
  },
};
</script>
<style>
#gamePlane {
  transform-origin: left top !important;
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
  background: url(assets/dominoes.png);
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
}

.deck[code='Deck[card_active]'] .card-event {
  margin-top: -135px;
}
.deck[code='Deck[card_active]'] .card-event:first-child {
  margin-top: 0px !important;
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
#game.mobile-view .game-status-label {
  font-size: 1.5em;
}

.plane {
  position: absolute;
  transform-origin: 0 0;
}
.plane.card-event {
  display: block;
}

.fake-plane {
  position: absolute;
  background: red;
  border: 1px solid;
  opacity: 0.5;
}
.fake-plane:hover {
  opacity: 0.8;
  z-index: 1;
}
</style>
