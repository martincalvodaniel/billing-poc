import { describe, expect, it } from "bun:test"
import {
  getIconButtonClass,
  type IconButtonSize,
  type IconButtonVariant,
} from "./iconButton-utils"

const variants: IconButtonVariant[] = ["danger", "neutral", "success"]
const sizes: IconButtonSize[] = ["sm", "md"]

const variantToken: Record<IconButtonVariant, string> = {
  danger: "text-red-600",
  neutral: "text-zinc-700",
  success: "text-emerald-600",
}

const sizeToken: Record<IconButtonSize, string> = {
  sm: "p-1.5",
  md: "p-2",
}

describe("getIconButtonClass", () => {
  for (const variant of variants) {
    for (const size of sizes) {
      it(`returns ${variant} + ${size} tokens`, () => {
        const cls = getIconButtonClass(variant, size)
        expect(cls).toContain(variantToken[variant])
        expect(cls).toContain(sizeToken[size])
        expect(cls).toContain("rounded-md")
        expect(cls).toContain("focus-visible:ring-2")
      })
    }
  }

  it("danger variant includes red ring", () => {
    expect(getIconButtonClass("danger", "sm")).toContain(
      "focus-visible:ring-red-500"
    )
  })

  it("success variant includes emerald ring", () => {
    expect(getIconButtonClass("success", "md")).toContain(
      "focus-visible:ring-emerald-500"
    )
  })

  it("neutral variant includes zinc ring", () => {
    expect(getIconButtonClass("neutral", "sm")).toContain(
      "focus-visible:ring-zinc-500"
    )
  })
})
