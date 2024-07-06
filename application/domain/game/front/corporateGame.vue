<template>
  <game :debug="false" :planeScaleMin="0.3" :planeScaleMax="1">
    <template #gameplane="{ gamePlaneControlStyle = {} } = {}">
      <div
        v-for="game in games"
        :key="game.gameId"
        :gameId="game.gameId"
        class="gp"
        :style="{ ...gamePlaneStyle(game.gameId) }"
      >
        <div :class="['gp-content']" :style="{ ...(game.gameId === playerGameId() ? gamePlaneControlStyle : {}) }">
          <plane v-for="id in Object.keys(game.table.itemMap || {})" :key="id" :planeId="id" />
          <!-- bridgeMap может не быть на старте игры при формировании поля с нуля -->
          <bridge v-for="id in Object.keys(game.bridgeMap || {})" :key="id" :bridgeId="id" />

          <div>
            <div
              v-for="position in possibleAddPlanePositions(game)"
              :key="position.joinPortId + position.joinPortDirect + position.targetPortId + position.targetPortDirect"
              :joinPortId="position.joinPortId"
              :joinPortDirect="position.joinPortDirect"
              :targetPortId="position.targetPortId"
              :targetPortDirect="position.targetPortDirect"
              :style="position.style"
              class="fake-plane"
              v-on:click="putPlaneOnField"
              v-on:mouseover="previewPlaneOnField(position)"
              v-on:mouseleave="hidePreviewPlaneOnField()"
            />
            <plane
              v-for="[_id, style] of Object.entries(selectedPlanes[game.gameId] || {})"
              :key="_id + '_preview'"
              :planeId="_id"
              :viewStyle="style"
              :class="['preview']"
            />
          </div>
        </div>
      </div>
    </template>

    <template #gameinfo="{} = {}">
      <div class="wrapper">
        <div class="game-status-label">
          Бюджет
          <span style="color: gold">{{ fullPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }}k ₽</span>
          {{ game.statusLabel }}
          <small v-if="game.roundReady">Ожидание других команд</small>
        </div>
        <div v-for="deck in deckList" :key="deck._id" class="deck" :code="deck.code.replace(game.code, '')">
          <div v-if="deck._id && deck.code === `${game.code}Deck[domino]`" class="hat" v-on:click="takeDice">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === `${game.code}Deck[card]`" class="card-event" v-on:click="takeCard">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === `${game.code}Deck[card_drop]`" class="card-event">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === `${game.code}Deck[card_active]`" class="deck-active">
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
      <div class="games">
        <div
          v-for="game in sortedGames"
          :key="game.gameId"
          :class="['game-item', game.selected ? 'selected' : '', game.super ? 'super' : '', game.my ? 'my' : '']"
          v-on:click="selectGame(game.gameId)"
        >
          {{ game.gameId.split('').reverse().join('') }}
        </div>
      </div>

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
import releaseGameGlobals from '~/domain/game/front/releaseGameGlobals.mjs';
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
  data() {
    return {
      selectedPlanes: {},
    };
  },
  setup() {
    const gameGlobals = prepareGameGlobals();

    Object.assign(gameGlobals, releaseGameGlobals);
    Object.assign(gameGlobals, {
      getSuperGame() {
        return this.$root.state.store.game?.[this.gameState.gameId] || {};
      },
      getSuperStore() {
        return this.getSuperGame().store || {};
      },
      getStore() {
        const game = this.$root.state.store.game?.[this.gameState.gameId] || {};
        return game.store || {};
      },
      playerGameId() {
        const game = this.$root.state.store.game?.[this.gameState.gameId] || {};

        if (this.gameState.viewerMode) return this.gameState.gameId;

        return Object.entries(game.gamesMap || {}).find(
          ([gameId, players]) => players[this.gameState.sessionPlayerId]
        )?.[0];
      },
      getGame() {
        const gameId = this.playerGameId();

        if (this.gameState.viewerMode) return this.getSuperGame();

        return this.getSuperGame().store?.game[gameId] || {};
      },
      gameFinished() {
        return this.getSuperGame().status === 'FINISHED';
      },
      actionsDisabled() {
        return (
          this.getGame().roundReady || this.store.player?.[this.gameState.sessionPlayerId]?.eventData?.actionsDisabled
        );
      },
      calcGamePlaneCustomStyleData({ gamePlaneScale, isMobile }) {
        const playerGameId = this.playerGameId();

        const p = {};
        const gamePlane = document.getElementById('gamePlane');
        if (gamePlane instanceof HTMLElement) {
          const gamePlaneRect = gamePlane.getBoundingClientRect();

          const pp = {};
          gamePlane.querySelectorAll('.gp').forEach((gp) => {
            const gameId = gp.attributes.gameid.value;
            const gp_rect = gp.getBoundingClientRect();

            // !!! костыль
            if (p.l == undefined || gp_rect.left < p.l) p.l = gp_rect.left;
            if (p.r == undefined || gp_rect.left > p.r) p.r = gp_rect.left;

            gp.querySelectorAll('.plane, .fake-plane').forEach((plane) => {
              const rect = plane.getBoundingClientRect();

              const offsetTop = rect.top - gamePlaneRect.top;
              const offsetLeft = rect.left - gamePlaneRect.left;

              if (gameId === playerGameId) {
                if (pp.t == undefined || rect.top < pp.t) pp.t = rect.top;
                if (pp.b == undefined || rect.bottom > pp.b) pp.b = rect.bottom;
                if (pp.l == undefined || rect.left < pp.l) pp.l = rect.left;
                if (pp.r == undefined || rect.right > pp.r) pp.r = rect.right;

                const gp_offsetTop = rect.top - gp_rect.top;
                const gp_offsetLeft = rect.left - gp_rect.left;

                if (pp.ot == undefined || gp_offsetTop < pp.ot) pp.ot = gp_offsetTop;
                if (pp.ol == undefined || gp_offsetLeft < pp.ol) pp.ol = gp_offsetLeft;
              }

              if (p.t == undefined || rect.top < p.t) p.t = rect.top;
              if (p.b == undefined || rect.bottom > p.b) p.b = rect.bottom;
              if (p.l == undefined || rect.left < p.l) p.l = rect.left;
              if (p.r == undefined || rect.right > p.r) p.r = rect.right;

              if (p.ot == undefined || offsetTop < p.ot) p.ot = offsetTop;
              if (p.ol == undefined || offsetLeft < p.ol) p.ol = offsetLeft;
            });
          });

          const gamePlaneTransformOrigin =
            `${(pp.r - pp.l) / (gamePlaneScale * 2) + pp.ol / gamePlaneScale}px ` +
            `${(pp.b - pp.t) / (gamePlaneScale * 2) + pp.ot / gamePlaneScale}px `;

          return {
            height: (p.b - p.t) / gamePlaneScale + 'px',
            width: (p.r - p.l) / gamePlaneScale + 'px',
            top: `calc(50% - ${(p.b - p.t) / 2 + p.ot * 1}px)`,
            left: `calc(50% - ${(p.r - p.l) / 2 + p.ol * 1}px)`,
            gamePlaneTransformOrigin,
          };
        }
      },
      getGamePlaneOffsets() {
        const game = this.$root.state.store.game?.[this.gameState.gameId] || {};
        const deviceOffset = this.$root.state.isMobile ? (this.$root.state.isLandscape ? 200 : 0) : 700;

        let offsetY = 0;
        const gameCount = Object.values(game.store.game).filter(({ status }) => status !== 'WAIT_FOR_PLAYERS').length;
        if (gameCount === 3) offsetY = -1000; // !!! костыль

        const offsets = {
          [this.gameState.gameId]: { x: 0 + deviceOffset, y: 0 + offsetY },
        };

        const gameIds = Object.keys(game.gamesMap);
        for (let i = 0; i < gameIds.length; i++) {
          switch (gameIds.length) {
            case 2:
              offsets[gameIds[i]] = {
                x: [-2000, 2000][i] + deviceOffset,
                y: 0 + offsetY,
              };
              break;
            case 3:
              offsets[gameIds[i]] = {
                x: [-2000, 2000, 0][i] + deviceOffset,
                y: [0, 0, 2000][i] + offsetY,
              };
              break;
            case 4:
            default: // !!!!
              offsets[gameIds[i]] = {
                x: [-2000, 2000, 0, 0][i] + deviceOffset,
                y: [0, 0, 2000, -2000][i] + offsetY,
              };
              break;
          }
        }

        return offsets;
      },
    });

    gameGlobals.gameCustom = reactive({
      selectedGame: '',
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
    'game.availablePorts': function () {
      this.$nextTick(() => {
        this.state.gamePlaneNeedUpdate = true;
      });
    },
    activeGamesCount: function () {
      this.$children[0].$emit('resetPlanePosition'); // !!! костыль
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
    activeGamesCount() {
      return Object.values(this.store.game || {}).filter(({ status }) => status !== 'WAIT_FOR_PLAYERS').length;
    },
    showPlayerControls() {
      return this.game.status === 'IN_PROCESS' && !this.game.roundReady;
    },
    playerIds() {
      if (this.gameState.viewerMode)
        return Object.keys(this.game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));

      const game = this.getSuperStore().game[this.selectedGame || this.playerGameId()];
      const ids = Object.keys(game.playerMap || {}).sort((id1, id2) => (id1 > id2 ? 1 : -1));
      const curPlayerIdx = ids.indexOf(this.gameState.sessionPlayerId);
      const result = curPlayerIdx != -1 ? ids.slice(curPlayerIdx + 1).concat(ids.slice(0, curPlayerIdx)) : ids;
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
      const baseSum = Object.keys(this.tablePlanes.itemMap)
        .map((planeId) => this.store.plane?.[planeId] || {})
        .reduce((sum, plane) => sum + plane.price, 0);
      const timerMod = 30000 / gameTimer;
      const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[gameConfig] || 1; // !!! + corporate
      return Math.floor(baseSum * timerMod * configMod);
    },
    deckList() {
      return Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id]) || [];
    },
    tables() {
      return Object.values(this.store.deck).filter((deck) => deck.subtype === 'table');
    },
    games() {
      const games = [];
      const playerGameId = this.playerGameId();
      const selectedGame = this.selectedGame || playerGameId;
      games.push([this.gameState.gameId, this.state.store.game?.[this.gameState.gameId] || {}]);
      if (this.store.game) games.push(...Object.entries(this.store.game));
      return games.map(([gameId, game]) => {
        return {
          gameId,
          table: Object.keys(game.deckMap)
            .map((deckId) => this.store.deck[deckId])
            .find((deck) => deck.subtype === 'table'),
          bridgeMap: game.bridgeMap,
          playersMap: game.playersMap,
          availablePorts: game.availablePorts,
          selected: selectedGame === gameId,
          super: this.gameState.gameId === gameId,
          my: gameId === playerGameId,
        };
      });
    },
    sortedGames() {
      return this.games.sort((a, b) => (a.my ? 1 : -1));
    },
    tablePlanes() {
      return this.deckList.find((deck) => deck.subtype === 'table') || {};
    },
    activeCards() {
      return this.deckList.find((deck) => deck.subtype === 'active') || {};
    },
    selectedGame() {
      return this.gameCustom.selectedGame;
    },
  },
  methods: {
    gamePlaneStyle(gameId) {
      const { x, y } = this.getGamePlaneOffsets()[gameId];
      return { transform: `translate(${x}px, ${y}px)` };
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
    possibleAddPlanePositions(game) {
      if (!this.sessionPlayerIsActive()) return [];
      const availablePorts = game.availablePorts || [];
      return availablePorts
        .filter(({ playerId }) => playerId === this.gameState.sessionPlayerId)
        .map(
          ({
            gameId,
            joinPlaneId,
            joinPortId,
            joinPortDirect,
            targetPortId,
            targetPortDirect,
            position,
            linkedPlanes,
          }) => {
            return {
              gameId,
              joinPlaneId,
              joinPortId,
              joinPortDirect,
              targetPortId,
              targetPortDirect,
              style: {
                left: position.left + 'px',
                top: position.top + 'px',
                width: position.right - position.left + 'px',
                height: position.bottom - position.top + 'px',
                rotation: position.rotation,
              },
              linkedPlanes,
            };
          }
        );
    },
    async previewPlaneOnField(previewPosition) {
      const { gameId, joinPlaneId, style: previewStyle, linkedPlanes } = previewPosition;

      function prepareStyle(style) {
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
      }

      const style = { ...previewStyle };
      prepareStyle(style);

      if (!this.selectedPlanes[gameId]) this.$set(this.selectedPlanes, gameId, {});
      this.$set(this.selectedPlanes[gameId], joinPlaneId, style);

      for (const plane of linkedPlanes) {
        const { joinPlaneId, position } = plane;
        const style = {
          left: position.left + 'px',
          top: position.top + 'px',
          width: position.right - position.left + 'px',
          height: position.bottom - position.top + 'px',
          rotation: position.rotation,
        };
        prepareStyle(style);
        this.$set(this.selectedPlanes[gameId], joinPlaneId, style);
      }
    },
    async hidePreviewPlaneOnField() {
      this.selectedPlanes = {};
    },
    async putPlaneOnField(event) {
      this.selectedPlanes = {};
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
    selectGame(gameId) {
      this.gameCustom.selectedGame = gameId;
      this.$children[0].$emit('resetPlanePosition'); // !!! костыль
    },
  },
};
</script>
<style lang="scss">
#gamePlane {
  transform-origin: left top !important;
  .gp-content {
    position: absolute;
  }
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
  background: url(./assets/dominoes.png);
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
  position: absolute;
  top: 0px;
  right: 0px;
  z-index: 1;

  text-align: right;
  color: white;
  font-weight: bold;
  font-size: 2em;
  white-space: nowrap;
  text-shadow: black 1px 0 10px;

  > small {
    display: block;
    font-size: 50%;
  }
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
  margin: 0px;
}
.plane.preview {
  opacity: 0.5;
}

.fake-plane {
  position: absolute;
  background: red;
  border: 1px solid;
  opacity: 0.5;
}
.fake-plane:hover {
  opacity: 0;
  z-index: 1;
  cursor: pointer;
}
.game-item {
  cursor: pointer;
  background: grey;
  color: white;
  font-size: 24px;
  padding: 4px 10px;
  margin-top: 4px;
  border: 1px solid black;
  border-radius: 4px;
  transform: rotate(-90deg);
  transform-origin: top left;
  margin-top: 100px;
  width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  &.my {
    background: #3f51b5;
  }

  &.selected {
    box-shadow: 0px 10px 2px 0px green;
  }
  &.super {
    display: none;
    background: gold;
    color: black;
  }
}
.player {
  margin-left: 60px;
}
.games {
  position: absolute;
  left: 0px;
  bottom: 0px;
}
</style>
