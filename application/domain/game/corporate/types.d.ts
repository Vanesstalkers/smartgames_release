import * as _Game from '../types';
import { _objects as __objects } from '../types';
import { objects as ___objects } from 'application/lib/game/types';
// import * as _game_release_corporate from 'corporate/types';
// import { ObjectId } from 'mongodb';

/**
 * Release Corporate Game
 */
export default class ReleaseCorpGame extends _Game {
  checkCrutches(a:boolean,b:boolean,c:boolean): void;
  crutchCount(): number;
  addPlayer(): objects.Player;
  corpTest(): void;
}

export namespace _objects {
  
  class Player extends __objects.Player implements objects.Player {
    test(aaa: number): string;
    triggerEventEnabled(zzz: boolean): void;
    skipRoundCheck(b:number): void;
  }
}
