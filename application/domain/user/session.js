() =>
  class ReleaseGameSession extends lib.game.sessionClass() {
    getUserClass() {
      return domain.user.class();
    }
  };
