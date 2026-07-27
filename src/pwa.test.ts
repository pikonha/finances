import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const publicPath = (...parts: string[]) => resolve(process.cwd(), "public", ...parts);
const manifest = JSON.parse(
  readFileSync(publicPath("manifest.webmanifest"), "utf8"),
) as {
  name: string;
  start_url: string;
  scope: string;
  display: string;
  icons: Array<{ src: string; sizes: string; purpose: string }>;
};

describe("PWA", () => {
  it("has an installable manifest with complete icons", () => {
    expect(manifest).toMatchObject({
      name: "Finances",
      start_url: "/",
      scope: "/",
      display: "standalone",
    });
    expect(manifest.icons.some((icon) => icon.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((icon) => icon.sizes === "512x512")).toBe(true);
    expect(manifest.icons.some((icon) => icon.purpose === "maskable")).toBe(true);

    for (const icon of manifest.icons) {
      expect(statSync(publicPath(icon.src.replace(/^\//, ""))).size).toBeGreaterThan(0);
    }
  });

  it("ships a service worker and offline fallback without caching private data", () => {
    const serviceWorker = readFileSync(publicPath("sw.js"), "utf8");

    expect(serviceWorker).toContain('request.mode === "navigate"');
    expect(serviceWorker).toContain('caches.match("/offline.html")');
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")');
    expect(serviceWorker).not.toMatch(/cache\.put\(request[\s\S]*mode === "navigate"/);
    expect(statSync(publicPath("offline.html")).size).toBeGreaterThan(0);
  });
});
