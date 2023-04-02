import * as TWEEN from "@tweenjs/tween.js";
import { Application } from "pixi.js";
import { Game } from "./core/facade/game";
import { Logger } from "./core/facade/logger";
import { EventBus } from "./core/facade/event-bus";
import { Layout } from "./core/screen/layout";
import { World } from "./game/model/world";
import { Timer } from "eventemitter3-timer";
import { WorldView } from "./game/view/world-view";
import { LearningController } from "./game/controller/ml/learning-controller";
import { Preloader } from "./core/assets/preloader";
import { AssetsData } from "./game/data/assets-data";
import { UI } from "./game/ui/ui";
import { GameConfig } from "./game/data/game-config";
import { PlayerController } from "./game/controller/player/player-controller";
import { UIService } from "./game/ui/ui-service";
import Camera from "./core/screen/camera";

const canvas = document.createElement("canvas");
canvas.id = "game";
document.body.appendChild(canvas);

const app = new Application({
  width: 700,
  height: 700,
  antialias: true,
  backgroundColor: 0x353540,
  view: canvas,
});

(<any>window).game = Game;

Game.registerService(Logger.key, new Logger());
Game.registerService(EventBus.key, new EventBus());

const world = new World();
Game.registerService(World.key, world);

const layout = new Layout();
Game.registerService(Layout.key, layout);

const worldView = new WorldView();
Game.registerService(WorldView.key, worldView);

const learningController = new LearningController();
Game.registerService(LearningController.key, learningController);

const playerController = new PlayerController();
Game.registerService(PlayerController.key, playerController);

const camera = new Camera();
Game.registerService(Camera.key, camera);

window.onload = load;

function load() {
  new Preloader()
    .subscribeOnLoaded(onPreloaded)
    .enqueue(AssetsData)
    .start();
}

function onPreloaded() {
  setupTicker();
  create();
}

function setupTicker() {
  app.ticker.add(tick);
}

function create() {
  world.init();
  world.reset();

  worldView.init();
  app.stage.addChild(worldView.getContainer());

  const ui = new UI();
  app.stage.addChild(ui);
  ui.init();

  Game.registerService(UIService.key, new UIService(ui));

  layout.init({
    container: ui,
    renderer: app.renderer,
    longSide: GameConfig.LayoutLongSide,
    shortSide: GameConfig.LayoutShortSide,
  });

  camera.init();
  camera.setContainer(worldView.getContainer());

  playerController.init();
  learningController.init();
  learningController.start();

  layout.updateSize();

  tick();
}

let accumulated = 0;

function tick() {
  Timer.timerManager.update(app.ticker.elapsedMS);
  TWEEN.update();

  const sec = app.ticker.deltaMS * 0.001;
  const frameTime = sec > 0.25 ? 0.25 : sec;
  accumulated += frameTime;

  const dt = World.timeStep;

  while (accumulated >= dt) {
    Game.events.emit('fixedUpdate');
    accumulated -= dt;
  }

  Game.events.emit('update', frameTime);

  app.renderer.render(app.stage);
}
