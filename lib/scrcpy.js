Promise = require("bluebird");
const EventEmitter = require("events");
const path = require("path");
const adb = require("adbkit");
const net = require("net");
const PromiseSocket = require("promise-socket");
const debug = require("debug")("scrcpy");

/**
 * How scrcpy works?
 *
 * Its a jar file that runs on an adb shell. It records the screen in h264 and offers it in a given tcp port.
 *
 * scrcpy params
 *   maxSize         (integer, multiple of 8) 0
 *   bitRate         (integer)
 *   tunnelForward   (optional, bool) use "adb forward" instead of "adb tunnel"
 *   crop            (optional, string) "width:height:x:y"
 *   sendFrameMeta   (optional, bool)
 *
 * The video stream contains raw packets, without time information. If sendFrameMeta is enabled a meta header is added
 * before each packet.
 * The "meta" header length is 12 bytes
 * [. . . . . . . .|. . . .]. . . . . . . . . . . . . . . ...
 *  <-------------> <-----> <-----------------------------...
 *        PTS         size      raw packet (of size len)
 *
 */

class Scrcpy extends EventEmitter {
  constructor(config) {
    super();
    this._config = Object.assign(
      {
        adbHost: "localhost",
        adbPort: 5037,
        deviceId: null,
        port: 8099,
        maxSize: 600,
        bitrate: 999999999,
        tunnelForward: true,
        tunnelDelay: 3000,
        crop: "9999:9999:0:0",
        sendFrameMeta: true,
      },
      config
    );

    this.adbClient = adb.createClient({
      host: this._config.adbHost,
      port: this._config.adbPort,
    });
  }

  /**
   * Will connect to the android device, send & run the server and return deviceName, width and height.
   * After that data will be offered as a 'data' event.
   */
  async start() {
    const devices = await this.adbClient.listDevices().catch((e) => {
      debug("Impossible to list devices:", e);
      throw e;
    });

    const device = this._config.deviceId
      ? devices.find((d) => d.id === this._config.deviceId)
      : devices[0];
    if (!device) {
      throw new Error(
        this._config.deviceId
          ? `Device ${this._config.deviceId} not found in adb`
          : "No device present in adb server"
      );
    }

    // Transfer server...
    await this.adbClient
      .push(
        device.id,
        path.join(__dirname, "scrcpy-server.jar"),
        "/data/local/tmp/scrcpy-server.jar"
      )
      .then(
        (transfer) =>
          new Promise((resolve, reject) => {
            transfer.on("progress", (stats) => {
              debug(
                "[%s] Pushed %d bytes so far",
                device.id,
                stats.bytesTransferred
              );
            });
            transfer.on("end", () => {
              debug("[%s] Push complete", device.id);
              resolve();
            });
            transfer.on("error", reject);
          })
      )
      .catch((e) => {
        debug("Impossible to transfer server file:", e);
        throw e;
      });

    // Run server
    await this.adbClient
      .shell(
        device.id,
        "CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / " +
          `com.genymobile.scrcpy.Server ${this._config.maxSize} ${this._config.bitrate} ${this._config.tunnelForward} ` +
          `${this._config.crop} ${this._config.sendFrameMeta} `
      )
      .catch((e) => {
        debug("Impossible to run server:", e);
        throw e;
      });

    await this.adbClient
      .forward(device.id, `tcp:${this._config.port}`, "localabstract:scrcpy")
      .catch((e) => {
        debug(`Impossible to forward port ${this._config.port}:`, e);
        throw e;
      });

    this.socket = new PromiseSocket(new net.Socket());

    // Wait 1 sec to forward to work
    await Promise.delay(this._config.tunnelDelay);

    // Connect
    await this.socket.connect(this._config.port, "127.0.0.1").catch((e) => {
      debug(`Impossible to connect "127.0.0.1:${this._config.port}":`, e);
      throw e;
    });

    // First chunk is 69 bytes length -> 1 dummy byte, 64 bytes for deviceName, 2 bytes for width & 2 bytes for height
    const firstChunk = await this.socket.read(69).catch((e) => {
      debug("Impossible to read first chunk:", e);
      throw e;
    });

    const name = firstChunk.slice(1, 65).toString("utf8");
    const width = firstChunk.readUInt16BE(65);
    const height = firstChunk.readUInt16BE(67);

    if (this._config.sendFrameMeta) {
      this._startStreamWithMeta();
    } else {
      this._startStreamRaw();
    }

    return { name, width, height };
  }

  stop() {
    if (this.socket) {
      this.socket.destroy();
    }
  }

  _startStreamRaw() {
    this.socket.stream.on("data", (d) => this.emit("data", d));
  }

  _startStreamWithMeta() {
    this.socket.stream.pause();
    let header = null;
    this.socket.stream.on("readable", () => {
      debug("Readeable");
      while (true) {
        if (header === null) {
          const chunk = this.socket.stream.read(12);
          if (!chunk) {
            break;
          }
          header = {
            pts: chunk.slice(0, 8),
            len: chunk.readUInt32BE(8),
          };
          debug("\tHeader");
          debug(`\t\tPTS = ${header.pts}`);
          debug(`\t\tlen = ${header.len}`);
        }
        const chunk = this.socket.stream.read(header.len);
        if (!chunk) {
          break;
        }
        debug("\tPacket");
        debug(`\t\tlength = ${chunk.length}`);
        this.emit("data", header.pts, chunk);
        header = null;
      }
    });
  }
}

module.exports = Scrcpy;
