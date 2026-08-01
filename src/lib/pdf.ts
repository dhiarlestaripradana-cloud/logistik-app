import puppeteer from "puppeteer";

// -------------------------------------------------------------
//  Mesin PDF (Blueprint 1.2): render HTML → PDF via Chromium headless.
//  - Dev Windows/Mac: memakai Chromium bundled puppeteer (auto-download).
//  - Produksi Docker: memakai Chromium sistem Alpine via
//    PUPPETEER_EXECUTABLE_PATH (sudah di-set di Dockerfile) + --no-sandbox.
//  - setContent() dipakai (bukan goto URL) → bebas masalah auth/jaringan.
//  - Browser diluncurkan per-request lalu ditutup di finally →
//    bebas memory leak; cocok untuk volume cetak internal.
// -------------------------------------------------------------

export async function htmlToPdf(
  html: string,
  opts: { landscape?: boolean } = {}
): Promise<Uint8Array> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      landscape: opts.landscape ?? false,
      printBackground: true,
      margin: { top: "12mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });
  } finally {
    await browser.close();
  }
}
