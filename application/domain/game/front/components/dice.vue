<template>
  <div v-if="dice" :code="dice.code" :class="[
    'domino-dice',
    dice.deleted ? 'deleted' : '',
    locked ? 'locked' : '',
    selectable ? 'selectable' : '',
    hide ? 'hide' : '',
    isPicked ? 'picked' : '',
  ]" v-on:click="(e) => (selectable ? chooseDice() : pickDice())">
    <div v-if="!locked && !zone?.available && !this.gameState.viewerMode" class="controls">
      <div :class="['control rotate', dice.deleted ? 'hidden' : '']" v-on:click.stop="rotateDice">
        <font-awesome-icon :icon="['fas', 'rotate']" size="2xl" style="color: #f4e205" />
      </div>
      <div :class="['control', 'fake-rotate', 'disabled', dice.deleted ? 'hidden' : '']" v-on:click.stop>
        <font-awesome-icon :icon="['fas', 'rotate']" size="2xl" style="color: #ccc" />
      </div>
      <div :class="['control', 'disabled', replaceAllowed || dice.deleted ? 'hidden' : '']">
        <font-awesome-icon :icon="['fass', 'trash']" size="2xl" style="color: #ccc" />
      </div>
      <div :class="['control', replaceAllowed && !dice.deleted ? '' : 'hidden']" v-on:click.stop="deleteDice">
        <font-awesome-icon :icon="['fass', 'trash']" size="2xl" style="color: #f4e205" />
      </div>
      <div :class="['control', replaceAllowed && dice.deleted ? '' : 'hidden']" v-on:click.stop="restoreDice">
        <font-awesome-icon :icon="['fas', 'trash-arrow-up']" size="2xl" style="color: #f4e205" />
      </div>
    </div>
    <template>
      <div v-for="side in sideList" :key="side._id" :value="side.value" :class="[
        'el',
        'template-' + (sourceGame.templates.code || 'default'),
        side.eventData.selectable ? 'selectable' : '',
        side.eventData.fakeValue ? 'fake-value' : '',
      ]" v-on:click="
        (e) => (side.eventData.selectable ? (e.stopPropagation(), openDiceSideValueSelect(side._id)) : null)
      ">
        <dice-side-value-select v-if="gameCustom.selectedDiceSideId === side._id" v-on:select="pickActiveEventDiceSide"
          :templateClass="'template-' + (sourceGame.templates.code || 'default')" />
      </div>
    </template>
  </div>
</template>

<script>
import { inject } from 'vue';
import diceSideValueSelect from './diceSideValueSelect.vue';

export default {
  components: {
    diceSideValueSelect,
  },
  props: {
    diceId: String,
    inHand: Boolean,
    iam: Boolean,
    zone: Object,
    gameId: String,
  },
  setup() {
    return inject('gameGlobals');
  },

  computed: {
    state() {
      return this.$root.state || {};
    },
    store() {
      return this.getStore();
    },
    game() {
      return this.getGame(this.gameId || this.dice.sourceGameId);
    },
    sessionPlayerEventData() {
      return this.sessionPlayer().eventData;
    },
    sourceGame() {
      return this.getGame(this.dice.sourceGameId);
    },
    dice() {
      return this.store.dice?.[this.diceId];
    },
    sideList() {
      const sideList = this.dice.sideList || ['', ''];
      const result = sideList.map(id => {
        let side = this.store.diceside?.[id];
        const sideId = side?._id;
        if (!sideId) side = { eventData: {} };

        side.eventData.selectable = this.sessionPlayerEventData.dside?.[sideId] ? true : false;

        return side;
      });
      return result;
    },
    locked() {
      return this.dice.locked || this.actionsDisabled();
    },
    selectable() {
      return this.sessionPlayerIsActive() && this.sessionPlayerEventData.dice?.[this.diceId]?.selectable;
    },
    hide() {
      return this.inHand && !this.iam && !this.dice.visible && !this.gameState.viewerMode;
    },
    replaceAllowed() {
      return this.dice.placedAtRound !== this.currentRound();
    },
    isPicked() {
      return this.gameCustom.pickedDiceId === this.diceId;
    },
  },
  methods: {
    async chooseDice() {
      await this.handleGameApi({
        name: 'eventTrigger',
        data: {
          eventData: {
            targetId: this.diceId,
            targetPlayerId: this.$parent.playerId,
          },
        },
      });
    },
    openDiceSideValueSelect(targetId) {
      this.gameCustom.selectedDiceSideId = targetId;
    },
    async pickActiveEventDiceSide(fakeValue) {
      await this.handleGameApi({
        name: 'eventTrigger',
        data: { eventData: { targetId: this.gameCustom.selectedDiceSideId, fakeValue } },
      });
      this.gameCustom.selectedDiceSideId = '';
    },
    async pickDice() {
      if (!this.iam) return;
      if (this.locked) return;
      this.hideZonesAvailability();
      if (this.isPicked) {
        this.gameCustom.pickedDiceId = '';
      } else {
        this.gameCustom.pickedDiceId = this.diceId;
        await this.handleGameApi({ name: 'showZonesAvailability', data: { diceId: this.diceId } });
      }
    },
    async rotateDice() {
      await this.handleGameApi({ name: 'rotateDice', data: { diceId: this.diceId } });
      if (this.gameCustom.pickedDiceId) {
        await this.handleGameApi({
          name: 'showZonesAvailability',
          data: { diceId: this.gameCustom.pickedDiceId },
        });
      }
    },
    async deleteDice() {
      await this.handleGameApi({ name: 'deleteDice', data: { diceId: this.diceId } });
      if (this.gameCustom.pickedDiceId) {
        await this.handleGameApi({
          name: 'showZonesAvailability',
          data: { diceId: this.gameCustom.pickedDiceId },
        });
      }
    },
    async restoreDice() {
      await this.handleGameApi({ name: 'restoreDice', data: { diceId: this.diceId } });
      if (this.gameCustom.pickedDiceId) {
        await this.handleGameApi({
          name: 'showZonesAvailability',
          data: { diceId: this.gameCustom.pickedDiceId },
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.domino-dice {
  width: 100%;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  &.tutorial-active {
    box-shadow: 0 0 10px 10px #f4e205 !important;
  }
}

.domino-dice.deleted {
  transform: scale(0.5);
}

.domino-dice.hide>.el {
  background-image: none;
  background: black !important;
}

.plane .domino-dice,
.player.iam .hand-dices .domino-dice {
  cursor: pointer;
}

#game.viewer-mode .domino-dice {
  cursor: default;
}

.domino-dice.locked {
  opacity: 0.5;
  cursor: default !important;
}

.domino-dice>.controls {
  display: none;
  position: absolute;
  width: 100%;
  height: 100%;
  background: darkgrey;
  opacity: 0.9;
  color: white;
  z-index: 1;
  border-radius: 16px;
}

.zone.vertical .domino-dice>.controls {
  flex-wrap: wrap;
}

.zone.vertical .domino-dice>.controls>.control {
  height: 33.333%;
}

.plane .domino-dice:hover:not(.selectable)>.controls,
.bridge .domino-dice:hover:not(.selectable)>.controls {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.domino-dice>.controls>.control {
  width: 100%;
  height: 100%;
}

.domino-dice>.controls>.control>svg {
  width: 50%;
  height: 100%;
}

.domino-dice>.controls>.control:not(.disabled):hover>svg {
  color: white !important;
}

.rotate180 .domino-dice>.controls {
  transform: rotate(180deg);
}

.rotate90 .domino-dice>.controls>.control {
  transform: rotate(270deg);
}

.rotate270 .domino-dice>.controls>.control {
  transform: rotate(90deg);
}

.domino-dice>.controls>.control.disabled {
  cursor: default;
}

.domino-dice>.controls>.control.fake-rotate,
.domino-dice>.controls>.control.hidden {
  display: none;
}

.bridge .domino-dice>.controls>.control.fake-rotate:not(.hidden) {
  display: block;
}

.bridge .domino-dice>.controls>.control.rotate {
  display: none;
}

.domino-dice>.el {
  position: relative;
  flex-shrink: 0;
  float: left;
  width: 70px;
  height: 70px;
  border-radius: 15px;
  background-image: url(../assets/dices/default.png);

  &.template-team1 {
    background-image: url(../assets/dices/team1.png);
  }

  &.template-team2 {
    background-image: url(../assets/dices/team2.png);
  }

  &.template-team3 {
    background-image: url(../assets/dices/team3.png);
  }

  &.template-team4 {
    background-image: url(../assets/dices/team4.png);
  }
}

.player.iam .hand-dices .domino-dice.picked>.el,
.player.iam .hand-dices .domino-dice:not(.locked):hover>.el {
  box-shadow: inset 0 0 20px 8px lightgreen;
}

.domino-dice>.el.selectable:hover {
  box-shadow: inset 0 0 20px 8px lightgreen !important;
}

.domino-dice.selectable {
  box-shadow: none !important;
}

.domino-dice.selectable>.el {
  box-shadow: inset 0 0 20px 8px yellow;
}

.domino-dice.selectable:hover>.el {
  opacity: 0.7;
}

.domino-dice>.el.fake-value {
  box-shadow: inset 0 0 20px 8px orange;
}

.domino-dice>.el {
  background-position: -497px !important;
}

.domino-dice>.el[value='0'] {
  background-position: -0px !important;
}

.domino-dice>.el[value='1'] {
  background-position: -71px !important;
}

.domino-dice>.el[value='2'] {
  background-position: -142px !important;
}

.domino-dice>.el[value='3'] {
  background-position: -213px !important;
}

.domino-dice>.el[value='4'] {
  background-position: -284px !important;
}

.domino-dice>.el[value='5'] {
  background-position: -355px !important;
}

.domino-dice>.el[value='6'] {
  background-position: -426px !important;
}

#game.debug {
  .domino-dice {
    opacity: 0.5;
  }
}
</style>
