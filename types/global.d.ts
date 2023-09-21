/* This import should not be removed. We need to reference impress explicitly
 * so that tsc correctly resolved global variables.
 * For some odd reason using typeRoots results in an array of errors.
 * The problem should have been fixed by having an index file but no luck.
 * PR with the correct fix would be greatly appreciated. */
import * as _impress from 'impress';

import * as _metasql from 'metasql';
import { Database } from 'metasql';

import { Database as MongoDB } from '../application/db/mongo/types';
import * as _game from '../application/lib/game/types';
import * as _game_release from '../application/domain/game/types';

declare global {
  namespace metarhia {
    const metasql: typeof _metasql;
  }

  namespace api {}

  namespace lib {
    const game: typeof _game;
  }

  namespace domain {
    const game: typeof _game_release;
  }

  namespace db {
    const pg: Database;
    const mongo: MongoDB;
  }
}
