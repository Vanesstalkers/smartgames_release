<template>
  <div
    v-if="player._id || viewer._id"
    :id="player._id"
    :class="[
      'card-worker',
      'card-worker-' + player.code,
      player.active ? 'active' : '',
      selectable ? 'selectable' : '',
      showEndRoundBtn || showLeaveBtn ? 'has-action' : '',
    ]"
    :style="customStyle"
    @click="controlAction"
  >
    <div v-if="showEndRoundBtn" class="action-btn end-round-btn">Закончить раунд</div>
    <div v-if="player.active && player.timerEndTime && game.status != 'WAIT_FOR_PLAYERS'" class="end-round-timer">
      {{ this.localTimer }}
    </div>
    <div v-if="!iam && game.status != 'WAIT_FOR_PLAYERS'" class="domino-dice">
      {{ dominoDeckCount }}
    </div>
    <div v-if="!iam && game.status != 'WAIT_FOR_PLAYERS'" class="card-event">
      {{ cardDeckCount }}
    </div>
    <div v-if="showLeaveBtn" class="action-btn leave-game-btn">Выйти из игры</div>
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
  },
  data() {
    return {
      localTimer: null,
      localTimerUpdateTime: null,
      localTimerId: null,
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
      return this.getGame();
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

      style.backgroundImage = `url(${this.state.lobbyOrigin}/img/workers/${avatarCode}.png)`;

      return style;
    },
    selectable() {
      return this.sessionPlayerIsActive() && this.player.eventData.selectable;
    },
    dominoDeckCount() {
      return (
        Object.keys(
          Object.keys(this.player.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'domino' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },
    cardDeckCount() {
      return (
        Object.keys(
          Object.keys(this.player.deckMap || {})
            .map((id) => this.store.deck?.[id] || {})
            .filter((deck) => deck.type === 'card' && !deck.subtype)[0]?.itemMap || {}
        ).length || 0
      );
    },
    showEndRoundBtn() {
      return this.showControls && this.iam && this.sessionPlayerIsActive();
    },
    showLeaveBtn() {
      return (this.game.status === 'FINISHED' && this.iam) || this.viewerId;
    },
  },
  methods: {
    async controlAction() {
      if (this.selectable) {
        await this.handleGameApi({
          name: 'eventTrigger',
          data: { eventData: { targetId: this.playerId } },
        });
        return;
      }
      if (this.showEndRoundBtn) return await this.endRound();
      if (this.showLeaveBtn) return await this.leaveGame();
    },

    async endRound() {
      this.hideZonesAvailability();
      this.gameCustom.pickedDiceId = '';

      await this.handleGameApi({ name: 'endRound' });
    },
    async leaveGame() {
      await api.action
        .call({
          path: 'game.api.leave',
          args: [],
        })
        .catch(prettyAlert);
    },
  },
  mounted() {},
};
</script>

<style scoped>
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
}
.card-worker.has-action {
  cursor: pointer;
}
.card-worker.has-action:hover .action-btn {
  background: green;
}
.card-worker.active {
  outline: 4px solid green;
}

.card-worker .card-event {
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
  background-image: url(../assets/back-side.jpg);
}
#game.mobile-view.portrait-view .card-worker .card-event {
  left: auto;
  right: 0px;
}
.card-worker .domino-dice {
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
  background-image: url(../assets/dice.png);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  visibility: hidden;
}
#game.mobile-view.portrait-view .card-worker .domino-dice {
  visibility: visible;
}

.card-worker.selectable .end-round-btn,
.card-worker.selectable .end-round-timer {
  display: none;
}

.end-round-btn {
  position: absolute;
  bottom: 0px;
  width: 100px;
  font-size: 0.5em;
  border: 1px solid black;
  text-align: center;
  cursor: pointer;
  margin: 6px 10px;
  background: #3f51b5;
  color: white;
  font-size: 16px;
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
.leave-game-btn {
  position: absolute;
  bottom: 0px;
  width: 100px;
  font-size: 0.5em;
  border: 1px solid black;
  text-align: center;
  cursor: pointer;
  margin: 6px 10px;
  background: #bb3030;
  color: white;
  font-size: 16px;
}
</style>
