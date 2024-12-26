<template>
  <div
    v-if="player._id || viewer._id"
    :class="['player', ...customClass, iam ? 'iam' : '', player.active ? 'active' : '']"
    :team="game.teamCode"
  >
    <div class="inner-content" :style="{ justifyContent: 'flex-end' }">
      <div class="player-hands" v-if="game.status != 'WAIT_FOR_PLAYERS'" :style="{ justifyContent: 'flex-end' }">
        <perfect-scrollbar v-if="hasPlaneInHand" :style="{ width: '50%' }">
          <div class="hand-planes">
            <plane v-for="id in planeInHandIds" :key="id" :planeId="id" :inHand="true" />
          </div>
        </perfect-scrollbar>

        <div v-if="!hasPlaneInHand" class="hand-dices-list">
          <div v-for="deck in dominoDecks" :key="deck._id" class="hand-dices-list-content">
            <div
              v-if="iam || showDecks || !state.isPortrait"
              class="hand-dices"
              :style="
                iam || (state.isMobile && state.isPortrait)
                  ? {
                      position: 'absolute',
                      right: '0px',
                      bottom: '0px',
                      height: '0px',
                      width: 'auto',
                      transformOrigin: 'right bottom',
                    }
                  : {
                      position: 'absolute',
                      left: '0px',
                      bottom: '0px',
                      height: '0px',
                      width: 'auto',
                      transformOrigin: 'left bottom',
                    }
              "
            >
              <dice v-for="id in Object.keys(deck.itemMap)" :key="id" :diceId="id" :inHand="true" :iam="iam" />
              <card v-if="iam && deck.subtype === 'teamlead'" :cardData="{ name: 'teamlead' }" />
              <card v-if="iam && deck.subtype === 'flowstate'" :cardData="{ name: 'flowstate' }" />
            </div>
          </div>
        </div>
        <div v-if="(iam || gameState.viewerMode) && !hasPlaneInHand" class="hand-cards-list" ref="scrollbar">
          <div v-for="deck in cardDecks" :key="deck._id" class="hand-cards" :style="{ width: handCardsWidth }">
            <card
              v-for="id in Object.keys(deck.itemMap)"
              :key="id"
              :cardId="id"
              :canPlay="iam && sessionPlayerIsActive()"
            />
          </div>
        </div>
      </div>
      <div class="workers">
        <card-worker
          :playerId="playerId"
          :viewerId="viewerId"
          :iam="iam"
          :showControls="showControls"
          :dominoDeckCount="mainDominoDeckItemsCount"
          :cardDeckCount="mainCardDeckItemsCount"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';

import card from '~/lib/game/front/components/card.vue';

import plane from './plane.vue';
import dice from './dice.vue';
import cardWorker from './cardWorker.vue';

export default {
  components: {
    PerfectScrollbar,
    plane,
    dice,
    card,
    cardWorker,
  },
  props: {
    customClass: Array,
    playerId: String,
    viewerId: String,
    iam: Boolean,
    showControls: Boolean,
  },
  data() {
    return {};
  },
  watch: {
    mainCardDeckItemsCount: function () {
      this.$nextTick(() => {
        const scrollbar = this.$refs.scrollbar;
        if (!scrollbar) return; // !!! тут соперник - нужно поправить логику
        scrollbar.scrollTo({ top: 1000000 }); // просто высоты экрана может быть не достаточно при большом количестве карт в руке
      });
    },
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
      return this.getGame(this.player.gameId);
    },
    player() {
      return this.store.player?.[this.playerId] || {};
    },
    viewer() {
      return this.store.viewer?.[this.viewerId] || {};
    },
    dominoDecks() {
      const decks = this.deckIds.map((id) => this.store.deck?.[id] || {});

      if (!this.game.merged) {
        const result = decks.filter((deck) => deck.type === 'domino') || [];
        return result.sort((deck) => (deck.subtype ? -1 : 1));
      }

      // сделано не через player.active, чтобы рука не исчезала после окончания хода
      if (this.game.roundActivePlayerId !== this.playerId) return [];

      const gameDecks = Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id] || {});
      const commonDecks = gameDecks.filter((deck) => deck.subtype === 'common');
      const result = [...commonDecks, ...decks].filter((deck) => deck.type === 'domino' && deck.subtype) || [];
      return result.sort((deck) => (deck.subtype !== 'common' ? -1 : 1));
    },
    cardDecks() {
      const decks = this.deckIds.map((id) => this.store.deck?.[id] || {});

      if (!this.game.merged) {
        return decks.filter((deck) => deck.type === 'card') || [];
      }

      // сделано не через player.active, чтобы рука не исчезала после окончания хода
      if (this.game.roundActivePlayerId !== this.playerId) return [];

      const gameDecks = Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id] || {});
      const commonDecks = gameDecks.filter((deck) => deck.subtype === 'common');
      return [...commonDecks, ...decks].filter((deck) => deck.type === 'card' && deck.subtype) || [];
    },
    mainDominoDeckItemsCount() {
      return Object.keys(this.dominoDecks[0]?.itemMap || {}).length || 0;
    },
    mainCardDeckItemsCount() {
      return Object.keys(this.cardDecks[0]?.itemMap || {}).length || 0;
    },
    deckIds() {
      return Object.keys(this.player.deckMap || {});
    },
    planeInHandIds() {
      return Object.keys(
        this.deckIds.map((id) => this.store.deck?.[id]).find((deck) => deck.type === 'plane')?.itemMap || {}
      );
    },
    hasPlaneInHand() {
      return this.planeInHandIds.length > 0;
    },
    showDecks() {
      return this.sessionPlayerIsActive() && this.player.eventData.showDecks;
    },
    handCardsWidth() {
      const cardWidth = 130;
      const maxCardStack = 4;

      return !state.isMobile
        ? `${Math.ceil(this.mainCardDeckItemsCount / maxCardStack) * cardWidth}px`
        : this.mainCardDeckItemsCount > 0
        ? `${cardWidth}px`
        : 'auto';
    },
  },
  methods: {},
};
</script>

<style lang="scss">
.player:not(.iam) {
  position: relative;
  margin-top: 10px;
}
.player:not(.iam) > .inner-content {
  display: flex;
  align-items: flex-end;
  flex-direction: row-reverse;
}
#game.mobile-view.portrait-view .player:not(.iam) > .inner-content {
  flex-direction: row;
}

.player.iam > .inner-content {
  display: flex;
  align-items: flex-end;
  position: absolute;
  right: 0px;
  bottom: 0px;
  height: 0px;
}
#game.mobile-view .player.iam > .inner-content > .player-hands {
  flex-wrap: nowrap;
}
#game.mobile-view .player.iam > .hand-planes {
  transform: scale(0.5);
  width: 200%;
  height: 50%;
  transform-origin: top;
  left: -50%;
  bottom: -25%;
}

.workers {
  z-index: 1; /* карточка воркера должна быть видна при размещении игровых зон из руки */
}

.player-hands {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  padding: 0px 10px;
  flex-direction: row;
  position: relative;
  height: 0px;
  width: 100%;

  .hand-cards-list {
    &.tutorial-active {
      box-shadow: 0 0 10px 10px #f4e205 !important;
    }
  }
}
#game.mobile-view.portrait-view .player-hands {
  justify-content: flex-start;
  height: initial;
}
#game:not(.mobile-view) .hand-cards-list {
  .hand-cards {
    max-height: 250px;
    flex-direction: column;
  }
}
#game.mobile-view .hand-cards-list {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 400px;
  .hand-cards {
    margin-top: 130px;
  }
}
#game.mobile-view.landscape-view .hand-cards-list {
  @media only screen and (max-height: 360px) {
    max-height: 300px;
  }
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;
}
.hand-cards > .card-event {
  margin-top: -130px;
}

.hand-dices-list {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  height: auto;
  width: auto;
}
.hand-dices-list > .hand-dices-list-content {
  width: 0px;
  height: 150px;
  position: relative;
}
#game.viewer-mode .hand-dices-list > .hand-dices-list-content {
  z-index: 1;
  transform: scale(0.7);
  transform-origin: bottom left;
}
.hand-dices {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-end;
  align-items: flex-end;
  width: 100%;
  padding: 0px;
  width: 0px;
}
.hand-dices .domino-dice {
  height: 140px;
  width: 70px;
}
.hand-dices .card-event {
  scale: 0.7;
  transform-origin: bottom;
}
#game.mobile-view.portrait-view .hand-dices .card-event {
  display: none;
}

.hand-planes {
  display: flex;
  justify-content: center;
  align-items: center;

  &::after {
    content: '';
    width: 200px;
    flex-shrink: 1;
  }

  > .plane {
    flex-shrink: 2;

    &.card-plane {
      flex-shrink: 0;

      .port-wraper {
        display: none;
      }
    }
  }

  > .ps__rail-x {
    left: auto !important;
    right: 0px;
  }
}
#game.mobile-view.portrait-view .hand-planes {
  flex-wrap: wrap;
  align-items: flex-end;
}
.player.iam .hand-planes {
  height: 0px;
  width: 100%;
  margin-bottom: 175px;
}

#game.debug {
  .player.iam .hand-planes {
    max-width: 1000px;
  }
}

#game.mobile-view.portrait-view .player.iam .hand-planes {
  height: initial;
  margin-bottom: 0px;
}
.hand-planes .plane {
  position: relative;
}
.hand-planes .plane > .price {
  display: block !important;
}
.player.iam .hand-planes .plane:hover {
  cursor: pointer;
}

.deck-counters {
  position: absolute;
  color: white;
  font-size: 24px;
  width: 100%;
  right: 0px;
  bottom: 0px;
  text-align: right;
}
.deck-counters b {
  font-size: 42px;
}
</style>
