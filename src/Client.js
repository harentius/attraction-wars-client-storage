import io from 'socket.io-client';
import parser from 'socket.io-msgpack-parser';
import Storage from './Storage';

const HEARTBEAT_INTERVAL = 30000;

class Client {
  constructor(storage, serverUrl) {
    this.storage = storage;
    this.serverUrl = serverUrl;
    this.socket = null;
    this.hearbeatInterval = null;
  }

  sendKeysPressState(keysPressState) {
    this.socket.emit('keysPressState', keysPressState);
  }

  login(username) {
    if (this.isConnected()) {
      return;
    }

    this._connect();
    this.socket.emit('login', username);
  }

  logout() {
    if (!this.isConnected()) {
      return;
    }

    this.socket.disconnect();
  }

  getConnectionId() {
    if (!this.isConnected()) {
      return null;
    }

    return this.socket.id;
  }

  isConnected() {
    return !!this.socket;
  }

  _connect() {
    this.socket = io(this.serverUrl, {
      parser,
      transports: ['websocket'],
      reconnection: false,
      timeout: 1500,
    });

    const handleConnectionError = () => {
      this._disconnect();
      this.storage.trigger(Storage.NOTIFICATION, [{
        type: 'error',
        message: 'Server Connection Error. Please try again later',
      }]);
    };

    this.socket.on('connect_error', () => {
      handleConnectionError();
    });
    this.socket.on('connect_timeout', () => {
      handleConnectionError();
    });

    this.socket.on('fullWorldData', (data) => {
      this.storage.updateWorldData(data, true);

      this.socket.on('worldData', (data1) => {
        this.storage.updateWorldData(data1);
      });
    });

    this.socket.on('playerData', (data) => {
      this.storage.updatePlayerData(data);
    });

    this.socket.on('asteroidData', (data) => {
      this.storage.updateAsteroidData(data);
    });

    this.socket.on('serverStatisticsData', (data) => {
      this.storage.updateServerStatisticsData(data);
    });

    this.socket.on('disconnect', () => {
      this._disconnect();
    });

    this.socket.on('notification', (data) => {
      this.storage.trigger(Storage.NOTIFICATION, [data]);
    });

    this.hearbeatInterval = setInterval(() => {
      this.socket.emit('heartbeat')
    }, HEARTBEAT_INTERVAL);
  }

  _disconnect() {
    this.storage.refresh();
    this.socket = null;
    clearInterval(this.hearbeatInterval);
    this.hearbeatInterval = null;
  }
}

export default Client;
