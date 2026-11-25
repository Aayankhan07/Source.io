import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildAudioPath, isAudioExtension, isOwnedAudioPath } from "./storage.ts";

const USER = "11111111-1111-1111-1111-111111111111";
const DOC = "22222222-2222-2222-2222-222222222222";

Deno.test("buildAudioPath nests audio under user and document", () => {
  assertEquals(buildAudioPath(USER, DOC, "ogg", 1764150000000), `${USER}/${DOC}/1764150000000.ogg`);
});

Deno.test("isOwnedAudioPath accepts only the caller's document folder", () => {
  assertEquals(isOwnedAudioPath(`${USER}/${DOC}/1764150000000.wav`, USER, DOC), true);
  assertEquals(isOwnedAudioPath(`${DOC}/${USER}/1764150000000.wav`, USER, DOC), false);
  assertEquals(isOwnedAudioPath(`${USER}/${DOC}/../x/1764150000000.wav`, USER, DOC), false);
  assertEquals(isOwnedAudioPath(`${USER}/${DOC}/1764150000000.mp3`, USER, DOC), false);
  assertEquals(isOwnedAudioPath(`${USER}/${DOC}/evil.ogg`, USER, DOC), false);
  assertEquals(isOwnedAudioPath(42, USER, DOC), false);
});

Deno.test("isAudioExtension allows only uploadable containers", () => {
  assertEquals(isAudioExtension("ogg"), true);
  assertEquals(isAudioExtension("wav"), true);
  assertEquals(isAudioExtension("exe"), false);
  assertEquals(isAudioExtension("toString"), false);
});
