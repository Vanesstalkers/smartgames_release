<template>
  <div v-if="player._id || viewer._id" :id="player._id" :class="[
    'card-worker',
    'card-worker-' + player.code,
    player.active ? 'active' : '',
    selectable ? 'selectable' : '',
    showEndRoundBtn || showLeaveBtn || showCustomActionBtn ? 'has-action' : '',
    controlActionDisabled ? 'disabled' : '',
  ]" :style="customStyle" @click="controlAction">
    <div v-if="showControls && player.active && player.timerEndTime && game.status != 'WAIT_FOR_PLAYERS'"
      class="end-round-timer">
      {{ this.localTimer }}
    </div>
    <div v-if="!iam && game.status != 'WAIT_FOR_PLAYERS'" class="domino-dice">
      {{ dominoDeckCount }}
    </div>
    <div v-if="!iam && game.status != 'WAIT_FOR_PLAYERS'" class="card-event" :style="cardEventCustomStyle"
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
    store() {
      return this.getStore();
    },
    userData() {
      return this.state.store?.user?.[this.state.currentUser] || {};
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

      if (this.player.removed) avatarCode = `_default/${gender}_empty`;
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
        await this.handleGameApi(
          {
            name: 'eventTrigger',
            data: { eventData: { targetId: this.playerId } },
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
      console.log('toggleViewerShowCards', { playerId: this.playerId, viewerState: this.gameCustom.viewerState.showCards[this.playerId] });
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

  &.active {
    outline: 4px solid green;
  }

  &.selectable {

    .end-round-btn,
    .end-round-timer {
      display: none;
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

    &.end-round-btn {
      background: #3f51b5;
    }

    &.leave-game-btn {
      background: #bb3030;
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
    margin: 10px;
    color: #ff5900;
    text-shadow: 4px 4px 0 #fff;
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
