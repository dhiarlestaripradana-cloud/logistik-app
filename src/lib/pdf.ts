import puppeteer, { type Browser } from "puppeteer";

const ARGS_CHROMIUM = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
  "--disable-extensions",
  "--disable-background-networking",
  "--font-render-hinting=none",
  "--js-flags=--max-old-space-size=256", 
];

const IDLE_MS = 5 * 60_000; 
const MAKS_RENDER = 50;     
const MAKS_ANTRE = 6;       
const BATAS_CLOSE_MS = 5_000;

type StatePdf = {
  browserPromise: Promise<Browser> | null;
  idleTimer: NodeJS.Timeout | null;
  jumlahRender: number;
  antre: number;
  rantai: Promise<unknown>;
};

const g = globalThis as unknown as { __pdfState?: StatePdf };
const S: StatePdf = (g.__pdfState ??= {
  browserPromise: null,
  idleTimer: null,
  jumlahRender: 0,
  antre: 0,
  rantai: Promise.resolve(),
});

const jeda = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ambilBrowser(): Promise<Browser> {
  if (S.browserPromise) {
    const b = await S.browserPromise.catch(() => null);
    if (b?.connected) return b;
    S.browserPromise = null; 
  }

  S.browserPromise = puppeteer
    .launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ARGS_CHROMIUM,
      protocolTimeout: 120_000,
    })
    .then((b) => {
      S.jumlahRender = 0;
      b.on("disconnected", () => { S.browserPromise = null; });
      return b;
    })
    .catch((e) => {
      S.browserPromise = null;
      throw e;
    });

  return S.browserPromise;
}

async function tutupBrowser(): Promise<void> {
  const p = S.browserPromise;
  S.browserPromise = null;
  if (!p) return;

  let browser: Browser;
  try {
    browser = await p;
  } catch {
    return; 
  }

  const proc = browser.process();
  const penutupan = browser.close();
  penutupan.catch(() => {}); 

  try {
    await Promise.race([
      penutupan,
      jeda(BATAS_CLOSE_MS).then(() => {
        throw new Error(`browser.close() melebihi ${BATAS_CLOSE_MS}ms`);
      }),
    ]);
  } catch (e) {
    console.error("[pdf] penutupan bermasalah — kill paksa:", e);
    if (proc && proc.exitCode === null && !proc.killed) {
      try { proc.kill("SIGKILL"); } catch { }
    }
  }
}

function jadwalkanIdle() {
  if (S.idleTimer) clearTimeout(S.idleTimer);
  S.idleTimer = setTimeout(() => {
    if (S.antre === 0) void tutupBrowser();
  }, IDLE_MS);
  S.idleTimer.unref?.(); 
}

async function render(html: string, landscape: boolean): Promise<Uint8Array> {
  const browser = await ambilBrowser();
  let page = null;
  try {
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    return await page.pdf({
      format: "A4",
      landscape,
      printBackground: true,
      margin: { top: "12mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });
  } finally {
    if (page) await page.close().catch(() => {});
    if (++S.jumlahRender >= MAKS_RENDER) await tutupBrowser();
  }
}

export async function htmlToPdf(
  html: string,
  opts: { landscape?: boolean } = {}
): Promise<Uint8Array> {
  if (S.antre >= MAKS_ANTRE) {
    throw new Error("Antrean cetak penuh — tunggu beberapa detik lalu coba lagi.");
  }

  S.antre++;
  const giliran = S.rantai.then(() => render(html, opts.landscape ?? false));
  S.rantai = giliran.catch(() => {}); 

  try {
    return await giliran;
  } finally {
    S.antre--;
    jadwalkanIdle();
  }
}