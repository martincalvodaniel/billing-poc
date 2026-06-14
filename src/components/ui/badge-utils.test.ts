import { describe, expect, it } from "bun:test"
import {
  type BadgeSize,
  type BadgeTone,
  getBadgeSizeClass,
  getBadgeToneClass,
} from "./badge-utils"

const toneTokens: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100",
  info: "bg-blue-100",
  success: "bg-green-100",
  danger: "bg-red-100",
  warning: "bg-amber-100",
}

const toneDarkTokens: Record<BadgeTone, string> = {
  neutral: "dark:bg-zinc-800",
  info: "dark:bg-blue-900/30",
  success: "dark:bg-green-900/30",
  danger: "dark:bg-red-900/30",
  warning: "dark:bg-amber-900/30",
}

describe("getBadgeToneClass", () => {
  for (const tone of Object.keys(toneTokens) as BadgeTone[]) {
    it(`maps ${tone} to expected light + dark tokens`, () => {
      const cls = getBadgeToneClass(tone)
      expect(cls).toContain(toneTokens[tone])
      expect(cls).toContain(toneDarkTokens[tone])
    })
  }
})

describe("getBadgeSizeClass", () => {
  const sizes: Array<{ size: BadgeSize; padding: string }> = [
    { size: "sm", padding: "px-1.5 py-0.5" },
    { size: "md", padding: "px-2.5 py-0.5" },
  ]
  for (const { size, padding } of sizes) {
    it(`maps ${size} to ${padding}`, () => {
      const cls = getBadgeSizeClass(size)
      expect(cls).toContain(padding)
      expect(cls).toContain("text-xs")
    })
  }
})
