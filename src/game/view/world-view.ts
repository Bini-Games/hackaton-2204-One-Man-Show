import { Container } from "pixi.js";
import { ChildView } from "./entities/child-view";
import { ParentView } from "./entities/parent-view";
import { TargetView } from "./entities/target-view";
import { AbstractEntityView } from "./entities/entity-view";
import { AbstractService } from "../../core/services/abstract-service";
import { World } from "../model/world";
import { MapView } from "./map-view";
import { Game } from "../../core/facade/game";
import { Hearts } from "./effects/hearts";

export class WorldView extends AbstractService {
  public static readonly key: string = "WorldView";

  protected container: Container = null;

  protected world: World = null;

  protected mapView: MapView = null;
  protected childView: ChildView = null;
  protected parentView: ParentView = null;
  protected targetsViews: TargetView[] = [];
  protected heartsEffect: Hearts = null;

  constructor() {
    super(WorldView.key);
  }

  public getContainer(): Container {
    return this.container;
  }

  public init(): void {
    this.world = Game.getService(World.key);
    this.initContainer();
    this.initMapView();
    this.initChildView();
    this.initParentView();
    this.initTargetsViews();
    this.initHeartsEffect();
    this.listenEvents();
  }

  protected initContainer(): void {
    this.container = new Container();
  }

  protected initMapView(): void {
    const mapView = new MapView(this.world.getMap());
    this.mapView = mapView;
    mapView.init();
    this.container.addChild(mapView.getContainer());
  }

  protected initChildView(): void {
    this.childView = this.setupGameObjectView(new ChildView(this.world.getChild()));
  }

  protected initParentView(): void {
    this.parentView = this.setupGameObjectView(new ParentView(this.world.getParent()));
  }

  protected initTargetsViews(): void {
    const targets = this.world.getTargets();
    const targetsViews = this.targetsViews;

    for (const target of targets) {
      targetsViews.push(this.setupGameObjectView(new TargetView(target)));
    }
  }

  protected initHeartsEffect(): void {
    this.heartsEffect = new Hearts(this.container);
    this.heartsEffect.init();
  }

  protected setupGameObjectView<ViewType extends AbstractEntityView>(view: ViewType): ViewType {
    view.init();
    view.addTo(this.container);
    return view;
  }

  protected listenEvents(): void {
    Game.events.on("update", this.update, this);
    Game.events.on("gameplay:catch", this.onCatch, this);
  }

  protected update(): void {
    this.mapView.update();
    this.childView.update();
    this.parentView.update();

    const targetsViews = this.targetsViews;

    for (const targetView of targetsViews) {
      targetView.update();
    }
  }

  protected onCatch(): void {
    const child = this.world.getChild();
    const position = child.getPosition();
    this.heartsEffect.emitAt(position.x, position.y);
  }
}
