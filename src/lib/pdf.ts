import puppeteer, { type Browser } from "puppeteer";

// -------------------------------------------------------------
//  Mesin PDF — render HTML → PDF via Chromium headless.
//  CATATAN ZOMBIE PROCESS:
//   `browser.close()` di finally TIDAK cukup sendirian. Container app
//   WAJIB jalan dengan `init: true` (tini sebagai PID 1) supaya proses
//   cucu Chromium (zygote/renderer) di-reap. Tanpa itu node = PID 1
//   dan tidak pernah waitpid() → <defunct> menumpuk selamanya.
//   `--no-zygote` di bawah mengurangi jumlah proses cucu sejak awal.
// -------------------------------------------------------------

const ARGS_CHROMIUM = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",                    // ← kunci: tidak fork zygote → tidak ada cucu yatim
  "--disable-extensions",
  "--disable-background-networking",
  "--font-render-hinting=none",
];

const BATAS_CLOSE_MS = 5_000;
const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tutup browser dengan jaminan: close() normal, SIGKILL bila menggantung. */
async function tutupPaksa(browser: Browser | null): Promise<void> {
  if (!browser) return;
  const proc = browser.process();

  const penutupan = browser.close();
  penutupan.catch(() => {}); // cegah unhandled rejection saat kalah balapan

  try {
    await Promise.race([
      penutupan,
      jeda(BATAS_CLOSE_MS).then(() => {
        throw new Error(`browser.close() melebihi ${BATAS_CLOSE_MS}ms`);
      }),
    ]);
  } catch (e) {
    console.error("[pdf] penutupan browser bermasalah — kill paksa:", e);
    // proc.kill() terikat ke handle child, aman dari PID reuse.
    if (proc && proc.exitCode === null && !proc.killed) {
      try {
        proc.kill("SIGKILL");
      } catch (err) {
        console.error("[pdf] SIGKILL gagal:", err);
      }
    }
  }
}

export async function htmlToPdf(
  html: string,
  opts: { landscape?: boolean } = {}
): Promise<Uint8Array> {
  let browser: Browser | null = null;   // ← deklarasi di luar try

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ARGS_CHROMIUM,
      protocolTimeout: 120_000,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });

    const pdf = await page.pdf({
      format: "A4",
      landscape: opts.landscape ?? false,
      printBackground: true,
      margin: { top: "12mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });

    await page.close().catch(() => {});
    return pdf;
  } finally {
    // Dijamin jalan: sukses, error, maupun throw di tengah jalan.
    await tutupPaksa(browser);
  }
}