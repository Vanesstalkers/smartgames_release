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
              :key="position.code"
              :joinPortId="position.joinPortId"
              :joinPortDirect="position.joinPortDirect"
              :targetPortId="position.targetPortId"
              :targetPortDirect="position.targetPortDirect"
              :style="position.style"
              :class="['fake-plane', position.code === selectedFakePlanePosition ? 'hidden' : '']"
              v-on:click="previewPlaneOnField($event, position)"
            />
            <plane
              v-for="[_id, style] of Object.entries(gameCustom.selectedFakePlanes[game.gameId] || {})"
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
        <div v-if="player.teamlead" class="config-btn helper-avatar" v-on:click="openTeamleadMenu"></div>
        <div
          v-for="game in sortedGames"
          :key="game.gameId"
          :class="[
            'game-item',
            game.selected ? 'selected' : '',
            game.super ? 'super' : '',
            game.my ? 'my' : '',
            !game.roundReady ? 'wait-for-round-ready' : '',
          ]"
          v-on:click="selectGame(game.gameId)"
        >
          {{ game.title }}
        </div>
      </div>

      <player
        v-for="(id, index) in playerIds"
        :key="id"
        :playerId="id"
        :customClass="[`idx-${index}`]"
        :showControls="playerGamesReady[id] ? false : true"
      />
    </template>
  </game>
</template>

<script>
import { provide, reactive } from 'vue';

import { prepareGameGlobals } from '~/lib/game/front/gameGlobals.mjs';
import releaseGameGlobals from '~/domain/game/front/releaseGameGlobals.mjs';
import corporateGameGlobals from '~/domain/game/front/corporateGameGlobals.mjs';
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
      selectedFakePlanePosition: '',
    };
  },
  setup() {
    const gameGlobals = prepareGameGlobals();

    Object.assign(gameGlobals, releaseGameGlobals);
    Object.assign(gameGlobals, corporateGameGlobals);

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
    'superGame.availablePorts': function () {
      this.$nextTick(() => {
        this.state.gamePlaneNeedUpdate = true;
        this.selectedFakePlanePosition = '';
        this.gameCustom.selectedFakePlanes = {};
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
    superGame() {
      return this.getSuperGame();
    },
    player() {
      return this.store.player[this.gameState.sessionPlayerId] || {};
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
          playerMap: game.playerMap || {},
          availablePorts: game.availablePorts,
          selected: selectedGame === gameId,
          super: this.gameState.gameId === gameId,
          my: gameId === playerGameId,
          title: game.title,
          roundReady: game.roundReady,
        };
      });
    },
    playerGamesReady() {
      const result = {};
      for (const game of this.games) {
        for (const playerId of Object.keys(game.playerMap)) {
          result[playerId] = game.roundReady;
        }
      }
      return result;
    },
    sortedGames() {
      return this.games.sort((a, b) => (a.my ? -1 : 1));
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
    openTeamleadMenu() {
      this.$set(this.state.store.user?.[this.state.currentUser], 'helper', {
        menu: {
          text: 'Что необходимо сделать?',
          pos: 'bottom-left',
          showList: [
            { title: 'Переименовать команду', action: { tutorial: 'game-tutorial-teamleadMenu', step: 'renameTeam' } },
            {
              title: 'Передать руководство',
              action: { tutorial: 'game-tutorial-teamleadMenu', step: 'changeTeamlead' },
            },
          ],
          buttons: [{ text: 'Спасибо, ничего не нужно', action: 'exit', exit: true }],
        },
      });
    },
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
      const positions = availablePorts
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
              code: joinPortId + joinPortDirect + targetPortId + targetPortDirect,
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

      return positions;
    },
    async previewPlaneOnField(event, previewPosition) {
      const { code, gameId, joinPlaneId, style: previewStyle, linkedPlanes } = previewPosition;

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

      if (!this.gameCustom.selectedFakePlanes[gameId]) this.$set(this.gameCustom.selectedFakePlanes, gameId, {});
      this.$set(this.gameCustom.selectedFakePlanes[gameId], joinPlaneId, style);

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
        this.$set(this.gameCustom.selectedFakePlanes[gameId], joinPlaneId, style);
      }

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
                gameId: this.gameState.gameId,
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
  background: #ffa500;
  border: 1px solid;
  opacity: 0.5;

  &:hover {
    opacity: 1;
    z-index: 1;
    cursor: pointer;
  }

  &.hidden {
    display: none;
  }
}

.player {
  margin-left: 60px;
}
.games {
  position: absolute;
  left: 40px;
  bottom: 0px;
  height: 50px;
  display: flex;
  flex-direction: row;
  transform: rotate(-90deg);
  transform-origin: bottom left;

  .game-item {
    background: grey;
    color: white;
    font-size: 24px;
    padding: 4px 10px;
    margin-top: 4px;
    border: 1px solid black;
    border-radius: 4px;
    margin-right: 20px;
    width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      cursor: pointer;
      opacity: 0.7;
    }

    &.selected {
      box-shadow: 0px 10px 2px 0px green;
    }
    &.super {
      display: none;
      background: gold;
      color: black;
    }
    &.wait-for-round-ready {
      background: orange;
    }
    &.my {
      background: #3f51b5;
    }
  }

  .config-btn {
    margin-top: 8px;
    margin-right: 10px;
    width: 42px;
    height: 42px;
    background-size: cover;
    transform: rotate(90deg);

    &:hover {
      cursor: pointer;
      opacity: 0.7;
    }
  }
}

#game.mobile-view {
  &.portrait-view {
    .player {
      margin-left: 0px;
      margin-right: 60px;
    }
    .games {
      position: absolute;
      left: 100%;
      top: 0px;
      height: 40px;
      display: flex;
      flex-direction: row;
      transform: rotate(90deg);
      transform-origin: top left;

      .config-btn {
        transform: rotate(-90deg);
      }
    }
    .deck-active {
      flex-direction: row-reverse;
    }
    .deck[code='Deck[card_active]'] {
      .card-event {
        margin-top: 0px;
        margin-left: -75px;
      }
    }
  }

  .game-status-label {
    font-size: 1.5em;
  }
}
</style>
