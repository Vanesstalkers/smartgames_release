() =>
  class LobbyUser extends lib.user.class() {
    async enterLobby({ sessionId, lobbyId }) {
      const {
        helper: { getTutorial },
        utils: { structuredClone: clone },
        store: {
          broadcaster: { publishAction },
        },
      } = lib;

      await publishAction(`lobby-${lobbyId}`, 'userEnter', {
        sessionId,
        userId: this.id(),
        name: this.name,
        tgUsername: this.tgUsername,
      });

      let { currentTutorial = {}, helper = null, helperLinks = {}, finishedTutorials = {} } = this;

      if (currentTutorial.active?.includes('game-') && !this.gameId) {
        this.set({ currentTutorial: null, helper: null });
        currentTutorial = null;
        helper = null;
      }

      const tutorialName = 'lobby-tutorial-start';
      if (!helper && !finishedTutorials[tutorialName]) {
        const tutorial = getTutorial(tutorialName);
        helper = Object.values(tutorial).find(({ initialStep }) => initialStep);
        helper = clone(helper, { convertFuncToString: true });
        currentTutorial = { active: tutorialName };
      }
      helperLinks = {
        ...domain.lobby.tutorial.getHelperLinks(),
        ...helperLinks,
      };

      this.set({ currentTutorial, helper, helperLinks });
      await this.saveChanges();
    }
    async leaveLobby({ sessionId, lobbyId }) {
      if (this.currentTutorial?.active) {
        this.set({ currentTutorial: null, helper: null });
      }

      const lobbyName = `lobby-${lobbyId}`;
      await lib.store.broadcaster.publishAction(lobbyName, 'userLeave', {
        sessionId,
        userId: this.id(),
      });
    }
  };
