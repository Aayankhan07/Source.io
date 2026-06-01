import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseScript } from "./script.ts";

Deno.test("parseScript parses alternating two-host script", () => {
  const result = parseScript(`Host 1: Welcome back to critical thinking.
Host 2: Today we are unpacking assumptions.
Host 1: Explicit assumptions are stated directly.
Host 2: Implicit assumptions are hidden but still shape the argument.`);

  assertEquals(result, [
    { speaker: "host_1", text: "Welcome back to critical thinking." },
    { speaker: "host_2", text: "Today we are unpacking assumptions." },
    { speaker: "host_1", text: "Explicit assumptions are stated directly." },
    { speaker: "host_2", text: "Implicit assumptions are hidden but still shape the argument." },
  ]);
});

Deno.test("parseScript appends continuation lines to prior speaker", () => {
  const result = parseScript(`Host 1: First point.
This continues the first host.
Host 2: Response line.`);

  assertEquals(result, [
    { speaker: "host_1", text: "First point. This continues the first host." },
    { speaker: "host_2", text: "Response line." },
  ]);
});

Deno.test("parseScript rejects scripts without both hosts", () => {
  assertThrows(() => parseScript(`Host 1: Solo line only.`), Error, "INVALID_SCRIPT_FORMAT");
});