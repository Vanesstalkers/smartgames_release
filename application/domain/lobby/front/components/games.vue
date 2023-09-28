<template>
  <div>
    <div class="new-game-controls">
      <div class="breadcrumbs">
        <span
          :class="['select-btn', deckType ? 'active selected' : '']"
          @click="selectDeckType(null), selectGameType(null), selectGameConfig(null)"
        >
          {{ deckMap[deckType]?.title || 'Выбор колоды:' }}
        </span>
        <span
          v-if="deckType"
          :class="['select-btn', gameType ? 'active selected' : '']"
          @click="selectGameType(null), selectGameConfig(null)"
        >
          {{ gameTypeMap[gameType]?.title || 'Выбор типа игры:' }}
        </span>
        <span
          v-if="gameType"
          :class="['select-btn', gameConfig ? 'active selected' : '']"
          @click="selectGameConfig(null)"
        >
          {{ gameConfig ? gameConfigMap[gameConfig].title : 'Выбор режима:' }}
        </span>
      </div>
      <div v-if="!deckType" class="game-types">
        <div
          v-for="[code, game] in gameDeckList"
          :key="code"
          :class="['select-btn', 'wait-for-select', game.active === false ? 'disabled' : '']"
          @click="selectDeckType(code)"
        >
          <div><font-awesome-icon :icon="game.icon" /> {{ game.title }}</div>
        </div>
      </div>

      <div v-if="!gameType" :class="['game-block', `${deckType}-game`]">
        <div
          v-for="[code, game] in gameTypeList"
          :key="code"
          :class="['select-btn', 'wait-for-select', code, game.active === false ? 'disabled' : '']"
          v-on:click="selectGameType(code)"
        >
          <font-awesome-icon :icon="game.icon" /> {{ game.title }}
        </div>
      </div>

      <div v-if="!gameConfig" :class="['game-config-block', `${deckType}-game-config`]">
        <div
          v-for="[code, config] in gameConfigList"
          :key="code"
          :class="['select-btn', 'wait-for-select', code]"
          v-on:click="selectGameConfig(code)"
        >
          {{ config.title }}
        </div>
      </div>

      <div v-if="deckType === 'release' && gameType && gameConfig" class="game-start-block release-game-start">
        <span class="timer">
          <font-awesome-icon :icon="['fas', 'plus']" @click="updateGameTimer(15)" />
          {{ gameTimer }}
          <font-awesome-icon :icon="['fas', 'minus']" @click="updateGameTimer(-15)" />
        </span>
        <span class="timer-label">секунд<br />на ход</span>
        <button class="select-btn active" @click="addGame()">Начать игру</button>
      </div>
    </div>
    <hr :style="{ margin: '10px 30px', borderColor: '#f4e205' }" />
    <div>
      <perfect-scrollbar>
        <div v-for="game in lobbyGameList" :key="game._id" class="game-item">
          <div v-if="game.joinedPlayers">
            <div>
              <span v-if="game.waitForPlayer">Игроков: {{ game.joinedPlayers }}</span>
              <span v-if="!game.waitForPlayer">Идет {{ game.round }} раунд</span>
            </div>
            <div class="game-config-info">
              <span>
                <font-awesome-icon :icon="deckMap[game.deckType].icon" />
                <font-awesome-icon :icon="deckMap[game.deckType].games[game.gameType].icon" />
                {{ deckMap[game.deckType].games[game.gameType].items[game.gameConfig].title }}
              </span>
              <span style="margin-left: 10px">
                <font-awesome-icon :icon="['fas', 'stopwatch']" /> {{ game.gameTimer }} сек
              </span>
            </div>
          </div>
          <span v-if="game.joinedPlayers && !game.waitForPlayer" :style="{ color: '#f4e205' }">
            <button
              class="lobby-btn join-btn"
              v-on:click="joinGame({ gameId: game.id, deckType: game.deckType, viewerMode: true })"
            >
              <font-awesome-icon :icon="['fas', 'eye']" />
              Посмотреть
            </button>
          </span>
          <button
            v-if="game.waitForPlayer"
            class="lobby-btn join-btn"
            v-on:click="joinGame({ gameId: game.id, deckType: game.deckType })"
          >
            Присоединиться
          </button>
        </div>
      </perfect-scrollbar>
    </div>
  </div>
</template>

<script>
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

export default {
  components: {
    PerfectScrollbar,
  },
  props: {
    showGameIframe: Function,
  },
  data() {
    return {
      gameConfigsLoaded: false,
      deckType: null,
      gameType: null,
      gameConfig: null,
      gameTimer: 60,
    };
  },
  watch: {},
  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      const store = this.state.store || {};

      // не придумал другого способа как предустановить configs с учетом синхронной подгрузки userData
      this.prepareGameConfigs(store.user?.[this.state.currentUser]);

      return store;
    },
    userData() {
      const currentUserData = this.store.user?.[this.state.currentUser] || {};
      return { id: this.state.currentUser, ...currentUserData };
    },
    lobby() {
      return this.store.lobby?.[this.state.currentLobby] || {};
    },
    deckMap() {
      return this.lobby.gameServers || {};
    },
    gameDeckList() {
      const list = Object.entries(this.deckMap);
      return list.sort((a, b) => (!a.active && b.active ? 1 : -1));
    },
    gameTypeMap() {
      return this.deckMap[this.deckType]?.games || {};
    },
    gameTypeList() {
      const list = Object.entries(this.gameTypeMap);
      return list.sort((a, b) => (a[1].playerCount[0] > b[1].playerCount[0] ? 1 : -1));
    },
    gameConfigMap() {
      return this.gameTypeMap[this.gameType]?.items || {};
    },
    gameConfigList() {
      const list = Object.entries(this.gameConfigMap);
      return list.sort((a, b) => (a[1].timer > b[1].timer ? -1 : 1));
    },
    lobbyGameList() {
      const list = Object.entries(this.lobby.games || {})
        .map(([id, game]) => Object.assign({}, game, { id }))
        .map((game) => {
          if (game.playerMap) {
            const players = Object.keys(game.playerMap).map((id) => game.store?.player[id] || {});
            game.joinedPlayers = players.filter((player) => player.ready).length + ' из ' + players.length;
          }
          if (game.status === 'WAIT_FOR_PLAYERS') game.waitForPlayer = true;
          return game;
        })
        .reverse();
      const sortedList = list.sort((a, b) => (a.waitForPlayer && !b.waitForPlayer ? -1 : 1));
      return sortedList;
    },
  },
  methods: {
    prepareGameConfigs(userData = {}) {
      if (this.gameConfigsLoaded) return;
      const configs = userData.lobbyGameConfigs;
      if (!configs) return;
      const { deckType, gameType, gameConfig, gameTimer } = configs.active;
      this.$set(this, 'deckType', deckType);
      this.$set(this, 'gameType', gameType);
      this.$set(this, 'gameConfig', gameConfig);
      if (gameTimer) this.$set(this, 'gameTimer', gameTimer);
      this.gameConfigsLoaded = true;
    },
    selectDeckType(type) {
      this.deckType = type;
    },
    selectGameType(type) {
      this.gameType = type;
    },
    selectGameConfig(type) {
      this.gameConfig = type;
    },
    updateGameTimer(timeShift) {
      this.gameTimer += timeShift;
      if (this.gameTimer > 120) this.gameTimer = 120;
      if (this.gameTimer < 15) this.gameTimer = 15;
    },
    async addGame() {
      const { deckType, gameType, gameConfig, gameTimer } = this;
      if (!deckType || !gameType || !gameConfig) prettyAlert({ message: 'game config not set' });

      await api.action
        .call({
          path: 'user.api.update',
          args: [{ lobbyGameConfigs: { active: { deckType, gameType, gameConfig, gameTimer } } }],
        })
        .catch(prettyAlert);

      const userId = this.state.currentUser;
      let { name: userName, login, gender, tgUsername } = this.userData;
      if (!userName) userName = login;

      window.iframeEvents.push({
        data: {
          args: [
            {
              ...{ deckType, gameType, gameConfig, gameTimer },
              creator: { userId, userName, tgUsername },
            },
          ],
        },
        event: ({ args }) => {
          const $iframe = document.querySelector('#gameIframe');
          $iframe.contentWindow.postMessage({ path: 'game.api.new', args }, '*');
        },
      });
      this.showGameIframe({ deckType });
    },
    async joinGame({ gameId, deckType, viewerMode }) {
      // игровой сервер мог отключиться
      const { isAlive } = await api.action.call({ path: 'lobby.api.checkGame', args: [{ gameId }] }).catch(prettyAlert);
      if (!isAlive) return;

      window.iframeEvents.push({
        data: {
          args: [{ gameId, viewerMode }],
        },
        event: ({ args }) => {
          const $iframe = document.querySelector('#gameIframe');
          $iframe.contentWindow.postMessage({ path: 'game.api.join', args }, '*');
        },
      });
      this.showGameIframe({ deckType });
    },
  },
  async created() {},
  async mounted() {},
  async beforeDestroy() {},
};
</script>
<style src="vue2-perfect-scrollbar/dist/vue2-perfect-scrollbar.css" />
<style lang="scss" scoped>
@import '@/mixins.scss';

.new-game-controls {
  @media only screen and (max-width: 360px) {
    font-size: 9px;
  }

  .breadcrumbs {
    text-align: center;
    padding: 10px 4px;

    .select-btn:not(.active) {
      border: none;
      cursor: default !important;
      &:hover {
        opacity: 1 !important;
      }
    }
    .select-btn.active {
      &:hover {
        opacity: 0.7;
      }
    }
  }

  .release-game {
    @include flex($wrap: wrap);
  }
  .game-types {
    @include flex();
    padding: 0px 10px;

    .select-btn {
      text-align: center;
      text-transform: uppercase;
      svg {
        width: 10px;
        margin-right: 4px;
      }
    }
  }
  .game-config-block {
    @include flex();
    padding: 0px 10px;

    .select-btn {
      text-align: center;
    }
  }
  .game-start-block {
    @include flex();
    padding: 0px 10px;

    .select-btn {
      text-align: center;
      max-width: 100px;
      // background-color: #1976d2!important;
      // border-color: #1976d2!important;
      // color: white!important;
    }

    .timer {
      color: #f4e205;
      font-size: 16px;

      svg {
        cursor: pointer;
        border: 1px solid;
        border-radius: 50%;
        padding: 0px 2px;
        color: black;
        background: #f4e205;
      }

      &.tutorial-active {
        box-shadow: none;
        > svg {
          box-shadow: 0 0 10px 10px #f4e205;
        }
      }
    }
    .timer-label {
      margin: 0px 10px;
    }
  }

  .select-btn {
    width: 40%;
    text-align: left;
    border: 2px solid #f4e205;
    color: white;
    background-color: transparent;
    padding: 4px 10px;
    margin: 4px;
    border-radius: 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    cursor: pointer;

    @media only screen and (max-width: 360px) {
      padding: 4px 4px;
    }

    svg {
      width: 40px;
      @media only screen and (max-width: 360px) {
        width: 30px;
      }
    }
    &.active {
      background: #f4e205;
      color: black;
      svg {
        color: black !important;
      }
    }
    &.selected {
      &:after {
        content: 'X';
        color: black;
        padding: 0px 2px;
        font-weight: bold;
      }
    }
    &.disabled {
      border: 2px solid #ccc;
      background-color: #ccc;
      cursor: not-allowed;
    }

    &.wait-for-select:not(.disabled):hover {
      opacity: 0.7;
    }

    &.tutorial-active {
      box-shadow: 0px 0px 20px 5px #f4e205;
    }
  }
}

.game-item {
  @include flex($justify: space-between);
  margin: 4px auto;
  min-height: 30px;
  max-width: 400px;

  .game-config-info {
    color: #f4e205;
    display: flex;
    justify-content: space-between;
    > svg {
      margin-left: 0px 4px;
    }
  }
}
.mobile-view .game-item {
  justify-content: center;
  > * {
    margin: 4px 10px;
  }
}

@media only screen and (max-width: 360px) {
  .join-btn {
    font-size: 9px;
    padding: 4px;
  }
}
</style>
