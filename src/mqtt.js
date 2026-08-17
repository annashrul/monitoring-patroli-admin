import mqtt from 'mqtt';

// Broker MQTT (HiveMQ Cloud) via WebSocket (WSS). Port 8884, path /mqtt.
const MQTT_URL =
  'wss://b1d6e3472357440fbe31591a8c65ccf7.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_USERNAME = 'tsp';
const MQTT_PASSWORD = 'Acuy040697!@';

let client = null;
const locationHandlers = new Set();
const statusHandlers = new Set();

function ensureConnected() {
  if (client) return client;

  client = mqtt.connect(MQTT_URL, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD,
    clientId: 'web_' + Math.random().toString(16).slice(2, 10),
    reconnectPeriod: 3000,
    connectTimeout: 10000,
  });

  client.on('connect', () => {
    client.subscribe('patroli/satpam/+/location', { qos: 1 });
    client.subscribe('patroli/satpam/+/status', { qos: 1 });
  });

  client.on('message', (topic, payload) => {
    const parts = String(topic).split('/');
    if (parts.length < 4) return;
    const userId = parts[2];
    const kind = parts[3];
    try {
      const data = JSON.parse(payload.toString());
      if (kind === 'location') {
        locationHandlers.forEach((fn) => fn(data));
      } else if (kind === 'status') {
        statusHandlers.forEach((fn) => fn({ id: userId, online: data?.online }));
      }
    } catch {
      // payload tidak valid — abaikan
    }
  });

  client.on('error', () => {});

  return client;
}

/**
 * Koneksi MQTT + daftarkan handler (cocok untuk pemakaian satu kali, mis. Dashboard).
 * Mendukung banyak subscriber karena handler disimpan dalam Set.
 */
export function connectMqtt({ onLocation, onStatus } = {}) {
  if (onLocation) locationHandlers.add(onLocation);
  if (onStatus) statusHandlers.add(onStatus);
  return ensureConnected();
}

/** Berlangganan event lokasi satpam; kembalikan fungsi unsubscribe. */
export function subscribeLocation(fn) {
  locationHandlers.add(fn);
  ensureConnected();
  return () => locationHandlers.delete(fn);
}

/** Berlangganan event status online/offline satpam; kembalikan fungsi unsubscribe. */
export function subscribeStatus(fn) {
  statusHandlers.add(fn);
  ensureConnected();
  return () => statusHandlers.delete(fn);
}

export function disconnectMqtt() {
  if (client) {
    try {
      client.end(true);
    } catch {
      // abaikan
    }
    client = null;
  }
}
