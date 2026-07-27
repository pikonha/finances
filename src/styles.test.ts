import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const darkTheme = css.match(/\.dark\s*\{(?<tokens>[^}]+)\}/)?.groups?.tokens ?? "";

function token(name: string) {
  const value = darkTheme.match(
    new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"),
  )?.[1];
  expect(value, `missing dark theme token --${name}`).toBeDefined();
  return value!;
}

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("dark theme accessibility", () => {
  it.each([
    ["foreground", "background"],
    ["card-foreground", "card"],
    ["popover-foreground", "popover"],
    ["muted-foreground", "muted"],
    ["primary-foreground", "primary"],
    ["accent-foreground", "accent"],
    ["destructive-foreground", "destructive"],
  ])("keeps %s readable on %s", (foreground, background) => {
    expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(["border", "input"])(
    "keeps %s visible against the page",
    (surface) => {
      expect(contrast(token(surface), token("background"))).toBeGreaterThanOrEqual(3);
    },
  );
});
