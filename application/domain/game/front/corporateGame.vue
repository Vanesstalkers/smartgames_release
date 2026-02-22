<template>
  <game
    ref="game"
    :debug="false"
    :defaultPlaneScale="putPlaneEventActive ? 0.3 : 0.5"
    :status="game.status"
    :superStatus="superGame.status"
  >
    <template #helper-guru="{ menuWrapper, menuButtonsMap } = {}">
      <tutorial :game="game" class="scroll-off" :customMenu="customMenu({ menuWrapper, menuButtonsMap })" />
    </template>

    <template #chat="{ isVisible, hasUnreadMessages } = {}">
      <chat
        :defActiveChannel="`game-${gameState.gameId}`"
        :userData="userData"
        :isVisible="isVisible"
        :class="[isVisible ? 'isVisible' : '']"
        :hasUnreadMessages="hasUnreadMessages"
        :channels="chatChannels"
      />
    </template>

    <template #gameplane="{} = {}">
      <div
        v-for="game in planeViewGames"
        :key="game.gameId"
        :gameId="game.gameId"
        :class="[
          'gp',
          game.roundReady ? 'round-ready' : '',
          allGamesMerged ? 'all-games-merged' : '',
          sessionPlayerGame.merged ? 'session-game-merged' : '',
          restoringGameState ? 'restoring-game' : '',
        ]"
        :style="{ ...gamePlaneStyle(game.gameId) }"
      >
        <div class="gp-content" :style="{ ...gamePlaneContentControlStyle(game.gameId) }">
          <plane v-for="id in Object.keys(game.table?.itemMap || {})" :key="id" :planeId="id" />
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
              @click="previewPlaneOnField($event, position)"
              @mouseenter="zIndexDecrease($event, position.code)"
              @mouseleave="zIndexRestore($event, position.code)"
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
      <div :class="['wrapper decks ', allGamesMerged ? 'show-super' : '']">
        <div class="game-status-label">
          Бюджет
          <span style="color: gold">{{ fullPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }}k ₽</span>
          {{ superGame.statusLabel }}
          <small v-if="selectedGame.roundReady">{{
            allGamesMerged ? 'Ход другой команды' : 'Ожидание других команд'
          }}</small>
        </div>
        <div
          v-for="deck in deckList"
          :key="deck._id"
          :class="['deck', 'template-' + (selectedGame.templates.code || 'default')]"
          :code="deck.code.replace(selectedGame.code, '')"
        >
          <div v-if="deck._id && deck.code === `${selectedGame.code}Deck[domino]`" class="hat" v-on:click="takeDice">
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div
            v-if="deck._id && deck.code === `${selectedGame.code}Deck[card]`"
            class="card-event"
            :style="cardEventCustomStyle[selectedGame._id]"
            v-on:click="takeCard"
          >
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div
            v-if="deck._id && deck.code === `${selectedGame.code}Deck[card_drop]`"
            class="card-event"
            :style="cardEventCustomStyle[selectedGame._id]"
          >
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === `${selectedGame.code}Deck[card_active]`" class="deck-active">
            <!-- активная карта всегда первая - для верстки она должна стать последней -->
            <card
              v-for="{ _id, played } in sortedActiveCards(Object.keys(deck.itemMap))"
              :key="_id"
              :cardId="_id"
              :canPlay="!played && sessionPlayerIsActive() && showPlayerControls"
            />
          </div>
          <div
            v-if="deck._id && deck.code === `SuperDeck[card]`"
            class="card-event"
            :style="cardEventCustomStyle[superGame._id]"
            v-on:click="takeCard"
          >
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div
            v-if="deck._id && deck.code === `SuperDeck[card_drop]`"
            class="card-event"
            :style="cardEventCustomStyle[superGame._id]"
          >
            {{ Object.keys(deck.itemMap).length }}
          </div>
          <div v-if="deck._id && deck.code === `SuperDeck[card_active]`" class="deck-active">
            <!-- активная карта всегда первая - для верстки она должна стать последней -->
            <card
              v-for="{ _id, played } in sortedActiveCards(Object.keys(deck.itemMap))"
              :key="_id"
              :cardId="_id"
              :canPlay="!played && sessionPlayerIsActive() && showPlayerControls"
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
          :class="[
            'game-item',
            game.selected ? 'selected' : '',
            game.super ? 'super' : '',
            game.my ? 'my' : '',
            game.roundReady ? 'round-ready' : '',
            game.merged && !allGamesMerged ? 'disable-field' : '',
            game.selectable ? 'selectable' : '',
          ]"
          v-on:click="selectGame(game.gameId, { selectable: game.selectable })"
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
import releaseGameGlobals, { gameCustomArgs } from '~/domain/game/front/releaseGameGlobals.mjs';
import corporateGameGlobals from '~/domain/game/front/corporateGameGlobals.mjs';
import Game from '~/lib/game/front/Game.vue';
import tutorial from '~/lib/helper/front/helper.vue';
import chat from '~/lib/chat/front/chat.vue';

import card from './components/card.vue';
import player from './components/player.vue';
import plane from './components/plane.vue';
import bridge from './components/bridge.vue';

export default {
  components: {
    Game,
    tutorial,
    chat,
    player,
    card,
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
      gameCustomArgs: {
        ...gameCustomArgs,
        gamePlaneRotations: {},
      },
    });

    Object.assign(gameGlobals, releaseGameGlobals);
    Object.assign(gameGlobals, corporateGameGlobals);

    provide('gameGlobals', gameGlobals);

    return gameGlobals;
  },
  watch: {
    gameDataLoaded: function () {
      // тут ловим обновление страницы
      if (
        this.gameDataLoaded // gameDataLoaded может не быть при restoreForced
      ) {
        this.hideZonesAvailability();
      }
    },
    'player.eventData.triggerListenerEnabled': function () {
      this.gameCustom.pickedDiceId = '';
      if (
        this.gameDataLoaded // gameDataLoaded может не быть при restoreForced
      ) {
        this.hideZonesAvailability();
      }
    },
    'player.eventData.availablePorts': function () {
      this.$nextTick(() => {
        this.state.gamePlaneNeedUpdate = true;
        this.selectedFakePlanePosition = '';
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
    'game.merged': function () {
      this.resetPlanePosition();
    },
    activeGamesCount: function () {
      this.resetPlanePosition();
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
    selectedGame() {
      return this.getGame(this.gameCustom.selectedGameId);
    },
    superGame() {
      return this.getSuperGame();
    },
    sessionPlayerGameId() {
      return this.sessionPlayer()?.gameId;
    },
    sessionPlayerGame() {
      return this.getGame(this.sessionPlayerGameId);
    },
    player() {
      return this.store.player?.[this.gameState.sessionPlayerId] || {};
    },
    userData() {
      return this.sessionUserData();
    },
    lobby() {
      return this.state.store.lobby?.[this.state.currentLobby] || {};
    },
    gameDataLoaded() {
      return this.game.addTime;
    },
    activeGamesCount() {
      return Object.values(this.store.game || {}).filter(({ status }) => status !== 'WAIT_FOR_PLAYERS').length;
    },
    showPlayerControls() {
      return ['IN_PROCESS', 'PREPARE_START'].includes(this.superGame.status) && !this.game.roundReady;
    },
    playerIds() {
      if (this.gameState.viewerMode && !this.gameCustom.selectedGameId) return [];

      const game = this.getStore().game[this.gameCustom.selectedGameId || this.playerGameId()];

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
    sessionPlayerEventData() {
      return this.sessionPlayer().eventData;
    },

    fullPrice() {
      let fullPrice = 0;
      for (const game of this.games) {
        const { gameTimer, gameConfig, table } = game;
        const baseSum = Object.keys(table.itemMap)
          .map((planeId) => this.store.plane?.[planeId] || {})
          .reduce((sum, plane) => sum + plane.price, 0);
        const timerMod = 30 / gameTimer;
        const configMod = { blitz: 0.5, standart: 0.75, hardcore: 1 }[gameConfig] || 1; // !!! + corporate
        fullPrice += Math.floor(baseSum * timerMod * configMod);
      }
      return fullPrice;
    },
    deckList() {
      let resultDeckList = Object.keys(this.selectedGame.deckMap).map((id) => this.store.deck?.[id]);
      if (this.selectedGame._id !== this.gameState.gameId && this.game.gameConfig !== 'competition') {
        resultDeckList = resultDeckList.concat(this.superGameCardDeck) || [];
      }
      return resultDeckList;
    },
    superGameCardDeck() {
      return (
        Object.keys(this.superGame.deckMap).map((id) => {
          const deck = this.store.deck?.[id];
          return { ...deck, code: `Super${deck.code}` };
        }) || []
      );
    },
    tables() {
      return Object.values(this.store.deck).filter((deck) => deck.subtype === 'table');
    },
    games() {
      const games = [];
      const playerGameId = this.playerGameId();
      const selectedGameId = this.gameCustom.selectedGameId || playerGameId;
      if (this.store.game) games.push(...Object.entries(this.store.game));
      games.push([this.gameState.gameId, this.state.store.game?.[this.gameState.gameId] || {}]); // super-игра принципиально последняя, чтобы в верстке быть поверх остальных игр
      return games.map(([gameId, game]) => {
        return {
          gameId,
          table: Object.keys(game.deckMap || {})
            .map((deckId) => this.store.deck[deckId])
            .find((deck) => deck.subtype === 'table'),
          bridgeMap: game.bridgeMap || {},
          playerMap: game.playerMap || {},
          selected: selectedGameId === gameId,
          super: this.gameState.gameId === gameId,
          my: gameId === playerGameId,
          title: game.title,
          roundReady: game.roundReady,
          code: game.code,
          merged: game.merged,
          gameConfig: game.gameConfig,
          gameTimer: game.gameTimer,
          selectable: this.sessionPlayerIsActive() && this.sessionPlayerEventData.game?.[gameId]?.selectable,
        };
      });
    },
    planeViewGames() {
      const games = [...this.games];
      // выравниваем gamePlane, равномерно распределяя gp вокруг центра (в corporateGameGlobals добавляются соответствующие отступы)
      if (games.length % 2 === 0) games.push({ gameId: 'fake' });
      return games;
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

    cardEventCustomStyle() {
      const {
        state: { serverOrigin },
        selectedGame,
        superGame,
      } = this;

      return {
        [selectedGame._id]: {
          backgroundImage: `url(${serverOrigin}/img/cards/${selectedGame.templates.card}/back-side.jpg)`,
        },
        [superGame._id]: {
          backgroundImage: `url(${serverOrigin}/img/cards/${superGame.templates.card}/back-side.jpg)`,
        },
      };
    },
    allGamesMerged() {
      return this.games.every((game) => game.super || game.merged);
    },
    chatChannels() {
      return {
        [`game-${this.sessionPlayerGameId}`]: {
          name: 'Чат команды',
          users: this.teamChatUsers,
          items: this.game.chat || {},
          inGame: true,
        },
        [`game-${this.gameState.gameId}`]: {
          name: 'Чат игры',
          users: this.gameChatUsers,
          items: this.superGame.chat || {},
          inGame: true,
        },
        [`lobby-${this.state.currentLobby}`]: {
          name: 'Общий чат',
          users: this.lobby.users || {},
          items: this.lobby.chat || {},
        },
      };
    },
    teamChatUsers() {
      const playerMap = this.game.playerMap;
      return Object.values(this.store.player)
        .filter((p) => playerMap[p._id])
        .reduce((obj, { userId, isViewer }) => {
          let user = { ...this.lobby.users?.[userId] };
          return Object.assign(obj, { [userId]: user });
        }, {});
    },
    gameChatUsers() {
      return Object.values(this.store.player)
        .concat(Object.values(this.store.viewer || {}))
        .reduce((obj, { userId, isViewer }) => {
          let user = { ...this.lobby.users?.[userId] };
          if (isViewer) user.name = `${user.name || 'Гость'} (наблюдатель)`;
          return Object.assign(obj, { [userId]: user });
        }, {});
    },
    restoringGameState() {
      return this.game.status === 'RESTORING_GAME';
    },
    statusLabel() {
      return this.restoringGameState ? 'Восстановление игры' : this.superGame.statusLabel;
    },
    putPlaneEventActive() {
      return Object.keys(this.sessionPlayer().eventData.plane || {}).length > 0 ? true : false;
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

      const teamleadActions = !this.player.teamlead
        ? null
        : {
            text: 'Покажи действия тимлида',
            style: { boxShadow: 'inset 0px 0px 20px #f4e205' },
            customClass: 'teamlead-actions',
            action: {
              text: 'Выбери действие:',
              showList: [
                {
                  title: 'Вернуть игровой стол команды',
                  action: { tutorial: 'game-tutorial-teamleadMenu', step: 'transferTable' },
                },
                { title: 'Восстановить игру', action: { tutorial: 'game-tutorial-restoreForced' } },
                {
                  title: 'Переименовать команду',
                  action: { tutorial: 'game-tutorial-teamleadMenu', step: 'renameTeam' },
                },
                this.playerIds.length > 0
                  ? {
                      title: 'Передать руководство',
                      action: { tutorial: 'game-tutorial-teamleadMenu', step: 'changeTeamlead' },
                    }
                  : null,
                this.playerIds.length > 0
                  ? {
                      title: 'Удалить игрока из команды',
                      action: { tutorial: 'game-tutorial-teamleadMenu', step: 'removePlayer' },
                    }
                  : null,
                {
                  title: 'Завершить текущий раунд',
                  action: { tutorial: 'game-tutorial-teamleadMenu', step: 'endRound' },
                },
              ],
              buttons: [
                { text: 'Назад в меню', action: 'init' },
                { text: 'Спасибо', action: 'exit', exit: true },
              ],
            },
          };

      return menuWrapper({
        buttons: [cancel(), restore(), fillTutorials, helperLinks({ inGame: true }), teamleadActions, leave()],
      });
    },
    gamePlaneContentControlStyle(gameId) {
      const gameTransformOrigin = this.gameCustom.gamePlaneTransformOrigin[gameId];
      const transformOrigin = gameTransformOrigin
        ? `${gameTransformOrigin.x}px ${gameTransformOrigin.y}px`
        : 'center center';

      const rotation =
        gameId === this.focusedGameId()
          ? this.gameCustom.gamePlaneRotation
          : this.gameCustom.gamePlaneRotations[gameId];

      const transform = [
        //
        `rotate(${rotation}deg)`,
      ].join(' ');
      return { transform, transformOrigin };
    },
    gamePlaneStyle(gameId) {
      const { x, y } = this.getGamePlaneOffsets()[gameId];

      const gameTransformOrigin = this.gameCustom.gamePlaneTransformOrigin[gameId];
      return { transform: `translate(${x}px, ${y - (gameTransformOrigin?.y ?? 0)}px)` };
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

      const availablePorts = this.sessionPlayer().eventData.availablePorts || [];
      const positions = availablePorts
        .filter(({ gameId }) => gameId === game.gameId)
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
              ...{ gameId, joinPlaneId, joinPortId, joinPortDirect, targetPortId, targetPortDirect },
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

      this.hidePreviewPlanes();
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
    async selectGame(gameId, { selectable }) {
      this.gameCustom.gamePlaneRotations = {
        ...this.gameCustom.gamePlaneRotations,
        [this.focusedGameId()]: this.gameCustom.gamePlaneRotation,
      };

      const rotation = this.gameCustom.gamePlaneRotations[gameId] || 0;
      this.resetMouseEventsConfig({ rotation });
      this.gameCustom.gamePlaneRotation = rotation;

      this.$set(this.gameCustom, 'selectedGameId', gameId);
      this.resetPlanePosition();
      this.$refs.game?.updatePlaneScale();

      if (selectable) {
        await this.handleGameApi({
          name: 'eventTrigger',
          data: {
            eventData: {
              targetId: gameId,
              targetPlayerId: this.$parent.playerId,
            },
          },
        });
      }
    },
  },
};
</script>
<style lang="scss">
#gamePlane {
  .gp-content {
    position: absolute;
  }
}

// раунд завершен
#game[config=cooperative] .gp.round-ready .plane .domino-dice,
#game[config=cooperative] .gp.round-ready .bridge .domino-dice,
// восстанавливается игра
.gp.restoring-game .plane .domino-dice,
.gp.restoring-game .bridge .domino-dice,
// замороженная игра (ждет merge всех остальных игр)
.gp:not(.all-games-merged) .plane.source-game-merged .domino-dice,
.gp:not(.all-games-merged) .bridge.anchor-game-merged .domino-dice {
  opacity: 0.5;
  cursor: default !important;

  > .controls {
    display: none !important;
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

.deck > .card-event:hover {
  box-shadow: inset 0 0 0 1000px rgba(255, 255, 255, 0.5);
  color: black !important;
}

.deck[code='Deck[domino]'] {
  position: absolute;
  top: 35px;
  right: 100px;
  width: 70px;
  height: 70px;
  padding: 14px;
  cursor: default;
}

.deck[code='Deck[domino]']:after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
  z-index: -1;
  background: url(./assets/dices/deck.png);
  background-size: cover;
}

.deck[code='Deck[domino]'].template-team1:after {
  filter: hue-rotate(200deg);
}

.deck[code='Deck[domino]'].template-team2:after {
  filter: hue-rotate(320deg);
}

.deck[code='Deck[domino]'].template-team3:after {
  filter: hue-rotate(80deg);
}

.deck[code='Deck[domino]'].template-team4:after {
  filter: hue-rotate(10deg);
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

.deck[code='Deck[card_drop]'],
.deck[code='SuperDeck[card_drop]'] {
  position: absolute;
  filter: grayscale(1);
  transform: scale(0.5);
  top: 65px;
  right: -10px;
  cursor: default;

  > .card-event {
    color: #ccc;
  }
}

.deck[code='Deck[card_active]'],
.deck[code='SuperDeck[card_active]'] {
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

.deck[code='SuperDeck[card]'],
.deck[code='SuperDeck[card_active]'],
.deck[code='SuperDeck[card_drop]'] {
  display: none;
}

.decks.show-super {
  .deck[code='SuperDeck[card]'],
  .deck[code='SuperDeck[card_active]'],
  .deck[code='SuperDeck[card_drop]'] {
    display: block;
  }

  .deck[code='SuperDeck[card]'] {
    position: absolute;
    top: 35px;
    right: 30px;
    cursor: default;
  }

  .deck[code='Deck[domino]'] {
    right: 200px;
  }

  .deck[code='Deck[card]'] {
    right: 130px;
  }

  .deck[code='Deck[card_drop]'] {
    right: 90px;
  }
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

  &.low-zindex {
    z-index: -1;
  }

  &.hidden {
    display: none;
  }
}

.player {
  margin-left: 60px;
}

#game .games {
  z-index: 1;
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
    white-space: nowrap;
    overflow: hidden;

    &:hover {
      cursor: pointer;
      opacity: 0.7;
    }

    &.selectable {
      box-shadow: 0 0 20px 8px yellow !important;
    }

    &.selected {
      box-shadow: 0px 10px 2px 0px green;
    }

    &.super {
      display: none;
      background: gold;
      color: black;
    }

    &:not(.round-ready) {
      background: orange;
    }

    &.my {
      background: #3f51b5;
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

#game .log-content .log-item {
  a {
    &[team='team1'] {
      color: rgb(255, 128, 128);
    }

    &[team='team2'] {
      color: rgb(128, 128, 255);
    }

    &[team='team3'] {
      color: rgb(128, 255, 128);
    }

    &[team='team4'] {
      color: rgb(255, 255, 128);
    }
  }
}

#game[config='competition'] .plane:not(.anchor-team-field):not(.core.central) .domino-dice,
#game[config='competition'] .gp:not(.session-game-merged) .plane:not(.anchor-team-field) .domino-dice,
#game[config='competition'] .bridge:not(.anchor-team-field):not(.core.central) .domino-dice,
#game[config='competition'] .gp:not(.session-game-merged) .bridge:not(.anchor-team-field) .domino-dice {
  cursor: default !important;

  > .controls {
    display: none !important;
  }
}
</style>
