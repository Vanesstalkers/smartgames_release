<template>
  <div v-if="player._id || viewer._id" :id="player._id" :class="[
    'card-worker',
    'card-worker-' + player.code,
    player.active ? 'active' : '',
    player.teamlead ? 'teamlead' : '',
    selectable ? 'selectable' : '',
    showEndRoundBtn || showLeaveBtn || showCustomActionBtn ? 'has-action' : '',
    controlActionDisabled ? 'disabled' : '',
  ]" :style="customStyle" @click="controlAction">
    <div v-if="player.teamlead" class="teamlead-icon"></div>
    <div class="user-name">
      {{ player.userName }}
    </div>
    <div v-if="showControls && player.active && player.timerEndTime && gameStatus != 'WAIT_FOR_PLAYERS'"
      class="end-round-timer">
      {{ this.localTimer }}
    </div>
    <div v-if="!iam && gameStatus != 'WAIT_FOR_PLAYERS'" class="domino-dice">
      {{ dominoDeckCount }}
    </div>
    <div v-if="!iam && gameStatus != 'WAIT_FOR_PLAYERS'" class="card-event" :style="cardEventCustomStyle"
      @click="toggleViewerShowCards">
      <div>
        {{ cardDeckCount }}
      </div>
    </div>
    <div v-if="showEndRoundBtn" class="action-btn end-round-btn"> {{ roundBtn.label || 'Закончить раунд' }}</div>
    <div v-if="showLeaveBtn" class="action-btn leave-game-btn">Выйти из игры</div>
    <div v-if="showCustomActionBtn && !showLeaveBtn" class="action-btn" :style="customAction.style || {}">
      {{ customAction.label }}
    </div>
    <div v-if="showTeamleadBtn" class="action-btn team-ready-btn">Команда готова</div>

    <div v-if="iam" class="tutorial-show action-btn end-round-btn"> {{ 'Закончить раунд' }}</div>
    <div v-if="iam && !this.localTimer" class="tutorial-show end-round-timer"> {{ '15' }}</div>
    <div v-if="!iam && !this.localTimer" class="tutorial-show card-event" :style="cardEventCustomStyle">
      <div>{{ "2" }}</div>
    </div>
    <div v-if="!iam && !this.localTimer" class="tutorial-show domino-dice">{{ "3" }}</div>
  </div>
</template>

<script>
import { inject } from 'vue';

export default {
  props: {
    playerId: String,
    viewerId: String,
    iam: Boolean,
    showControls: Boolean,
    dominoDeckCount: Number,
    cardDeckCount: Number,
  },
  data() {
    return {
      localTimer: null,
      localTimerUpdateTime: null,
      localTimerId: null,
      controlActionDisabled: false,
    };
  },
  setup() {
    return inject('gameGlobals');
  },
  computed: {
    state() {
      return this.$root.state || {};
    },
    game() {
      const store = this.getStore() || {};
      const player = store.player?.[this.playerId] || {};
      return this.getGame(player.gameId);
    },
    gameStatus() {
      return this.game.status || this.getSuperGame()?.status;
    },
    store() {
      return this.getStore();
    },
    userData() {
      return this.sessionUserData();
    },
    player() {
      const player = this.store.player?.[this.playerId] || {};
      // через watch не осилил (проблема при создании игры - "Vue cannot detect property addition or deletion")
      if (player.timerEndTime && this.localTimerUpdateTime !== player.timerUpdateTime) {
        clearTimeout(this.localTimerId);
        this.localTimer = Math.floor((player.timerEndTime - state.serverTimeDiff - Date.now()) / 1000);
        this.localTimerUpdateTime = player.timerUpdateTime;

        const self = this;
        this.localTimerId = setTimeout(function tick() {
          if (self.localTimer !== null) {
            self.localTimer--;
            if (self.localTimer < 0) self.localTimer = 0;
            self.localTimerId = setTimeout(tick, 1000);
          }
        }, 1000);
      }
      return player || {};
    },
    viewer() {
      return this.store.viewer?.[this.viewerId] || {};
    },
    customStyle() {
      const style = {};
      const gender = this.userData.gender;

      let avatarCode = `_default/${gender}_empty`;
      if (this.player.ready && this.player.avatarsMap?.[gender]) {
        avatarCode = this.player.avatarsMap[gender];
      }
      if (this.player.userId === this.state.currentUser && this.userData.avatarCode) {
        avatarCode = this.userData.avatarCode;
      }
      if (this.player.avatarCode) avatarCode = this.player.avatarCode;

      style.backgroundImage = `url(${this.state.lobbyOrigin}/img/workers/${avatarCode}.png)`;

      return style;
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
    customAction() {
      return this.gameState.cardWorkerAction || {};
    },
    selectable() {
      return this.sessionPlayer().eventData.player?.[this.playerId]?.selectable;
    },
    showEndRoundBtn() {
      return (
        this.showControls && this.iam && this.sessionPlayerIsActive() && !this.showLeaveBtn && !this.showCustomActionBtn
      );
    },
    roundBtn() {
      return this.player.eventData.roundBtn || {};
    },
    showLeaveBtn() {
      return (this.gameFinished() && this.iam) || this.viewerId;
    },
    showTeamleadBtn() {
      return this.iam && this.player.teamlead && this.gameStatus === 'WAIT_FOR_PLAYERS' && !this.player.eventData.teamReady;
    },
    showCustomActionBtn() {
      return this.iam && this.customAction.show;
    },
  },
  methods: {
    async controlAction() {
      if (this.controlActionDisabled) return;
      this.controlActionDisabled = true;
      this.hidePreviewPlanes();
      if (this.selectable) {
        const teamleadAction = this.sessionPlayer().teamlead ? true : null;
        await this.handleGameApi(
          {
            name: 'eventTrigger',
            data: { eventData: { targetId: this.playerId }, teamleadAction },
          },
          {
            onSuccess: () => (this.controlActionDisabled = false),
            onError: () => (this.controlActionDisabled = false),
          }
        );
        return;
      }

      if (this.customAction.sendApiData)
        return await api.action
          .call(this.customAction.sendApiData)
          .then(() => {
            this.controlActionDisabled = false;
            this.gameState.cardWorkerAction = {};
          })
          .catch(prettyAlert);
      if (this.showEndRoundBtn) return await this.endRound();
      if (this.showLeaveBtn) return await this.leaveGame();
      if (this.showTeamleadBtn) return await this.teamReady();

      this.controlActionDisabled = false; // сюда попадет tutorial-active
    },
    async endRound() {
      this.hideZonesAvailability();
      this.gameCustom.pickedDiceId = '';

      await this.handleGameApi(
        { name: 'roundEnd' },
        {
          onSuccess: () => (this.controlActionDisabled = false),
          onError: () => (this.controlActionDisabled = false),
        }
      );
    },
    async teamReady() {
      this.hideZonesAvailability();
      this.gameCustom.pickedDiceId = '';

      await this.handleGameApi(
        { name: 'teamReady' },
        {
          onSuccess: () => (this.controlActionDisabled = false),
          onError: () => (this.controlActionDisabled = false),
        }
      );
    },
    async leaveGame() {
      await api.action
        .call({
          path: 'game.api.leave',
          args: [],
        })
        .catch(prettyAlert);
    },
    toggleViewerShowCards() {
      if (!this.gameState.viewerMode) return;
      this.$set(this.gameCustom.viewerState.showCards, this.playerId, !this.gameCustom.viewerState.showCards[this.playerId]);
    },
  },
  mounted() { },
};
</script>

<style lang="scss" scoped>
.card-worker {
  position: relative;
  border: 1px solid;
  width: 120px;
  height: 180px;
  background-size: cover;
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  border-radius: 10px;
  margin: 0px 0px 0px 5px;
  box-shadow: inset 0px 20px 20px 0px black;

  &.teamlead>.teamlead-icon {
    display: block;
  }

  >.teamlead-icon {
    display: none;
    position: absolute;
    top: 8px;
    right: 4px;
    width: 24px;
    height: 24px;
    background-image: url(../assets/teamlead.png);
    background-size: 24px;
    background-repeat: no-repeat;
    background-position: center;
  }

  &.active {
    outline: 4px solid green;
  }

  &.selectable {

    .end-round-btn {
      display: none;
    }

    .end-round-timer {
      opacity: 0.5;
    }
  }

  &.has-action {
    cursor: pointer;

    &:hover .action-btn {
      background: green !important;
    }
  }

  .action-btn {
    position: absolute;
    bottom: 0px;
    width: 100px;
    font-size: 0.5em;
    border: 1px solid black;
    text-align: center;
    cursor: pointer;
    margin: 6px 10px;
    color: white;
    font-size: 16px;

    &:hover {
      opacity: 0.8;
    }

    &.end-round-btn {
      background: #3f51b5;
    }

    &.leave-game-btn {
      background: #bb3030;
    }

    &.team-ready-btn {
      background: green;
    }
  }

  &.disabled {
    .action-btn {
      opacity: 0.5;
    }
  }

  .end-round-timer {
    position: absolute;
    bottom: 50px;
    width: 100px;
    z-index: 1;
    font-size: 64px;
    color: white;
    border-radius: 50%;
    height: 100px;
    line-height: 100px;
    color: #ff5900;
    text-shadow: 4px 4px 0 #fff;
    margin: 0px 0px 10px 15px;
    padding-right: 10px;
    padding-top: 5px;
    padding-bottom: 10px;
    height: 80px;
    line-height: 80px;
    width: 80px;
  }

  .card-event {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 60px;
    height: 90px;
    color: white;
    border: none;
    font-size: 36px;
    display: flex;
    justify-content: center;
    align-content: center;

    >div {
      z-index: 1;
    }

    &::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 50%;
      width: 0px;
      height: 0px;
      opacity: 50%;
      z-index: 0;
      border-radius: 50%;
      box-shadow: 0px 0px 20px 20px black;
    }
  }

  .domino-dice {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 40px;
    height: 70px;
    color: white;
    border: none;
    font-size: 36px;
    line-height: 70px;
    display: flex;
    justify-content: center;
    align-content: center;
    background-image: url(../assets/dices/dice-back.png);
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    visibility: hidden;
  }

  .user-name {
    display: none;
    position: absolute;
    top: 0px;
    left: 0px;
    color: white;
    width: calc(100% - 8px);
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 4px;
    box-shadow: inset 0px 20px 20px 0px black;
    border-radius: 10px;
  }

  &:hover>.user-name {
    display: block;
  }
}

#game.mobile-view.portrait-view .card-worker {
  .card-event {
    left: auto;
    right: 0px;
  }

  .domino-dice {
    visibility: visible;
  }
}

.viewer-mode {
  .card-worker {
    .card-event {
      cursor: pointer;

      &:hover {
        color: green;
      }
    }
  }
}
</style>
