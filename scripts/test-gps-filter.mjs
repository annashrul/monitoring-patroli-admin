// Test mandiri GPS filter (tanpa framework): node scripts/test-gps-filter.mjs
import { GpsFilter } from "../src/utils/gpsFilter.js";

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    passed += 1;
    console.log("ok:", msg);
  } else {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

// 1. Jitter saat diam → diabaikan setelah first fix
{
  const f = new GpsFilter();
  assert(f.push({ latitude: -6.9298423, longitude: 107.5719472, accuracy: 5 }).accepted === true, "first fix diterima");
  for (const [lat, lng] of [
    [-6.9298511, 107.5719528],
    [-6.9298379, 107.5719441],
    [-6.9298482, 107.5719498],
    [-6.929839, 107.571946],
  ]) {
    assert(f.push({ latitude: lat, longitude: lng, accuracy: 5 }).accepted === false, "jitter saat diam diabaikan");
  }
}

// 2. Outlier lompatan jauh → diabaikan (marker tidak melompat)
{
  const f = new GpsFilter();
  f.push({ latitude: -6.92, longitude: 107.57, accuracy: 5 });
  assert(f.push({ latitude: -6.92, longitude: 107.58, accuracy: 5 }).accepted === false, "lompatan ±1,1 km diabaikan");
}

// 3. Accuracy buruk (±150 m) → diabaikan
{
  const f = new GpsFilter();
  f.push({ latitude: -6.92, longitude: 107.57, accuracy: 5 });
  assert(f.push({ latitude: -6.92005, longitude: 107.57005, accuracy: 150 }).accepted === false, "accuracy 150 m diabaikan");
}

// 4. Gerakan cepat → konfirmasi via net displacement (>= 10 m)
{
  const f = new GpsFilter();
  f.push({ latitude: -6.92, longitude: 107.57, accuracy: 5 });
  let r = f.push({ latitude: -6.92006, longitude: 107.57006, accuracy: 5 }); // ~9 m
  assert(r.accepted === false && r.reason === "pending_confirmation", "sampel gerak pertama belum dikonfirmasi");
  r = f.push({ latitude: -6.92012, longitude: 107.57012, accuracy: 5 }); // ~18 m netto
  assert(r.accepted === true && r.status === "moving", "net displacement >= 10 m mengkonfirmasi gerakan");
}

// 5. Gerakan zigzag (netto < 10 m) → konfirmasi via jumlah sampel beruntun
{
  const f = new GpsFilter();
  f.push({ latitude: -6.92, longitude: 107.57, accuracy: 5 });
  // Tiap sampel ~6 m dari jangkar tapi netto tidak pernah >= 10 m.
  const samples = [
    [-6.92004, 107.57004],
    [-6.92004, 107.56996],
    [-6.92004, 107.57004],
  ];
  const results = samples.map(([lat, lng]) =>
    f.push({ latitude: lat, longitude: lng, accuracy: 5 }),
  );
  assert(results[0].accepted === false, "zigzag sampel 1 menunggu");
  assert(results[1].accepted === false, "zigzag sampel 2 menunggu");
  assert(results[2].accepted === true && f.getStatus() === "moving", "3 sampel beruntun mengkonfirmasi gerakan");
}

// 6. Gerakan lambat searah (tiap langkah < threshold) → tetap terdeteksi
{
  const f = new GpsFilter();
  f.push({ latitude: -6.92, longitude: 107.57, accuracy: 5 });
  let accepted = false;
  for (let i = 1; i <= 12; i++) {
    const dLat = 0.00003 * i; // ~3,3 m per langkah searah
    if (f.push({ latitude: -6.92 + dLat, longitude: 107.57, accuracy: 5 }).accepted) {
      accepted = true;
      break;
    }
  }
  assert(accepted === true, "gerakan lambat tetap terdeteksi (net displacement)");
}

// 7. MOVING → diam → menjadi STATIONARY, marker stabil
{
  const f = new GpsFilter();
  f.push({ latitude: -6.92, longitude: 107.57, accuracy: 5 });
  f.push({ latitude: -6.92006, longitude: 107.57006, accuracy: 5 });
  f.push({ latitude: -6.92012, longitude: 107.57012, accuracy: 5 });
  f.push({ latitude: -6.92018, longitude: 107.57018, accuracy: 5 }); // moving
  assert(f.getStatus() === "moving", "status moving");
  for (let i = 0; i < 5; i++) f.push({ latitude: -6.92018, longitude: 107.57018, accuracy: 5 });
  assert(f.getStatus() === "stationary", "kembali stationary setelah diam 3+ sampel");
  const anchor = f.getLastValid();
  for (let i = 0; i < 5; i++) {
    assert(
      f.push({ latitude: anchor.lat + 0.00002, longitude: anchor.lng + 0.00002, accuracy: 5 }).accepted === false,
      "marker stabil saat diam",
    );
  }
}

// 8. Outlier saat MOVING → diabaikan
{
  const f = new GpsFilter();
  f.push({ latitude: -6.92, longitude: 107.57, accuracy: 5 });
  f.push({ latitude: -6.92006, longitude: 107.57006, accuracy: 5 });
  f.push({ latitude: -6.92012, longitude: 107.57012, accuracy: 5 });
  f.push({ latitude: -6.92018, longitude: 107.57018, accuracy: 5 });
  assert(f.push({ latitude: -6.93, longitude: 107.58, accuracy: 5 }).accepted === false, "outlier saat moving diabaikan");
}

console.log(`\n${failed === 0 ? "✅" : "❌"} ${passed} lolos, ${failed} gagal`);
process.exit(failed === 0 ? 0 : 1);
