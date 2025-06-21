<template>
  <div v-if="player._id || viewer._id" :class="[
    'player',
    ...customClass,
    iam ? 'iam' : '',
    player.active ? 'active' : '',
  ]">
    <div class="inner-content" :style="{ justifyContent: 'flex-end' }">
      <div class="player-hands" v-if="game.status != 'WAIT_FOR_PLAYERS'"
        :style="{ justifyContent: 'flex-end', maxWidth: (state.innerWidth - 200) + 'px' }">
        <div v-if="hasPlaneInHand" class="hand-planes" :style="{
          ...(iam
            ? { marginRight: state.isPortrait ? '-120px' : Math.max(500, 70 * planeInHandIds.length) + 'px' }
            : { marginLeft: (state.isPortrait ? -1 : 1) * (Math.max(150, 20 * planeInHandIds.length)) + 'px' })
        }">
          <plane v-if="iam && player.eventData?.fakePlaneAddBtn" :key="'fake'" :planeId="'fake'" :inHand="true"
            :class="['in-hand', 'add-block-action']" />
          <plane v-for="id in planeInHandIds" :key="id" :planeId="id" :inHand="true" :class="['in-hand']" />
        </div>

        <div v-if="!hasPlaneInHand" class="hand-dices-list">
          <div v-for="deck in dominoDecks" :key="deck._id" class="hand-dices-list-content">
            <div v-if="iam || showDecks || !state.isPortrait" class="hand-dices">
              <dice v-for="id in Object.keys(deck.itemMap)" :key="id" :diceId="id" :inHand="true" :iam="iam"
                :gameId="player.gameId" />
              <card v-if="iam && deck.subtype === 'teamlead'" :cardData="{ name: 'teamlead' }" />
              <card v-if="iam && deck.subtype === 'flowstate'" :cardData="{ name: 'flowstate' }" />
            </div>
          </div>
        </div>
        <div
          v-if="(iam || (gameState.viewerMode && gameCustom.viewerState.showCards[player._id] === true)) && !hasPlaneInHand"
          class="hand-cards-list"
          :style="gameState.viewerMode ? { width: handCardsWidth !== 'auto' ? parseInt(handCardsWidth) * 0.5 + 'px' : 'auto' } : {}"
          ref="scrollbar">
          <div v-for="deck in cardDecks" :key="deck._id" class="hand-cards" :style="{ width: handCardsWidth }">
            <card v-for="id in Object.keys(deck.itemMap)" :key="id" :cardId="id"
              :canPlay="iam && sessionPlayerIsActive()" />
          </div>
        </div>
      </div>

      <div class="tutorial-show-flex player-hands">
        <div class="hand-dices-list">
          <div class="hand-dices-list-content">
            <div class="hand-dices" :style="{ marginLeft: '20px' }">
              <dice v-if="!iam" :diceId="'fake'" />
              <dice v-if="!iam" :diceId="'fake'" />
              <dice v-if="!iam" :diceId="'fake'" />
            </div>
          </div>
        </div>
      </div>

      <div class="workers">
        <card-worker :playerId="playerId" :viewerId="viewerId" :iam="iam" :showControls="showControls"
          :dominoDeckCount="mainDominoDeckItemsCount" :cardDeckCount="mainCardDeckItemsCount" />
      </div>
    </div>
  </div>
</template>

<script>
import { inject } from 'vue';
import { PerfectScrollbar } from 'vue2-perfect-scrollbar';

import card from './card.vue';
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
      return this.store.player?.[this.playerId] || { eventData: {} };
    },
    viewer() {
      return this.store.viewer?.[this.viewerId] || {};
    },
    dominoDecks() {
      const decks = this.deckIds.map((id) => this.store.deck?.[id] || { itemMap: {} });

      if (!this.game.merged || this.game.gameConfig !== 'cooperative') {
        const result = decks.filter((deck) => deck.type === 'domino') || [];
        return result.sort((deck) => (deck.subtype ? -1 : 1));
      }

      // сделано не через player.active, чтобы рука не исчезала после окончания хода
      if (this.game.roundActivePlayerId !== this.playerId) return [];

      const gameDecks = Object.keys(this.game.deckMap).map((id) => this.store.deck?.[id] || { itemMap: {} });
      const commonDecks = gameDecks.filter((deck) => deck.subtype === 'common');
      const result = [...commonDecks, ...decks].filter((deck) => deck.type === 'domino' && deck.subtype) || [];
      return result.sort((deck) => (deck.subtype !== 'common' ? -1 : 1));
    },
    cardDecks() {
      const decks = this.deckIds.map((id) => this.store.deck?.[id] || { itemMap: {} });

      if (!this.game.merged || this.game.gameConfig !== 'cooperative') {
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
      ).map((id) => this.store.plane?.[id] ? id : 'fake' + id)
        .sort((a, b) => (this.store.plane?.[a]?.customClass?.includes('card-plane') ? 1 : 0) - (this.store.plane?.[b]?.customClass?.includes('card-plane') ? 1 : 0));
    },
    hasPlaneInHand() {
      return this.planeInHandIds.length > 0;
    },
    sessionPlayerEventData() {
      return this.sessionPlayer().eventData;
    },
    showDecks() {
      return this.sessionPlayerIsActive() && this.sessionPlayerEventData.player?.[this.playerId]?.showDecks;
    },
    handCardsWidth() {
      const cardWidth = 120;
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
#game {
  $card-width: 130px;
  $max-card-stack: 4;
  $plane-height: 250px;
  $plane-width: 500px;

  &.debug {
    .player.iam {
      .hand-planes {
        max-width: 1000px;
      }
    }
  }

  &.mobile-view {
    .player.iam {
      >.inner-content {
        >.player-hands {
          flex-wrap: nowrap;

          .plane.add-block-action {
            z-index: 5;
          }
        }
      }
    }

    .hand-cards-list {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 400px;

      .hand-cards {
        margin-top: 130px;
      }
    }

    &.portrait-view {
      .player {
        &:not(.iam) {
          >.inner-content {
            flex-direction: row;

            .hand-planes {
              flex-wrap: wrap;
              flex-direction: column-reverse;
              align-items: flex-end;

              .plane.in-hand {
                transform: scale(0.4);
                transform-origin: top right;
                margin: 0px 0px 150px -450px;
                order: 0;

                @for $i from 1 through 10 {
                  &:nth-child(#{$i}) {
                    margin-bottom: calc(-20px + (30px * ($i - 1))) !important;

                    &:hover {
                      margin-bottom: calc(20px + (30px * ($i - 1))) !important;
                    }

                    &.card-plane {
                      order: -1;
                      z-index: 2;
                      margin: 280px -150px 260px -220px !important;
                    }
                  }
                }
              }
            }
          }
        }

        &.iam {
          .hand-planes {
            align-items: flex-end;
            justify-content: flex-start;
            margin-bottom: 200px;
            margin-right: 40px;
            display: flex;
            flex-direction: column-reverse;
            height: auto;
            flex-wrap: nowrap;

            .plane.in-hand:not(.card-plane) {
              transform: scale(0.4);
              transform-origin: top right;
              margin: 25px 0px -200px 0px;
            }

            .plane.in-hand.card-plane {
              margin: 0px 130px -210px 0px;

              &:hover {
                margin-bottom: -210px !important;
              }
            }

            .plane.add-block-action {
              left: auto;
              bottom: 140px;
            }
          }
        }
      }

      .player-hands {
        justify-content: flex-start;
        height: initial;
      }

      .hand-dices {
        .card-event {
          display: none;
        }
      }
    }

    &.landscape-view {
      .hand-cards-list {
        @media only screen and (max-height: 360px) {
          max-height: 300px;
        }
      }
    }
  }

  &:not(.mobile-view) {
    .hand-cards-list {
      .hand-cards {
        margin-left: 10px;
        max-height: 250px;
        flex-direction: column;
      }
    }
  }

  &.viewer-mode {
    .hand-dices-list {
      >.hand-dices-list-content {
        z-index: 1;
        transform: scale(0.7);
        transform-origin: bottom left;
      }
    }
  }
}

.player {
  &:not(.iam) {
    position: relative;
    margin-top: 10px;

    >.inner-content {
      display: flex;
      align-items: flex-end;
      flex-direction: row-reverse;

      .player-hands {
        justify-content: flex-start !important;

        .hand-planes {
          height: 0px;
          margin-left: 200px;
        }
      }

      .hand-cards-list {
        order: -1;

        .hand-cards {
          scale: 0.5;
          transform-origin: left bottom;
        }
      }
    }

    .plane.in-hand {
      z-index: 1;
      flex-shrink: 0;
      // margin-right: -450px !important;
      // margin-bottom: -50px !important;

      &:not(.card-plane) {
        box-shadow: inset 0px 0px 20px 10px black;
        margin: 0px 0px 150px -450px;
        order: -1;

        &:hover {
          margin-bottom: 190px !important;
          cursor: pointer;
          z-index: 4;
        }
      }

      &.fake>.custom-bg {
        display: none;
      }

      @for $i from 1 through 10 {
        &:nth-child(#{$i}) {
          margin-bottom: calc(150px + (30px * ($i - 1))) !important;

          &:hover {
            margin-bottom: calc(190px + (30px * ($i - 1))) !important;
          }

          &.card-plane {
            order: 0;
            z-index: 2;
            margin: 180px 0px 260px -160px !important;
          }
        }
      }

      &.card-plane {
        order: 0;
        z-index: 2;
        margin: 180px 0px 260px -160px;

        >.price {
          display: none;
        }

        &:hover {
          margin-bottom: 300px !important;
        }
      }
    }
  }

  &.iam {
    >.inner-content {
      display: flex;
      align-items: flex-end;
      position: absolute;
      right: 0px;
      bottom: 0px;
      height: 0px;
    }

    .card-worker {
      .user-name {
        display: none !important;
      }
    }

    .plane {
      &.in-hand {
        z-index: 1;
        background-size: contain;

        &:not(.card-plane) {
          order: 0;
          margin: 125px -180px 300px -400px;

          &:hover {
            z-index: 4;
            opacity: 1;
            margin-bottom: 340px;
            cursor: pointer;
          }
        }

        &.card-plane {
          order: -1;
          z-index: 2;
          margin: 180px 0px 260px -160px;

          >.price {
            font-size: 24px;
          }

          &:hover {
            margin-bottom: 300px !important;
            cursor: pointer;
          }
        }

        &.add-block-action {
          background-size: cover;
          transform-origin: center;
          flex-shrink: 0;
          position: absolute;
          z-index: 0;
          width: 200px;
          height: 100px;
          bottom: 70px;
          left: -220px;
          border-radius: 10px;
          margin: 0px !important;

          &::after {
            display: none;
          }

          >.custom-bg {
            display: none;
          }

          &::before {
            content: '+';
            background: rgb(0 255 0 / 40%);
            display: block;
            z-index: 1;
            font-size: 100px;
            color: white;
            text-align: left;
            padding-left: 20px;
            width: 180px;
            height: 100%;
            line-height: 100px;
            border-radius: 10px;
          }

          &:hover {
            // right: -50px;
            left: -280px;
            width: 500px;
            height: 250px;
            bottom: -36px;

            &::after {
              display: block;
            }

            >.custom-bg {
              display: flex;
            }

            &::before {
              content: "+";
              padding-left: 8px;
              width: 100%;
            }
          }

          >.price {
            display: none !important;
          }
        }

        &:hover>.price {
          display: block;
        }
      }
    }

    .hand-planes {
      height: 0px;
      width: 100%;
      justify-content: flex-end;

      &::before {
        // content: '';
        width: 100%;
        position: absolute;
        bottom: 0px;
        height: 70px;
        background: #00000099;
        z-index: 2;
      }
    }
  }

  .plane {
    .domino-dice {
      opacity: 0.5;
      cursor: pointer !important;

      >.controls {
        display: none !important;
      }
    }

    &.in-hand {
      transform: scale(0.5);
      transform-origin: center right;
    }

    // &:hover {
    // z-index: 4 !important;
    // opacity: 1;
    // cursor: pointer;
    // }
  }
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

  >.ps {
    >.ps__rail-y {
      display: none !important;
    }
  }
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;

  >.card-event {
    margin-top: -130px;
  }
}

.hand-dices-list {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  height: auto;
  width: auto;

  >.hand-dices-list-content {
    width: 0px;
    height: 150px;
    position: relative;
  }
}

.hand-dices {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 0px;

  position: absolute;
  left: 0px;
  bottom: 0px;
  height: 0px;
  width: auto;
  transform-origin: left bottom;

  .domino-dice {
    height: 140px;
    width: 70px;
  }

  .card-event {
    scale: 0.7;
    transform-origin: bottom;
  }
}

.player.iam,
#game.mobile-view.portrait-view {
  .hand-dices {
    right: 0px;
    transform-origin: right bottom;
  }
}

.hand-planes {
  display: flex;
  justify-content: center;
  align-items: center;
  // margin-right: 540px;

  &::after {
    // content: '';
    width: 540px;
    flex-shrink: 0;
  }

  >.plane {
    flex-shrink: 2;
    position: relative;

    &.card-plane {
      flex-shrink: 0;

      .port-wraper {
        display: none;
      }
    }

    >.price {
      display: none;
    }
  }

  >.ps__rail-x {
    left: auto !important;
    right: 0px;
  }
}

.workers {
  z-index: 3;
}

.deck-counters {
  position: absolute;
  color: white;
  font-size: 24px;
  width: 100%;
  right: 0px;
  bottom: 0px;
  text-align: right;

  b {
    font-size: 42px;
  }
}
</style>
