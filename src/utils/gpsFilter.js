/**
 * GPS Filter — penyaring koordinat MQTT sebelum dipakai menggerakkan marker
 * dan menggambar polyline tracking di web admin.
 *
 * Masalah yang diatasi:
 * - GPS jitter saat satpam diam (koordinat berubah ±beberapa meter) → IGNORE
 * - GPS outlier (lompatan tiba-tiba jauh) → IGNORE
 * - Accuracy buruk (±100–200 m) → jangan pindahkan marker
 * - Pergerakan lambat → tetap terdeteksi (lewat perpindahan netto + jumlah sampel)
 * - Satpam diam → marker stabil; satpam bergerak → marker mengikuti
 *
 * MQTT tetap dikirim setiap ±1 detik; filter ini murni di sisi tampilan
 * (web admin), tidak mengubah frekuensi MQTT.
 */

export const GPS_FILTER_DEFAULTS = {
  // Akurasi (meter). Titik dengan accuracy lebih buruk dari ini diabaikan.
  minAccuracyM: 50,
  // Ambang jarak (meter). Saat status STATIONARY, perpindahan <= ini = jitter.
  stationaryThresholdM: 5,
  // Perpindahan netto dari titik jangkar yang dianggap gerakan nyata (meter).
  // Menangkap pergerakan lambat yang tiap sampelnya < stationaryThreshold.
  movementConfirmationM: 10,
  // Jumlah sampel beruntun melewati stationaryThreshold sebelum gerak dikonfirmasi.
  movementConfirmationCount: 3,
  // Saat MOVING, jumlah sampel beruntun kecil sebelum status kembali STATIONARY.
  stillThresholdCount: 3,
  // Lompatan (meter) yang dianggap outlier bila jauh dari titik jangkar
  // DAN dari titik mentah sebelumnya.
  maxJumpM: 150,
  // Durasi animasi marker saat posisi valid berpindah (ms).
  smoothingDurationMs: 900,
};

export const GPS_STATUS = {
  STATIONARY: "stationary",
  MOVING: "moving",
};

/** Jarak haversine dua koordinat dalam meter. */
export function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Easing untuk animasi marker (mulai lambat, cepat di tengah, melambat di akhir). */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * State machine filter GPS (satu instance per satpam).
 *
 * `push()` dipanggil untuk setiap koordinat MQTT. Jika mengembalikan
 * `accepted: true`, koordinat layak dipakai untuk memindahkan marker dan
 * menambah titik polyline. Jika `accepted: false`, abaikan.
 */
export class GpsFilter {
  constructor(config = {}) {
    this.config = { ...GPS_FILTER_DEFAULTS, ...config };
    this.status = GPS_STATUS.STATIONARY;
    // Titik valid terakhir (posisi marker yang ditampilkan).
    this.anchor = null;
    // Titik mentah terakhir yang diterima (untuk deteksi outlier beruntun).
    this.lastRaw = null;
    // Akumulasi gerakan yang menunggu konfirmasi (saat status STATIONARY).
    this.candidate = null;
    this.stillCount = 0;
  }

  getStatus() {
    return this.status;
  }

  getLastValid() {
    return this.anchor;
  }

  /**
   * Proses satu koordinat dari MQTT.
   * @param {{ latitude: number, longitude: number, accuracy?: number, timestamp?: string }} raw
   * @returns {{ accepted: boolean, reason: string, point?: object, status?: string }}
   */
  push({ latitude, longitude, accuracy, timestamp } = {}) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { accepted: false, reason: "invalid" };
    }
    const raw = { lat, lng, accuracy, timestamp };

    // 1) Gate akurasi: accuracy sangat buruk → jangan pindahkan marker.
    if (
      typeof accuracy === "number" &&
      Number.isFinite(accuracy) &&
      accuracy > this.config.minAccuracyM
    ) {
      this.lastRaw = raw;
      return { accepted: false, reason: "bad_accuracy" };
    }

    // 2) Titik valid pertama → jangkar awal.
    if (!this.anchor) {
      this.anchor = raw;
      this.lastRaw = raw;
      return {
        accepted: true,
        reason: "first_fix",
        point: this.anchor,
        status: this.status,
      };
    }

    const dAnchor = haversineMeters(this.anchor.lat, this.anchor.lng, lat, lng);
    const dLastRaw = this.lastRaw
      ? haversineMeters(this.lastRaw.lat, this.lastRaw.lng, lat, lng)
      : Infinity;
    this.lastRaw = raw;

    // 3) Outlier: lompatan jauh dari jangkar DAN dari titik mentah sebelumnya.
    const isJump = dAnchor > this.config.maxJumpM && dLastRaw > this.config.maxJumpM;

    if (this.status === GPS_STATUS.STATIONARY) {
      if (isJump) {
        this.candidate = null;
        return { accepted: false, reason: "outlier" };
      }
      // Perpindahan kecil saat diam = jitter.
      if (dAnchor <= this.config.stationaryThresholdM) {
        return { accepted: false, reason: "jitter" };
      }
      // Kandidat gerakan — tunggu konfirmasi sebelum memindahkan marker.
      const cand = this.candidate || {
        lat,
        lng,
        steps: 0,
        net: 0,
      };
      cand.lat = lat;
      cand.lng = lng;
      cand.steps += 1;
      cand.net = haversineMeters(this.anchor.lat, this.anchor.lng, lat, lng);
      this.candidate = cand;

      // Konfirmasi: cukup banyak sampel beruntun, ATAU perpindahan netto
      // sudah melewati batas (menangkap gerakan lambat / drifting).
      if (
        cand.steps >= this.config.movementConfirmationCount ||
        cand.net >= this.config.movementConfirmationM
      ) {
        this.candidate = null;
        this.status = GPS_STATUS.MOVING;
        this.anchor = raw;
        return {
          accepted: true,
          reason: "movement_confirmed",
          point: this.anchor,
          status: this.status,
        };
      }
      return { accepted: false, reason: "pending_confirmation" };
    }

    // status === MOVING
    if (isJump) {
      this.stillCount = 0;
      return { accepted: false, reason: "outlier" };
    }
    // Perpindahan kecil saat bergerak: bisa jadi jeda atau berhenti.
    if (dAnchor <= this.config.stationaryThresholdM) {
      this.stillCount += 1;
      if (this.stillCount >= this.config.stillThresholdCount) {
        this.status = GPS_STATUS.STATIONARY;
        this.candidate = null;
        this.stillCount = 0;
        return { accepted: false, reason: "became_stationary" };
      }
      return { accepted: false, reason: "pause" };
    }
    this.stillCount = 0;
    this.anchor = raw;
    return {
      accepted: true,
      reason: "moving",
      point: this.anchor,
      status: this.status,
    };
  }
}

/**
 * Animasi interpolasi posisi [lat, lng] dari `from` ke `to` memakai
 * requestAnimationFrame + easing. Kembalikan fungsi pembatal.
 *
 * @param {{lat:number,lng:number}} from
 * @param {{lat:number,lng:number}} to
 * @param {(lat:number,lng:number)=>void} onFrame
 * @param {number} durationMs
 */
export function animatePosition(from, to, onFrame, durationMs = GPS_FILTER_DEFAULTS.smoothingDurationMs) {
  if (!from || !to) return () => {};
  if (durationMs <= 0 || (from.lat === to.lat && from.lng === to.lng)) {
    onFrame(to.lat, to.lng);
    return () => {};
  }
  let rafId = null;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / durationMs);
    const e = easeInOutCubic(t);
    onFrame(
      from.lat + (to.lat - from.lat) * e,
      from.lng + (to.lng - from.lng) * e,
    );
    if (t < 1) rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);
  return () => {
    if (rafId != null) cancelAnimationFrame(rafId);
  };
}
