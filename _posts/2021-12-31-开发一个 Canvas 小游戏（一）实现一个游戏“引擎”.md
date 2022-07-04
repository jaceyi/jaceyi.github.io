---
layout: post
title: 开发一个 Canvas 小游戏（一）实现一个游戏“引擎”
description: 实现一个简易的 Canvas 2D 游戏“引擎”，包括渲染器、照相机、实体、场景等，还针对动画处理和事件做了简单的封装。
tags: JavaScript Canvas
bannerImg: /static/images/bg4.jpg
---

<!--more-->

## 前言

> 好久没写文章了，思来想去感觉各种类型的文章网上都一大堆没有写的必要，之前有想要弄一个 hooks 库后来发现 ahooks 越来越完善，也没必要弄了，看着快过年了想着总不能一年零产出，还是的努努力（打算的早，结束的晚，都到 12 月 31 了才想起来还有篇文章没有写完）。

这个游戏其实在三四年前就写了，中间还重构过好几次，之前都是用简单的面向对象和函数式编程来写，游戏中的元素关系到还是分的挺开，但是游戏的渲染，运算等逻辑分的不够清晰，整个逻辑基本都是自顶向下的流水一样，今年又抽空重构了一版，把一些事件处理、渲染包括动画封装成一个“引擎”，这样再写一个别的游戏也只用写游戏本身的逻辑。（以下实现全靠瞎捉摸，或许再游戏开发领域有很多更高级的玩法，但是就这样吧 🥺 ）。

先上个游戏在线地址吧：[https://snowball.jaceyi.com](https://snowball.jaceyi.com) ，右上角可以设置游戏操作方式，默认是**拖拽模式**，手指按下并移动小球会往手指移动的方向移动；还有个**反向模式**是手指按下小球就会朝当前移动方向的反方向转动。服务用的是 Google 的  [Firebase](firebase.google.com)  在国外，访问或许会有点慢。

## 渲染逻辑

开发一个游戏，渲染肯定是重中之重，就先来谈一谈渲染逻辑的实现。首先呢这是一个 2D 游戏，那么渲染自然也只用考虑 2D 就好了，当然最主要的原因肯定是简单。**下面逻辑的描述就都写在代码的注释里了**

### 渲染器 Renderer

```typescript
// EntityRenderMap 是维护了一个个的实体的渲染方法，实体是什么呢？举个例子就是这个游戏中的一颗树、一个小球、或者是 RPG 游戏中的一个人物。
interface RendererProps {
  entityRenderMap?: EntityRenderMap;
  style?: Partial<CSSStyleDeclaration>;
}

export class Renderer {
  dom!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  actualWidth: number = 0; // Canvas 实际宽度，下文有描述
  actualHeight: number = 0;
  entityRenderMap: EntityRenderMap = entityRenderMap;

  constructor(props?: RendererProps) {
    // 创建一个渲染器就是创建一个 Canvas
    const dom = document.createElement("canvas");
    Object.assign(this, {
      dom,
      ctx: dom.getContext("2d"),
    });

    if (props) {
      const { entityRenderMap, style } = props;
      if (entityRenderMap) {
        // 创建渲染器时指定每一个实体的渲染方法，再与默认内部提供的一些实体渲染方法做合并
        entityRenderMap.forEach((render, key) => {
          this.entityRenderMap.set(key, render);
        });
      }
      if (style) {
        this.setStyle(style);
      }
    }
  }

  setStyle(style: Partial<CSSStyleDeclaration>) {
    for (const key in style) {
      if (style.hasOwnProperty(key)) {
        this.dom.style[key] = style[key] as string;
      }
    }
  }

  visible = true;
  setVisible(visible: boolean) {
    // 指定该渲染器是否可见，一个游戏可能存在多个渲染器，可以将游戏界面和UI界面具体的游戏画面区分开来
    this.visible = visible;
    this.setStyle({ visibility: visible ? "visible" : "hidden" });
  }

  penetrate = false;
  setPenetrate(penetrate: boolean) {
    // 绑定渲染器穿透事件，应用场景：我这个游戏在玩的时候分数属于UI渲染器，但是处于游戏渲染器的上面，绑定样式使其可以事件穿透到游戏的界面。
    this.penetrate = penetrate;
    this.setStyle({ pointerEvents: penetrate ? "none" : "auto" });
  }

  setSize(width: number, height: number) {
    const { dom } = this;
    dom.style.width = width + "px";
    dom.style.height = height + "px";

    /**
     * 设置这个 Canvas 的样式大小没得说的
     * 但是这里有个 getActualPixel 方法，这个方法是封装的，可以拿到当前屏幕的实际像素
     * 例如有的屏幕是 2K、4K 的，那么要画一个 100px*100px 的正方形在 2K 屏幕上就需要画成 200px*200px。
     * */
    const actualWidth = getActualPixel(width);
    const actualHeight = getActualPixel(height);
    dom.width = actualWidth;
    dom.height = actualHeight;
    Object.assign(this, {
      width,
      height,
      actualWidth,
      actualHeight,
    });
  }

  translateX: number = 0;
  translateY: number = 0;
  translate(x: number, y: number) {
    // 画布偏移：在我这个游戏中 小球在一直的往下走，但是要保证小球还能在屏幕的中间可见区域，那么就给画布做一个 Y 轴的负偏移。
    this.translateX += x;
    this.translateY += y;
    this.ctx.translate(getActualPixel(x), getActualPixel(y));
  }

  resetTranslate() {
    // 重置画布偏移
    this.translateX = 0;
    this.translateY = 0;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * 渲染逻辑
   * scene 场景：场景内包含整个界面内的实体
   * camera 照相机：定义真正所能看到的区域。之前有学过一段时间的 3DMax 它里面就有照相机的概念，实际给用户所看到的场景就是照相机所看到的范围。
   * 渲染器、照相机、场景 这三个是要配合在一起使用，渲染出照相机范围内的场景（一个个的实体）。
   * */
  render(scene: Scene, camera: Camera) {
    const {
      ctx,
      entityRenderMap,
      actualWidth,
      actualHeight,
      translateX,
      translateY,
    } = this;

    {
      // 每次绘制新的画面之前要清除上一次绘制的画面
      const renderX = getActualPixel(0 - translateX);
      const renderY = getActualPixel(0 - translateY);
      ctx.clearRect(
        renderX,
        renderY,
        renderX + actualWidth,
        renderY + actualHeight
      );
    }

    {
      // 绘制照相机区域 参考方法：https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/clip
      const { left, top, width, height } = camera;
      ctx.beginPath(); // 路径开始
      ctx.rect(
        getActualPixel(left),
        getActualPixel(top),
        getActualPixel(width),
        getActualPixel(height)
      );
      ctx.clip(); // 画一个正方形的区域用来限制之后所有的元素都只会在正方形范围内显示
    }

    {
      // 绘制场景中的每一个 entity
      scene.entityMap.forEach((entity) => {
        if (!entity.visible) return; // 实体不可见不绘制
        ctx.beginPath(); // 每一个实体绘制前开启新的路径
        if (entity.render) {
          // 实体有自带的渲染方法
          entity.render(ctx);
        } else {
          const render = entityRenderMap.get(entity.type);
          // 获取该实体类型配置的渲染方法
          if (render) {
            render.call(entity, ctx, entity);
          } else {
            console.warn(`The ${entity.id} Entity requires a render method!`);
          }
        }
      });
    }
  }
}
```

在这里我将 **渲染器 `Renderer`** 的概念定义为一个 `Renderer` 就是一个 `canvas`，一个游戏可能有多个 Canvas 共同组成，一个渲染器对应了一个 **照相机 `Camera`** 和一个 **场景 `Scene`** ，当然游戏开发中一个 `Renderer` 对应多个 `Camera` 也是比较常见的操作，只不过我这里想了想我的是 2D 游戏，不存在一个画面多个视角看的情况，所以就定义了一对一的概念；**场景 `Scene`** 是一个虚拟的概念，就相当于是很多个 **实体 `Entity`** 的合集，就例如由山、水、人、树组成了一幅画。

### 照相机 Camera

```typescript
interface CameraConfig {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

export class Camera {
  left: number = 0;
  top: number = 0;
  width: number = 0;
  height: number = 0;

  constructor(config: CameraConfig | Renderer) {
    if (config instanceof Renderer) {
      // 如果传入的为 Renderer 实例，则相机自动追踪 Render 区域
      this.traceRenderer(config);
      this.observerRenderer = config;
    } else {
      this.update(config);
    }
  }

  // 更新照相机的配置
  update(config: CameraConfig): Camera {
    Object.assign(this, config);
    return this;
  }

  observerRenderer: Renderer | undefined;
  // 追踪 Render 渲染的位置与大小，用于自动绘制出全屏的画面
  traceRenderer(renderer: Renderer): Camera {
    const { translateY, translateX, actualWidth, actualHeight } = renderer;
    Object.assign(this, {
      top: -translateY,
      left: -translateX,
      width: actualWidth,
      height: actualHeight,
      renderer,
    });

    // 使用 Object.defineProperty 封住哪个的方法，用来追踪相机位置与大小
    observerSet(renderer, "translateY", (value) => {
      this.top = -value;
    });
    observerSet(renderer, "translateX", (value) => {
      this.left = -value;
    });
    observerSet(renderer, "actualWidth", (value) => {
      this.width = value;
    });
    observerSet(renderer, "actualHeight", (value) => {
      this.height = value;
    });

    return this;
  }

  // 取消对 Render 的追踪
  clearTraceRenderer() {
    const { observerRenderer } = this;
    if (!observerRenderer) return;
    const keys: (keyof Renderer)[] = [
      "translateY",
      "translateX",
      "width",
      "height",
    ];
    keys.forEach((key) => clearObserverSet(observerRenderer, key));
  }
}
```

### 场景 Scene & 实体 Entity

上文有提到 **场景 `Scene`** 是一个虚拟的概念，就相当于是很多个 **实体 `Entity`** 的合集，所以我们先来看看 `Entity` 具体是什么样子

```typescript
export type EntityType = Keys<CanvasRenderingContext2D> | string;

export interface EntityRender<T extends Entity = any> {
  (ctx: CanvasRenderingContext2D, entity: T): void;
}

interface EntityConfig {
  [key: string]: any;
}

// Entity 可以被其他类继承使用再生成实例，也可以直接调用 Entity.create 方法进行创建实例
export class Entity<T extends EntityConfig = {}> {
  id: string;
  config: T = {} as T;

  constructor(public type: EntityType, config?: Partial<T>) {
    this.id = type + "-" + utils.getRandomId(); // 随机生成一个ID
    config && this.mergeConfig(config);
  }

  // 更新实体的 config
  mergeConfig(config: Partial<T>) {
    Object.assign(this.config, config);
    return this;
  }

  // 设置该实体是否可见，渲染的时候会忽略不可见的实体
  visible: boolean = true;
  setVisible(visible: boolean) {
    this.visible = visible;
  }

  // 定义实体渲染的方法
  render?(ctx: CanvasRenderingContext2D): void;
}
```

实体的使用方式又两种，考虑到部分实体只具备展示效果（属性）不具备动作（方法），所以可以使用 `new Entity(config)` 传入实体渲染所需要的信息，后续也只需要更新这些配置便可。

```typescript
// 创建一个分数实体
const scoreEntity = new Entity("score", {
  count: 0,
  left: 10,
  top: 20,
});

// 更新分数时
scoreEntity.mergeConfig({
  count: 2,
});
```

实体的第二种使用方法是继承 `Entity` 类，使其上面包含基础的实体属性方法还可以扩展一些额外的属性、事件等。

```typescript
// 创建一个雪球实体
class SnowBall extends Entity {
  config = {}; // 一些 config
  constructor(config) {
    super("snowball");
    this.mergeConfig(config);
  }

  move() {} // 移动雪球实体

  render() {} // 定义雪球实体如何渲染
}

const snowBall = new SnowBall({}); // 构建雪球实例
```

接下来看看 **场景 `Scene`** 吧，场景其实就稍微对 `Map` 封装一下。

```typescript
type EntityMap = Map<string, Entity>;

export class Scene {
  entityMap: EntityMap = new Map(); // 场景内实体的合集

  // 给场景内添加实体
  add<T extends Entity>(entity: T): T {
    this.entityMap.set(entity.id, entity);
    return entity;
  }

  // 清空场景
  clear() {
    this.entityMap = new Map();
  }

  remove(id: string) {
    // 从场景内删除实体
    this.entityMap.delete(id);
  }
}
```

## 动画

一个游戏动画也是必不可少的，在前端 Canvas 里面其实不存在动画这个概念，它就是绘制一张图片，我们只需将每次绘制的图片里面的元素位置做一些调整，那么快速的绘制多张就会形成一个动画的效果。这种场景在 JS 中我们一般会想到 `setInterval, setTimeout` 等；实际再写游戏、动画的时候都是用到 `requestAnimationFrame` 这个 API 的，这里浅浅的讲一下他们的区别。

### setInterval 与 setTimeout

这两个的概念其实是差不多的，都是浏览器 JS 引擎提供的方法，无非就是是用 `setTimeout` 要做一个递归逻辑。JS 引擎是单线程的，在使用这些异步方法的时候会将其添加至一个队列当中，等待主任务执行完成后再来执行这些异步任务就有可能造成一个延迟执行，达到的效果比预期的要慢，不过这个不是主要的问题，主要的问题是渲染不同步，例如当前显示器刷新率是每隔 100 毫秒刷新一下，`setInterval` 设置的是 50 毫秒绘制一下，这两个不同步就会导致有的时候 JS 绘制了最新的效果，但是显示器还没刷新。然后再显示器下次刷新时候，已经累加了几次的 JS 绘制就会出现跳帧，卡顿现象。

### requestAnimationFrame

`requestAnimationFrame` 会把每一帧中的所有 DOM 操作集中起来，在一次重绘或回流中就完成，而且重绘或回流的时间是跟着显示器的刷新率来的，这样无论在高刷还是低刷的屏幕上都能有很好的体验。

```typescript
interface Callback {
  (timestamp: number): boolean | unknown;
}

interface AnimationEvent {
  (animation: Animation): void;
}

type AnimationEvents = Array<[AnimationEvent, number]>;

export class Animation {
  constructor(public callback: Callback) {}

  timer: number = 0;
  status: "animation" | "stationary" = "stationary";
  startTime: number = 0;
  prevTime: number = 0;
  start(timeout?: number) {
    this.status = "animation";
    this.startTime = 0;
    const animation = (timestamp: number) => {
      let { startTime } = this;
      if (startTime === 0) {
        startTime = timestamp;
        this.startTime = startTime;
      }
      if (typeof timeout === "number" && timestamp - startTime > timeout) {
        return this.stop(); // 如果传入了超时时间 则动画就会再执行一段时间后停止
      }

      {
        const { evnets, prevTime } = this;
        const millisecond = timestamp - startTime;
        const prevMillisecond = prevTime - startTime;

        // evnets 维护了一个事件队列 可以设置每隔多长时间执行一次事件
        for (const [event, stepMillisecond] of evnets) {
          const step = Math.floor(millisecond / stepMillisecond);
          const prevStep = Math.floor(prevMillisecond / stepMillisecond);
          if (step !== prevStep) {
            event(this);
          }
        }
      }

      const keep = this.callback(timestamp); // 如果回调函数返回了 false 则表示要停止动画
      if (keep === false) {
        return this.stop();
      }
      this.prevTime = timestamp;
      this.timer = window.requestAnimationFrame(animation);
    };
    this.timer = window.requestAnimationFrame(animation);
  }

  stop() {
    this.status = "stationary";
    window.cancelAnimationFrame(this.timer);
  }

  evnets: AnimationEvents = [];
  /**
   * @description 增加事件，让动画执行时每隔多少毫秒执行一次事件
   * @param event 事件
   * @param millisecond 毫秒
   */
  bind(event: AnimationEvent, millisecond: number) {
    this.evnets.push([event, millisecond]);
  }

  // 移除事件
  remove(event: AnimationEvent) {
    const index = this.evnets.findIndex((e) => e[0] === event);
    if (index >= 0) {
      this.evnets.splice(index, 1);
    }
  }
}
```

## 事件

这里还封装了一个事件，主要是针对移动端和 PC 端的融合，现阶段支持了三个事件，分别是鼠标按下、鼠标抬起、和点击，对应到手机就是手指的操作，后续还可以将 `mousemove` 和 `touchmove` 也做一个合并。**（ 2022.2.8 更新 `move` 事件也加上了 ）**

```typescript
type TMEventType = "touchStart" | "touchMove" | "touchEnd" | "tap";

interface TMJoinEventOption<T extends TMEventType> {
  type: T;
  pointX: number;
  pointY: number;
  originEvent: any;
}

export interface TMJoinEvent<T extends TMEventType = any> {
  (e: TMJoinEventOption<T>): void;
}

interface IEventListener {
  touchStart: TMJoinEvent<"touchStart">[];
  touchMove: TMJoinEvent<"touchMove">[];
  touchEnd: TMJoinEvent<"touchEnd">[];
  tap: TMJoinEvent<"tap">[];
}

/**
 * Touch Mouse Event
 * 合并了 PC 及移动端的事件，实现了类似于 click 的 tap 事件。
 */
export class TMEvent {
  constructor(public dom: HTMLCanvasElement) {
    dom.addEventListener("touchstart", this.dispatchTouchEvent("touchStart"));
    dom.addEventListener("touchmove", this.dispatchTouchEvent("touchMove"));
    dom.addEventListener("touchend", this.dispatchTouchEvent("touchEnd"));
    dom.addEventListener("mousedown", this.dispatchMouseEvent("touchStart"));
    dom.addEventListener("mousemove", this.dispatchMouseEvent("touchMove"));
    dom.addEventListener("mouseup", this.dispatchMouseEvent("touchEnd"));
  }

  dispatchMouseEvent(type: TMEventType) {
    return (e: MouseEvent) => {
      const rect = this.dom.getBoundingClientRect();

      const listeners = this._listeners[type] as TMJoinEvent<TMEventType>[];
      const eventOption: TMJoinEventOption<TMEventType> = {
        type,
        pointX: e.clientX - rect.left,
        pointY: e.clientY - rect.top,
        originEvent: e,
      };
      listeners.forEach((event) => {
        event(eventOption);
      });

      this.bindTapEvent(type, eventOption);
    };
  }

  dispatchTouchEvent(type: TMEventType) {
    return (e: TouchEvent) => {
      e.preventDefault();

      const firstTouch = e.changedTouches[0];
      if (!firstTouch) return;
      const rect = this.dom.getBoundingClientRect();

      const listeners = this._listeners[type] as TMJoinEvent<TMEventType>[];
      const eventOption: TMJoinEventOption<TMEventType> = {
        type,
        pointX: firstTouch.pageX - rect.left,
        pointY: firstTouch.pageY - rect.top,
        originEvent: e,
      };
      listeners.forEach((event) => {
        event(eventOption);
      });

      this.bindTapEvent(type, eventOption);
    };
  }

  tapStartTime: number = 0;
  bindTapEvent(type: TMEventType, eventOption: TMJoinEventOption<TMEventType>) {
    const currentTime = new Date().getTime();
    if (this.tapStartTime && currentTime - this.tapStartTime < 500) {
      // 500 毫秒内 表示点击事件
      this.dispatchTapEvent("tap", {
        ...eventOption,
        type: "tap",
      });
      this.tapStartTime = 0;
    }

    if (type === "touchStart") {
      this.tapStartTime = currentTime;
    }
  }

  dispatchTapEvent(type: "tap", eventOption: TMJoinEventOption<"tap">) {
    const listeners = this._listeners[type] as TMJoinEvent<"tap">[];
    listeners.forEach((event) => {
      event(eventOption);
    });
  }

  _listeners: IEventListener = {
    touchStart: [],
    touchMove: [],
    touchEnd: [],
    tap: [],
  };

  add(eventName: TMEventType, event: TMJoinEvent<TMEventType>) {
    this._listeners[eventName].push(event);
  }

  remove(eventName: TMEventType, event: TMJoinEvent<TMEventType>) {
    const index = this._listeners[eventName].findIndex(
      (item) => item === event
    );
    delete this._listeners[eventName][index];
  }
}
```

## 结语

> 这个“引擎”呢其实就是一些简单的封装，**渲染器 Renderer** 是将 Canvas 对象进行封装，并提供了一些更便捷的方法，具体怎么渲染元素这些也没做处理；**照相机 Camera** 其实就是一个虚拟的概念，描述了一个正方形的大小宽高，然后让渲染的时候只渲染这个正方形内的内容；**实体 Entity** 是将游戏里面存着的元素用面向对象的方式来规范了一遍。**场景  Scene** 就是一些 **实体 Entity** 的集合。

这篇主要将的是“引擎”的实现，没有什么实际的应用，后续还会再发一篇如何使用该“引擎”来开发一个 Canvas 小游戏。
关于“引擎”的设计基本都是按照自己的想法来实现的，或许有些地方不足，或者设计不合理，也欢迎在评论里面提一些建议~。本篇中 Canvas 的内容并不多，更多对于 Canvas 上的使用将会再下一篇文章中详细的描述。

项目仓库在这里 [Github](https://github.com/h5-games/ball) 里面有整个游戏和引擎的完整代码，想要了解 Canvas 的可以看一看。

下一篇文章会尽快的，看能不能赶在年前（农历）搞定，要是搞不定以现在西安的疫情来看，今年过年十有八九是回不去了，要是没写完到时候可能过年就待在上海写文章了。

2021 年 12 月 31 日 23:00 还有一个小时就 2022 年了，提前祝大家新年快乐！

**今年终于不是 0 产出 嘿嘿~**
