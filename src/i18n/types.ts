export interface LocaleMessages {
  common: {
    back: string;
    backHome: string;
    room: string;
    online: string;
    offline: string;
    waiting: string;
    unknown: string;
    notSelected: string;
  };
  title: {
    title: string;
    subtitle: string;
    localBattle: string;
    onlineBattle: string;
    controls: string;
    languageAria: string;
  };
  characterSelect: {
    title: string;
    playerPrompt: (player: 1 | 2) => string;
    editing: string;
    clickToReselect: string;
    notSelected: string;
    roster: string;
    skillPreview: string;
    attackSpeed: string;
    movementSpeed: string;
    damage: string;
    mpCost: string;
    emptySkill: string;
    clearSelection: string;
    player2Select: string;
    reselectPlayer1: string;
    startBattle: string;
    waitingPlayer2: string;
    speedSlow: string;
    speedFast: string;
    speedQuick: string;
    speedNormal: string;
    playerLabel: (player: 1 | 2) => string;
  };
  onlineLobby: {
    eyebrow: string;
    title: string;
    connected: string;
    connecting: string;
    nickname: string;
    createRoom: string;
    roomCode: string;
    joinRoom: string;
    copiedInvite: string;
    copyInvite: string;
    mySlot: string;
    opponentSlot: string;
    waitingJoin: string;
    chooseCharacter: string;
    countdown: (seconds: number) => string;
    readyHint: string;
    cancelReady: string;
    ready: string;
    localUnaffected: string;
    readyStatus: string;
    waitStatus: string;
    emptyStatus: string;
  };
  battle: {
    backToSelect: string;
    combo: string;
    skillLabels: {
      attack: string;
      skill1: string;
      skill2: string;
      ultimate: string;
    };
    skillTypes: Record<string, string>;
  };
  onlineBattle: {
    onlineVs: string;
    battleResult: string;
    playerWins: (player: number) => string;
    battleCountdown: (seconds: number) => string;
    waitingSnapshot: string;
    backToLobby: string;
    winnerLine: (name: string) => string;
    leave: string;
    myKeys: string;
    victory: string;
    stun: string;
    ping: (ms: number | null) => string;
  };
  victory: {
    playerWins: (player: number) => string;
    characterWins: (name: string, title: string) => string;
    champion: string;
    playAgain: string;
    changeCharacter: string;
  };
  characters: Record<string, {
    name: string;
    title: string;
    taunts?: string[];
  }>;
  skills: Record<string, Record<string, {
    name: string;
    description: string;
  }>>;
  errors: {
    unknown: string;
    socketNotConfigured: string;
    createRoomFailed: string;
    backendConnectFailed: string;
    joinRoomFailed: string;
    joinRoomTimeout: string;
    selectCharacterFailed: string;
    readyFailed: string;
    server: Record<string, string>;
  };
}
