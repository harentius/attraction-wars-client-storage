class Storage {
  static get PLAYER_DATA_CREATED() { return 'player_data_created'; }
  static get PLAYER_DATA_RECEIVED() { return 'player_data_received'; }
  static get WORLD_DATA_CREATED() { return 'world_data_created'; }
  static get CONNECT() { return 'connect'; }
  static get DISCONNECT() { return 'disconnect'; }
  static get UPDATE_SCORE() { return 'update_score'; }
  static get UPDATE_SERVER_STATISTICS() { return 'update_server_statistics'; }
  static get UPDATE_ZOOM() { return 'update_zoom'; }
  static get NOTIFICATION() { return 'notification'; }

  constructor() {
    this._events = {};
    this.refresh();
  }

  refresh(
    worldData = {
      playersData: {},
      asteroidsData: {},
      worldBounds: [],
      relativeZonesSizes: [],
      asteroidAttractionRadiusMultiplier: 1.0,
      serverStatistics: {},
    },
    playerData = {},
  ) {
    if (this._playerId) {
      this.trigger(Storage.DISCONNECT, [this.playerData]);
    }

    this.worldData = worldData;
    this.playerData = playerData;
    this._playerId = null;
    this.isConnected = false;
    this.zoom = 1.0;

    delete this._events[Storage.UPDATE_ZOOM];
    delete this._events[Storage.UPDATE_SCORE];
  }

  updateAsteroidData(asteroidData) {
    Object.assign(this.worldData.asteroidsData[asteroidData.id], asteroidData);
  }

  updateWorldData(worldData, isCreating = false) {
    if (worldData.worldBounds) {
      this.worldData.worldBounds = worldData.worldBounds;
      this.worldData.relativeZonesSizes = worldData.relativeZonesSizes;
      this.worldData.asteroidAttractionRadiusMultiplier
        = worldData.asteroidAttractionRadiusMultiplier
      ;
    }

    // Players Data sync
    if (worldData.playersData) {
      for (const key of Object.keys(worldData.playersData)) {
        // eslint-disable-next-line
        worldData.playersData[key].id = key;

        if (this.worldData.playersData[key]) {
          Object.assign(this.worldData.playersData[key], worldData.playersData[key]);
        } else {
          this.worldData.playersData[key] = worldData.playersData[key];
        }
      }

      for (const key of Object.keys(this.worldData.playersData)) {
        if (!worldData.playersData[key]) {
          delete this.worldData.playersData[key];
        }
      }
    }

    // Current planet data sync
    if (worldData.playersData && worldData.playersData[this._playerId]) {
      const oldScore = Math.round(this.playerData.score);
      const newScore = Math.round(worldData.playersData[this._playerId].score);

      if (oldScore !== newScore) {
        this.trigger(Storage.UPDATE_SCORE, [
          oldScore,
          newScore,
          Math.round(worldData.playersData[this._playerId].r),
        ]);
      }

      Object.assign(this.playerData, worldData.playersData[this._playerId]);
      this.trigger(Storage.PLAYER_DATA_RECEIVED, [worldData.playersData[this._playerId]]);
    }

    // Asteroids Data sync
    if (worldData.asteroidsData) {
      for (const key of Object.keys(worldData.asteroidsData)) {
        // eslint-disable-next-line
        worldData.asteroidsData[key].id = key;

        if (this.worldData.asteroidsData[key]) {
          Object.assign(this.worldData.asteroidsData[key], worldData.asteroidsData[key]);
        } else {
          this.worldData.asteroidsData[key] = worldData.asteroidsData[key];
        }
      }

      for (const key of Object.keys(this.worldData.asteroidsData)) {
        if (!worldData.asteroidsData[key]) {
          delete this.worldData.asteroidsData[key];
        }
      }
    }

    if (isCreating) {
      this.trigger(Storage.WORLD_DATA_CREATED);
    }

    this._checkConnected();
  }

  updatePlayerData(playerData) {
    const isConnected = Object.keys(this.playerData).length === 0
      && Object.keys(playerData).length !== 0
    ;

    Object.assign(this.playerData, playerData);
    this._playerId = playerData.id;

    if (isConnected) {
      this.trigger(Storage.PLAYER_DATA_CREATED);
    }

    this._checkConnected();
  }

  updateServerStatisticsData(serverStatistics) {
    if (serverStatistics
      && JSON.stringify(this.worldData.serverStatistics)
      !== JSON.stringify(serverStatistics)
    ) {
      this.trigger(Storage.UPDATE_SERVER_STATISTICS, [serverStatistics]);
      this.worldData.serverStatistics = serverStatistics;
    }
  }

  setZoom(zoom) {
    this.zoom = zoom;
    this.trigger(Storage.UPDATE_ZOOM, [zoom]);
  }

  getScale() {
    return 1.0 / this.zoom;
  }

  on(event, callback) {
    if (typeof this._events[event] === 'undefined') {
      this._events[event] = [];
    }

    this._events[event].push(callback);

    return this;
  }

  off(event) {
    if (typeof this._events[event] === 'undefined') {
      return;
    }

    this._events[event] = [];
  }

  trigger(event, data) {
    if (typeof this._events[event] === 'undefined') {
      return;
    }

    for (const callback of this._events[event]) {
      callback.apply(this, data);
    }
  }

  _checkConnected() {
    if (!this.isConnected
      && Object.keys(this.worldData.playersData).length > 0
      && this._playerId
      && this.worldData.playersData[this._playerId]
    ) {
      this.isConnected = true;
      this.trigger(Storage.CONNECT);
    }
  }
}

export default Storage;
