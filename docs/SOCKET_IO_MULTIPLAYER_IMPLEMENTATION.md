# Socket.IO 在线对战落地方案

更新时间：2026-06-14

## 1. 目标

把当前本地双人键盘格斗游戏改造成支持“创建房间、复制链接、好友打开链接加入、两人在线对战”的版本。

当前项目是纯前端 Vite + React + TypeScript 游戏。Socket.IO 接入后，需要新增一个 Node.js 实时对战服务，负责：

- 创建房间。
- 加入房间。
- 分配玩家 1 / 玩家 2。
- 同步角色选择和准备状态。
- 接收玩家输入。
- 在服务端运行权威战斗 tick。
- 广播战斗快照。
- 判定胜负。
- 处理断线、重连、房间清理。

推荐架构是：

```text
React/Vite 客户端
  -> socket.io-client
  -> Node.js + Express + Socket.IO 对战服务
  -> 房间内服务器权威 GameState
```

## 2. 为什么 Socket.IO 可以做这件事

Socket.IO 官方定位是低延迟、双向、事件驱动的客户端/服务端通信库。底层连接由 Engine.IO 管理，可以使用 WebSocket、HTTP long-polling、WebTransport 等传输方式。

对这个项目有用的核心能力：

- 事件通信：客户端和服务端可以通过命名事件互发消息。
- Rooms：服务端可以把多个 socket 加入同一个 room，然后只向这个 room 广播。
- Adapter：rooms 的广播由 Adapter 实现，单机默认是内存 Adapter，多节点部署时可替换为 Redis Adapter。
- 自动重连：客户端断线后会自动尝试恢复连接。
- Connection State Recovery：可选功能，可在短暂断线后恢复 socket 状态和部分错过的数据包。
- Ack：关键事件可以用确认回调保证服务端处理结果可见。

需要注意：

- Socket.IO 不是游戏框架，只提供通信能力。
- 它不会替你做匹配、裁判、输入同步、回放、防作弊。
- 官方 FAQ 说明 Socket.IO 服务端默认不持久化消息；需要应用自己存储离线消息或房间状态。

## 3. 当前项目改造原则

### 3.1 保留本地模式

当前本地双人模式是最好的回归基线。不要直接把它拆掉。

建议新增模式：

```ts
type BattleMode = "local" | "online";
```

或者拆分组件：

```text
src/components/BattleArenaLocal.tsx
src/components/BattleArenaOnline.tsx
```

### 3.2 服务端权威

在线对战不要让两个客户端各自计算伤害后互相同步结果。推荐让服务端成为唯一裁判。

客户端职责：

- 收集键盘输入。
- 发送输入给服务端。
- 接收服务端快照。
- 渲染角色、血条、技能、飘字、粒子。

服务端职责：

- 维护房间状态。
- 维护唯一 GameState。
- 固定频率 tick。
- 根据双方输入计算战斗结果。
- 广播权威快照。

这样可以避免：

- 双方状态不一致。
- 一方本地改血量作弊。
- 伤害、命中、胜负争议。

### 3.3 先快照同步，再做客户端预测

第一版可以只做：

- 客户端发送输入。
- 服务端计算。
- 客户端按快照渲染。

这样延迟会稍有感知，但最稳。

体验不够时再加：

- 本地玩家客户端预测。
- 服务端状态校正。
- 远端玩家插值。
- 丢包和重连补偿。

## 4. 目录结构建议

新增后建议结构：

```text
.
├─ server
│  ├─ index.ts
│  ├─ rooms
│  │  ├─ BattleRoom.ts
│  │  └─ RoomManager.ts
│  └─ protocol.ts
├─ src
│  ├─ net
│  │  ├─ socketClient.ts
│  │  ├─ roomUrl.ts
│  │  └─ protocol.ts
│  ├─ components
│  │  ├─ OnlineLobby.tsx
│  │  └─ BattleArenaOnline.tsx
│  └─ game
│     ├─ input.ts
│     ├─ snapshot.ts
│     └─ sharedTypes.ts
```

如果想减少重复类型，可以把协议放到共享目录：

```text
shared
└─ protocol.ts
```

客户端和服务端都从 `shared/protocol.ts` 引入。

## 5. 安装依赖

```bash
npm install express socket.io socket.io-client nanoid
npm install -D tsx concurrently @types/express
```

推荐脚本：

```json
{
  "scripts": {
    "dev": "vite",
    "dev:client": "vite",
    "dev:server": "tsx watch server/index.ts",
    "dev:full": "concurrently \"npm:dev:client\" \"npm:dev:server\"",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "check": "tsc -b --noEmit"
  }
}
```

开发环境：

- Vite 客户端：`http://127.0.0.1:5173`
- Socket.IO 服务端：`http://127.0.0.1:3001`

生产环境：

- Express 可以托管 `dist`。
- Socket.IO 和静态资源同域部署，减少 CORS 和 Cookie 问题。

## 6. URL 与房间链接设计

当前项目没有正式使用 React Router，第一版建议用 query 参数，改动最小：

```text
http://127.0.0.1:5173/?room=ABCD12
```

当前已落地版本区分“房主自己的房间地址”和“发给别人的邀请地址”：

```text
房主地址：http://127.0.0.1:5173/?room=ABCD12
邀请地址：http://127.0.0.1:5173/?room=ABCD12&join=1
```

原因是同一台机器打开两个浏览器时，如果只依赖 `room` 和本地保存的 `reconnectToken`，第二个浏览器可能误用房主身份重连，表现为“邀请方进来却操控房主”。`join=1` 明确表示这是新玩家加入，不带本会话的重连 token。

生产环境：

```text
https://game.example.com/?room=ABCD12
```

房间工具：

```ts
export function createRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function getRoomIdFromUrl() {
  return new URLSearchParams(window.location.search).get("room");
}

export function buildInviteUrl(roomId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  url.searchParams.set("join", "1");
  return url.toString();
}

export function buildRoomUrl(roomId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  url.searchParams.delete("join");
  return url.toString();
}

export function isInviteJoinUrl() {
  return new URLSearchParams(window.location.search).get("join") === "1";
}
```

正式版建议用 `nanoid` 生成 roomId。

当前项目的实现文件：

- 前端链接工具：`src/net/roomUrl.ts`
- 前端联机 Hook：`src/net/useOnlineRoom.ts`
- 后端房间逻辑：`D:\allproject\backendMinigame\src\rooms\BattleRoom.ts`

## 7. 通信协议设计

### 7.1 玩家输入协议

不要直接发送键盘码。不同端只发送标准化动作。

```ts
export interface PlayerInput {
  seq: number;
  clientTime: number;
  left: boolean;
  right: boolean;
  jump: boolean;
  attack: boolean;
  skill1: boolean;
  skill2: boolean;
  ultimate: boolean;
}
```

说明：

- `seq`：客户端输入序号，用于去重、排序、诊断延迟。
- `clientTime`：客户端采样时间，用于 ping/延迟估算。
- 方向和技能使用布尔值，服务端不关心具体键盘码。

### 7.2 客户端发给服务端

```ts
export type ClientToServerEvents = {
  "room:create": (
    payload: { nickname?: string },
    ack: (res: CreateRoomResult) => void
  ) => void;

  "room:join": (
    payload: { roomId: string; nickname?: string; reconnectToken?: string },
    ack: (res: JoinRoomResult) => void
  ) => void;

  "player:select-character": (
    payload: { roomId: string; characterId: string },
    ack: (res: AckResult) => void
  ) => void;

  "player:ready": (
    payload: { roomId: string; ready: boolean },
    ack: (res: AckResult) => void
  ) => void;

  "battle:input": (payload: { roomId: string; input: PlayerInput }) => void;

  "room:leave": (payload: { roomId: string }) => void;
};
```

### 7.3 服务端发给客户端

```ts
export type ServerToClientEvents = {
  "room:state": (state: PublicRoomState) => void;
  "battle:start": (payload: BattleStartPayload) => void;
  "battle:snapshot": (snapshot: GameSnapshot) => void;
  "battle:events": (events: GameEvent[]) => void;
  "battle:game-over": (payload: { winner: 1 | 2 }) => void;
  "room:error": (payload: { code: string; message: string }) => void;
};
```

### 7.4 Ack 使用原则

关键事件用 ack：

- 创建房间。
- 加入房间。
- 选角色。
- 准备。

高频事件不用 ack：

- 每帧输入。
- 状态快照。

原因：

- Socket.IO 默认是 at most once，消息可能在断线时丢失。
- 高频输入丢一两个包没必要重发旧输入，下一帧会覆盖。
- 关键操作必须明确知道是否成功。

客户端关键事件建议加 timeout：

```ts
socket.timeout(3000).emit("room:join", { roomId }, (err, res) => {
  if (err) {
    // 显示超时或重试
    return;
  }
  // 处理加入结果
});
```

## 8. 服务端实现

### 8.1 server/index.ts

```ts
import express from "express";
import http from "node:http";
import { Server } from "socket.io";
import { RoomManager } from "./rooms/RoomManager";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://127.0.0.1:5173", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 30_000,
    skipMiddlewares: true,
  },
});

const rooms = new RoomManager(io);

io.on("connection", (socket) => {
  socket.on("room:create", (payload, ack) => rooms.createRoom(socket, payload, ack));
  socket.on("room:join", (payload, ack) => rooms.joinRoom(socket, payload, ack));
  socket.on("player:select-character", (payload, ack) => rooms.selectCharacter(socket, payload, ack));
  socket.on("player:ready", (payload, ack) => rooms.setReady(socket, payload, ack));
  socket.on("battle:input", (payload) => rooms.pushInput(socket, payload));
  socket.on("room:leave", (payload) => rooms.leaveRoom(socket, payload.roomId));

  socket.on("disconnect", () => {
    rooms.handleDisconnect(socket);
  });
});

server.listen(3001, () => {
  console.log("Socket.IO battle server listening on http://127.0.0.1:3001");
});
```

### 8.2 房间状态结构

```ts
type RoomStatus = "lobby" | "countdown" | "playing" | "ended";
type PlayerSlot = 1 | 2;

interface RoomPlayer {
  socketId: string;
  reconnectToken: string;
  slot: PlayerSlot;
  nickname: string;
  characterId: string | null;
  ready: boolean;
  connected: boolean;
  lastSeenAt: number;
}

interface PublicRoomState {
  roomId: string;
  status: RoomStatus;
  players: Array<{
    slot: PlayerSlot;
    nickname: string;
    characterId: string | null;
    ready: boolean;
    connected: boolean;
  }>;
}
```

### 8.3 BattleRoom 核心职责

```ts
class BattleRoom {
  roomId: string;
  status: RoomStatus = "lobby";
  players = new Map<PlayerSlot, RoomPlayer>();
  socketToSlot = new Map<string, PlayerSlot>();
  latestInputs: Record<PlayerSlot, PlayerInput | null> = {
    1: null,
    2: null,
  };

  tickTimer: NodeJS.Timeout | null = null;
  snapshotTimer: NodeJS.Timeout | null = null;
  frame = 0;

  constructor(private io: Server, roomId: string) {
    this.roomId = roomId;
  }
}
```

### 8.4 创建和加入房间

服务端逻辑：

1. 创建房间时生成 roomId。
2. 创建者加入 Socket.IO room。
3. 分配为 player 1。
4. 返回 roomId、slot、reconnectToken。

加入房间时：

1. 校验 roomId 是否存在。
2. 如果有 reconnectToken，尝试恢复原 slot。
3. 否则分配空闲 slot。
4. 房间已有两名玩家时拒绝加入，后续可支持 spectator。
5. 广播 `room:state`。

伪代码：

```ts
join(socket, payload, ack) {
  const slot = this.findAvailableSlot();
  if (!slot) {
    ack({ ok: false, error: "ROOM_FULL" });
    return;
  }

  socket.join(this.roomId);

  const player = {
    socketId: socket.id,
    reconnectToken: crypto.randomUUID(),
    slot,
    nickname: payload.nickname || `玩家${slot}`,
    characterId: null,
    ready: false,
    connected: true,
    lastSeenAt: Date.now(),
  };

  this.players.set(slot, player);
  this.socketToSlot.set(socket.id, slot);

  ack({
    ok: true,
    roomId: this.roomId,
    slot,
    reconnectToken: player.reconnectToken,
  });

  this.broadcastRoomState();
}
```

## 9. 游戏同步实现

### 9.1 固定 tick

服务端不要用 `requestAnimationFrame`，要使用固定 tick。

推荐：

- 逻辑 tick：60Hz。
- 快照广播：20Hz。
- 输入采样：客户端 30Hz 或按键变化时立即发。

```ts
const TICK_RATE = 60;
const SNAPSHOT_RATE = 20;

startBattle() {
  this.status = "playing";
  this.frame = 0;
  this.initGameState();

  this.tickTimer = setInterval(() => {
    this.tick();
  }, 1000 / TICK_RATE);

  this.snapshotTimer = setInterval(() => {
    this.broadcastSnapshot();
  }, 1000 / SNAPSHOT_RATE);
}
```

### 9.2 输入驱动 tick

当前 `engine.tick` 接收 `Set<string>` 和 `justPressed`。联网版建议改成接收标准输入。

目标函数：

```ts
export function tickWithInputs(
  state: GameState,
  inputs: Record<1 | 2, PlayerInput | null>
) {
  // movement
  // attack
  // skill
  // projectiles
  // cooldowns
  // winner check
}
```

第一版也可以先写适配器，把 `PlayerInput` 重新转成当前引擎需要的键盘码：

```ts
function inputToKeys(input: PlayerInput | null, slot: 1 | 2) {
  const keys = new Set<string>();
  const justPressed = new Set<string>();
  if (!input) return { keys, justPressed };

  if (slot === 1) {
    if (input.left) keys.add("KeyA");
    if (input.right) keys.add("KeyD");
    if (input.jump) keys.add("KeyW");
    if (input.attack) keys.add("KeyJ");
    if (input.skill1) justPressed.add("KeyK");
    if (input.skill2) justPressed.add("KeyL");
    if (input.ultimate) justPressed.add("KeyI");
  } else {
    if (input.left) keys.add("ArrowLeft");
    if (input.right) keys.add("ArrowRight");
    if (input.jump) keys.add("ArrowUp");
    if (input.attack) keys.add("Digit1");
    if (input.skill1) justPressed.add("Digit2");
    if (input.skill2) justPressed.add("Digit3");
    if (input.ultimate) justPressed.add("Digit0");
  }

  return { keys, justPressed };
}
```

不过最终建议直接改 `engine.ts`，不要长期保留键盘码适配器。

### 9.3 处理 justPressed

技能需要“刚按下”语义。联网场景不能只靠当前布尔值，需要服务端比较上一帧输入。

服务端保存：

```ts
previousInputs: Record<1 | 2, PlayerInput | null>;
latestInputs: Record<1 | 2, PlayerInput | null>;
```

每帧计算：

```ts
const justPressed = {
  skill1: current.skill1 && !previous.skill1,
  skill2: current.skill2 && !previous.skill2,
  ultimate: current.ultimate && !previous.ultimate,
};
```

### 9.4 快照结构

```ts
export interface GameSnapshot {
  frame: number;
  serverTime: number;
  p1: FighterSnapshot;
  p2: FighterSnapshot;
  projectiles: ProjectileSnapshot[];
  winner: 1 | 2 | null;
}

export interface FighterSnapshot {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  facingRight: boolean;
  isJumping: boolean;
  isAttacking: boolean;
  currentSkill: number | null;
  isShielded: boolean;
  isStunned: boolean;
  isBlocking: boolean;
  hitFlash: number;
  combo: number;
  characterId: string;
}

export interface ProjectileSnapshot {
  id: string;
  owner: 1 | 2;
  x: number;
  y: number;
  type: string;
  trailColor: string;
}
```

不建议同步：

- 每一个粒子。
- 每一个飘字。
- 每一帧震屏偏移。

这些应该由客户端根据事件或快照差异本地生成。

### 9.5 战斗事件

为了让客户端表现更好，可以额外广播事件：

```ts
export type GameEvent =
  | { type: "hit"; frame: number; target: 1 | 2; x: number; y: number; damage: number; crit?: boolean }
  | { type: "skill"; frame: number; owner: 1 | 2; skillIndex: number; skillName: string }
  | { type: "block"; frame: number; target: 1 | 2 }
  | { type: "gameOver"; frame: number; winner: 1 | 2 };
```

事件用于：

- 伤害飘字。
- 命中特效。
- 音效。
- 震屏。

快照用于：

- 权威位置。
- 血量蓝量。
- 冷却动作状态。
- 投射物位置。

## 10. 客户端实现

### 10.1 socketClient.ts

```ts
import { io, Socket } from "socket.io-client";

export function createSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:3001", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  });
}
```

说明：

- 第一版可以强制 `websocket`，减少 long-polling 相关排查。
- 如果部署环境可能拦截 WebSocket，可以允许默认 transports。

### 10.2 创建房间

```ts
socket.timeout(3000).emit("room:create", { nickname }, (err, res) => {
  if (err || !res?.ok) {
    setError("创建房间失败");
    return;
  }

  localStorage.setItem(`reconnect:${res.roomId}`, res.reconnectToken);
  const inviteUrl = buildInviteUrl(res.roomId);
  setRoomId(res.roomId);
  setInviteUrl(inviteUrl);
});
```

### 10.3 加入房间

```ts
const reconnectToken = localStorage.getItem(`reconnect:${roomId}`) || undefined;

socket.timeout(3000).emit(
  "room:join",
  { roomId, nickname, reconnectToken },
  (err, res) => {
    if (err || !res?.ok) {
      setError("加入房间失败");
      return;
    }

    localStorage.setItem(`reconnect:${roomId}`, res.reconnectToken);
    setMySlot(res.slot);
  }
);
```

### 10.4 输入采样

客户端仍然监听键盘，但只控制自己的角色。

```ts
function buildInput(keys: Set<string>, slot: 1 | 2, seq: number): PlayerInput {
  if (slot === 1) {
    return {
      seq,
      clientTime: performance.now(),
      left: keys.has("KeyA"),
      right: keys.has("KeyD"),
      jump: keys.has("KeyW"),
      attack: keys.has("KeyJ"),
      skill1: keys.has("KeyK"),
      skill2: keys.has("KeyL"),
      ultimate: keys.has("KeyI"),
    };
  }

  return {
    seq,
    clientTime: performance.now(),
    left: keys.has("ArrowLeft"),
    right: keys.has("ArrowRight"),
    jump: keys.has("ArrowUp"),
    attack: keys.has("Digit1"),
    skill1: keys.has("Digit2"),
    skill2: keys.has("Digit3"),
    ultimate: keys.has("Digit0"),
  };
}
```

发送频率：

```ts
setInterval(() => {
  const input = buildInput(keysRef.current, mySlot, seqRef.current++);
  socket.volatile.emit("battle:input", { roomId, input });
}, 1000 / 30);
```

说明：

- `volatile` 适合实时高频数据。网络拥塞时旧输入可以丢弃，下一帧会补上最新状态。
- 技能按下最好也在 keydown 时立即发一次，降低体感延迟。

### 10.5 接收快照

```ts
socket.on("battle:snapshot", (snapshot) => {
  setLatestSnapshot(snapshot);
});
```

第一版可以直接渲染快照。

第二版建议插值：

- 服务端 20Hz 发快照。
- 客户端 60Hz 渲染。
- 远端玩家按最近两个快照做位置插值。
- 本地玩家可先直接显示服务端位置，后续加预测。

## 11. 当前游戏引擎需要改的点

### 11.1 把 setTimeout 改成帧计数

当前 `performSkill` 中存在：

```ts
setTimeout(() => { defender.isStunned = false; }, 1500);
setTimeout(() => { attacker.isShielded = false; }, 3000);
setTimeout(() => { defender.damageMultiplier = 1; }, 4000);
```

服务端权威 tick 中不要使用这种副作用。改为：

```ts
stunFrames: number;
shieldFrames: number;
debuffFrames: number;
```

每帧递减：

```ts
if (fighter.stunFrames > 0) fighter.stunFrames--;
fighter.isStunned = fighter.stunFrames > 0;
```

### 11.2 把随机数收口

当前命中、暴击、粒子中有 `Math.random()`。

建议：

- 权威逻辑里的暴击用服务端随机数。
- 粒子随机只在客户端本地生成。
- 如果需要战斗可回放，再使用 seed random。

### 11.3 把视觉状态从权威状态里移出去

服务端不需要管理：

- 粒子数组。
- 飘字数组。
- 震屏 elapsed。

服务端只广播事件：

```ts
{ type: "hit", damage, x, y }
```

客户端自行生成：

- 飘字。
- 粒子。
- 震屏。
- 音效。

### 11.4 修复编码乱码

当前角色名、技能名、部分 JSX 文案存在乱码。联网前建议先修复，否则：

- 房间里展示角色名不可读。
- 快照和事件中的 skillName 不可读。
- 分享传播效果会很差。

## 12. 性能设计

### 12.1 推荐频率

| 数据 | 频率 | 说明 |
| --- | --- | --- |
| 服务端逻辑 tick | 60Hz | 保障手感和命中精度 |
| 客户端输入上报 | 30Hz + 按键变化立即发 | 降低带宽，同时保证技能响应 |
| 状态快照广播 | 20Hz | 足够休闲格斗 MVP |
| 客户端渲染 | 60Hz | 用 requestAnimationFrame |

### 12.2 带宽估算

一个快照大约包含：

- 两个角色状态。
- 少量投射物。
- frame 和时间戳。

JSON 下粗略估算 0.8KB 到 2KB。

1 个房间：

```text
2KB * 20 snapshots/s * 2 clients = 80KB/s 下行
输入约 0.2KB * 30/s * 2 clients = 12KB/s 上行
```

100 个同时对战房间：

```text
下行约 8MB/s
上行约 1.2MB/s
```

实际会因字段名、投射物数量、压缩、传输协议而变化。

优化方法：

- 缩短字段名或使用数组格式。
- 只同步变化字段。
- 限制投射物数量。
- 快照频率从 20Hz 动态降到 15Hz。
- 使用 `socket.volatile.emit` 发送非关键快照。
- 不同步粒子。

### 12.3 Socket.IO 性能要点

根据官方性能建议：

- Socket.IO 大多数场景会建立 WebSocket，性能与底层 WebSocket 实现强相关。
- `perMessageDeflate` 默认关闭，官方说明它会带来明显性能和内存开销，只有确实需要时再开启。
- 多节点部署时不能只靠默认内存 Adapter，需要 Redis Adapter 等方案转发跨节点消息。

本项目第一版建议：

```ts
const io = new Server(server, {
  transports: ["websocket", "polling"],
  perMessageDeflate: false,
});
```

客户端如果部署环境稳定支持 WebSocket，可使用：

```ts
io(SOCKET_URL, { transports: ["websocket"] });
```

### 12.4 房间资源清理

每个房间需要清理：

- tick interval。
- snapshot interval。
- players。
- input buffers。
- GameState。

策略：

- lobby 空房间 60 秒删除。
- playing 房间双方断线 30 秒删除。
- ended 房间 30 秒删除。

伪代码：

```ts
if (room.isEmpty() && Date.now() - room.updatedAt > 60_000) {
  room.dispose();
  rooms.delete(room.roomId);
}
```

## 13. 断线和重连

### 13.1 Socket.IO 自动重连

客户端默认支持自动重连。服务端可以开启 connection state recovery。

但游戏房间仍要自己保存：

- 玩家 slot。
- reconnectToken。
- 房间状态。
- 角色选择。
- 当前战斗快照。

### 13.2 重连流程

1. 玩家加入房间时，服务端返回 `reconnectToken`。
2. 客户端把 token 存到 `sessionStorage`，作用域限定在当前浏览器标签页/会话。
3. socket 断开后，服务端标记玩家 `connected=false`，房间暂停或继续。
4. 客户端重连后发送 `room:join`，带上 roomId 和 reconnectToken。
5. 服务端校验 token，恢复原 slot。
6. 服务端发送最新 `room:state` 或 `battle:snapshot`。

关键规则：

- `buildInviteUrl(roomId)` 必须生成 `?room=<roomId>&join=1`。
- 房主创建房间后，浏览器地址栏使用 `buildRoomUrl(roomId)`，即 `?room=<roomId>`，不带 `join=1`。
- 邀请链接打开时，前端调用 `joinRoom(roomId, nickname, { asNewPlayer: true })`，不读取 `sessionStorage` 中的 token。
- 普通刷新或断线重连时，前端才读取 `sessionStorage` 中的 `reconnectToken`，恢复自己的原 slot。
- 后端 `tryReconnect` 必须拒绝抢占仍处于 connected 状态的玩家 slot：如果 token 对应玩家已在线且 socketId 不同，返回普通加入流程或拒绝，而不是覆盖原 socket。

这样可以同时满足两个场景：

- 房主刷新页面后仍恢复 player 1。
- 另一个浏览器打开邀请链接后分配 player 2，不会操控 player 1。

### 13.3 当前双浏览器验收清单

1. 浏览器 A 点击“在线对战”并创建房间。
2. A 的地址栏应为 `?room=<roomId>`，复制出来的邀请链接应为 `?room=<roomId>&join=1`。
3. 浏览器 B 打开邀请链接并加入。
4. A 显示“我的席位”为 player 1，B 显示“我的席位”为 player 2。
5. A 选角色和 ready 不应改变 B 的 mySlot；B 选角色和 ready 不应改变 A 的 mySlot。
6. 双方进入战斗后，A 只控制 P1，B 只控制 P2。
7. 刷新 A 或 B 当前页面，应在 30 秒重连窗口内恢复自己的原 slot。

### 13.4 对战中断线策略

MVP 推荐：

- 任意一方断线，游戏暂停。
- 30 秒内允许重连。
- 超时后断线方判负。

正式版可选：

- 短暂断线继续运行。
- AI 接管。
- 重连后补最新快照。

## 14. 多节点部署

第一版单节点即可：

```text
Nginx / 平台入口
  -> Node.js Socket.IO Server
```

当需要多节点：

```text
Load Balancer
  -> Node A
  -> Node B
  -> Redis Adapter
```

注意：

- Socket.IO 官方多节点文档强调需要处理负载均衡和服务端之间的消息转发。
- Redis Adapter 用 Pub/Sub 转发不同 Socket.IO 服务器之间的包。
- 使用 Redis Adapter 时仍然需要 sticky session，否则可能出现 HTTP 400，因为请求落到不知道该 Socket.IO session 的服务器。

对游戏房间而言，更推荐：

- 同一个 roomId 固定路由到同一节点。
- 或使用 sticky session。
- 或使用专门的房间调度服务。

MVP 不需要多节点。

## 15. 安全和防作弊

### 15.1 服务端必须校验

- roomId 是否存在。
- 玩家是否属于该房间。
- socket 是否对应该玩家 slot。
- 角色 id 是否有效。
- 战斗开始后不能再换角色。
- 输入频率是否异常。
- 非自己 slot 的输入必须拒绝。

### 15.2 输入限流

每个 socket 限制：

```text
battle:input <= 60 次/秒
```

超过：

- 丢弃多余输入。
- 记录异常。
- 严重时断开连接。

### 15.3 不信任客户端

客户端不能上报：

- 自己的血量。
- 自己命中了对方。
- 自己赢了。
- 技能实际伤害。

客户端只能上报：

- 输入。
- 角色选择。
- 准备状态。

所有战斗结果由服务端计算。

## 16. 测试方案

### 16.1 单元测试

重点测纯逻辑：

- 输入转换。
- 房间分配 slot。
- 角色选择校验。
- ready 状态。
- tick 后位置变化。
- 命中和伤害。
- 胜负判定。

### 16.2 集成测试

使用 `socket.io-client` 在 Node 测两个客户端：

1. clientA 创建房间。
2. clientB 加入房间。
3. A/B 选择角色。
4. A/B ready。
5. 服务端发送 battle:start。
6. A/B 发送输入。
7. 收到 battle:snapshot。

### 16.3 手工测试

场景：

- 创建房间后复制链接。
- 第二个浏览器打开链接加入。
- 两边选择角色并开始。
- 只允许控制自己的角色。
- 一方刷新页面后可重连。
- 一方关闭页面后 30 秒判负或房间暂停。
- 两个玩家看到胜负一致。

## 17. 分阶段实施计划

### 阶段 1：房间和大厅

目标：

- Socket.IO 服务端可启动。
- 客户端可连接。
- 创建房间、加入房间、复制链接可用。
- 玩家 slot 分配正确。
- 房间状态可广播。

交付：

- `server/index.ts`
- `server/rooms/RoomManager.ts`
- `src/net/socketClient.ts`
- `src/components/OnlineLobby.tsx`

验收：

- 两个浏览器能进入同一个房间。
- 房间显示玩家 1 / 玩家 2。

### 阶段 2：角色选择同步

目标：

- 双方各自选择角色。
- 服务端校验角色选择。
- 房间内同步角色和 ready 状态。
- 双方 ready 后开始倒计时。

验收：

- 玩家 A 选角色，玩家 B 能看到。
- 双方 ready 后进入战斗页。

### 阶段 3：服务端权威战斗

目标：

- 服务端初始化 GameState。
- 客户端发送标准化输入。
- 服务端固定 tick。
- 服务端广播 snapshot。
- 客户端渲染 snapshot。

验收：

- 两个浏览器可以在线移动、攻击。
- 血量和胜负一致。

### 阶段 4：体验优化

目标：

- 远端玩家插值。
- 技能按下立即发送。
- 伤害事件驱动特效。
- 断线重连。
- 延迟显示。

验收：

- 常规网络下操作手感可接受。
- 断线后可恢复或明确判负。

### 阶段 5：部署

目标：

- 构建前端。
- Express 托管 dist。
- Socket.IO 同域部署。
- 环境变量区分本地和生产。

验收：

- 线上链接可分享。
- 两台不同设备可进入同一房间对战。

## 18. 生产部署建议

### 18.1 单服务部署

生产环境可以让 Express 同时提供静态文件和 Socket.IO：

```ts
import path from "node:path";
import express from "express";

app.use(express.static(path.resolve("dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.resolve("dist/index.html"));
});
```

然后：

```bash
npm run build
tsx server/index.ts
```

正式应编译服务端或使用进程管理器：

- PM2。
- Docker。
- Render / Railway / Fly.io。
- 自有云服务器。

### 18.2 环境变量

客户端：

```text
VITE_SOCKET_URL=https://game.example.com
```

服务端：

```text
PORT=3001
CLIENT_ORIGIN=https://game.example.com
```

同域部署时客户端可以不填 URL：

```ts
io();
```

## 19. 最小代码落地清单

必须新增：

- `server/index.ts`
- `server/rooms/RoomManager.ts`
- `server/rooms/BattleRoom.ts`
- `shared/protocol.ts`
- `src/net/socketClient.ts`
- `src/net/roomUrl.ts`
- `src/components/OnlineLobby.tsx`
- `src/components/BattleArenaOnline.tsx`

必须调整：

- `package.json` 增加依赖和脚本。
- `src/App.tsx` 增加 online lobby / online battle 页面状态。
- `src/components/TitleScreen.tsx` 增加“在线对战”入口。
- `src/game/engine.ts` 支持标准输入或增加适配层。
- `src/game/GameState.ts` 去掉不适合服务端权威的副作用状态。

建议先不做：

- 排行榜。
- 登录系统。
- 观战。
- 多节点。
- 客户端预测和 rollback。

## 20. 推荐最终方案

对当前项目，Socket.IO 落地推荐采用：

```text
Node.js + Express + Socket.IO
单节点部署
roomId 链接邀请
服务器权威 GameState
客户端只发送输入
服务端 60Hz tick
服务端 20Hz snapshot
客户端 60Hz 渲染
关键事件 ack
高频输入和快照 volatile
30 秒断线重连窗口
```

这是工作量、稳定性、后续可扩展性之间最均衡的方案。

## 21. 参考资料

- Socket.IO Introduction: https://socket.io/docs/v4/
- Socket.IO Rooms: https://socket.io/docs/v4/rooms/
- Socket.IO Adapter: https://socket.io/docs/v4/adapter/
- Socket.IO Delivery Guarantees: https://socket.io/docs/v4/delivery-guarantees
- Socket.IO Connection State Recovery: https://socket.io/docs/v4/connection-state-recovery
- Socket.IO Performance Tuning: https://socket.io/docs/v4/performance-tuning/
- Socket.IO Memory Usage: https://socket.io/docs/v4/memory-usage/
- Socket.IO Redis Adapter: https://socket.io/docs/v4/redis-adapter/
