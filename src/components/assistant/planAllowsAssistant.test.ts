import { describe, expect, it } from "vitest";

import { planAllowsAssistant } from "./AiAssistantWidget";

describe("planAllowsAssistant", () => {
  it.each([["basic", true], ["premium", true], ["free", false], [null, false], [undefined, false]])(
    "%s -> %s",
    (plan, expected) => expect(planAllowsAssistant(plan as string | null | undefined)).toBe(expected),
  );
});
