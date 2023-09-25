() =>
  class GameSession extends lib.user.session() {
    getUserClass() {
      return domain.user.class();
    }
  };
