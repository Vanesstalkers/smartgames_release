import * as _Game from 'application/lib/game/types';
import { GameObject, GameObjectData, GameObjectConfig, PlayerBase, objects as _objects } from 'application/lib/game/types';
import * as _game_release_corporate from './corporate/types';
import { ObjectId } from 'mongodb';

/**
 * Release Game
 */
export class ReleaseGame extends _Game {
  checkCrutches(): void;
  crutchCount(): number;
  addPlayer(): objects.Player;
}
interface PlaneData extends GameObjectData {
  width: number;
  height: number;
  left: number;
  top: number;
  price: number;
}
interface PortData extends GameObjectData {
  left: number;
  top: number;
  direct: PortDirections;
}
type PortDirections = 'bottom' | 'top' | 'left' | 'right';
interface PortDirectionData {
  oppositeDirection: PortDirections[];
  nextDirection: PortDirections[];
  bridge: { vertical: boolean; reverse: boolean };
}
interface ZoneData extends GameObjectData {
  left: number;
  top: number;
  vertical: boolean;
  double: boolean;
}
interface ZoneSideData extends GameObjectData {
  value: number;
  links: { [key: string]: string };
  expectedValues: { [key: string]: boolean };
}
interface DiceData extends GameObjectData {
  deleted: boolean;
  visible: boolean;
  locked: boolean;
  placedAtRound: number;
}
interface DiceSideData extends GameObjectData {
  value: number;
}

export namespace _objects {
  
  class Player extends PlayerBase<ReleaseGame> implements _objects.Player {
    constructor(data: any, config?: { parent?: any });
      /**
     * asdasd123
     */
    game(game?: ReleaseGame, test?: boolean): ReleaseGame;
    prepareBroadcastData(data: any, player: any, viewerMode: any): { visibleId: string; preparedData: any };
    triggerEventEnabled(rrr: boolean): void;
    test(t: number, z:bigint): boolean;
  }

  class Test {
    ttttest(t: number, z:bigint): boolean;
  }

  // declare class Player extends _objects.Player {
  //   constructor(data: any, config?: { parent?: any });
  //   game(game?: Game, test: boolean): Game;
  //   prepareBroadcastData(data: any, player: any, viewerMode: any): { visibleId: string; preparedData: any };
  //   triggerEventEnabled(): boolean;
  // }
  // declare class Player extends lib.game.objects.Player {
  //   constructor(data: any, config?: { parent?: any });
  
  //   prepareBroadcastData(data: any, player: any, viewerMode: any): { visibleId: string; preparedData: any };
  //   triggerEventEnabled(test?: boolean): boolean;
  // }
  
  class Table extends objects.Deck {}
  class Plane extends GameObject {
    constructor(data: PlaneData, config: GameObjectConfig);
    getPosition(): { left: number; right: number; top: number; bottom: number };
  }
  class Port extends GameObject {
    constructor(data: PortData, config: GameObjectConfig);
    static DIRECTIONS: { [key: PortDirections]: PortDirectionData };
    getDirect(): PortDirectionData;
    updateDirect(direct: PortDirections): boolean | PortDirectionData;
  }
  class Zone extends GameObject {
    constructor(data: ZoneData, config: GameObjectConfig);
    sideList: string[];
    itemMap: { [key: string]: object };
    /**
     * устанавливает value зоны в соответствии с размещенным в нем dice
     */
    updateValues: void;
  }
  class ZoneSide extends GameObject {
    constructor(data: ZoneSideData, config: GameObjectConfig);
    /**
     * (используется в zone.checkIsAvailable)
     */
    updateExpectedValues: void;
  }
  class Dice extends GameObject {
    constructor(data: DiceData, config: GameObjectConfig);
    sideList: string[];
    moveToTarget(target: objects.Deck | objects.Zone): boolean;
  }
  class DiceSide extends GameObject {
    constructor(data: DiceSideData, config: GameObjectConfig);
  }
  class Bridge extends _objects.Player {}
  class Deck extends _objects.Deck {}
  class Card extends _objects.Card {}
}
