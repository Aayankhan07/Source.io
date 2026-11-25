import { describe, it, expect, vi, beforeEach } from "vitest";

const selects: string[] = [];
let responses: { data: unknown; error: unknown }[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: (cols: string) => {
        selects.push(cols);
        const chain = {
          eq: () => chain,
          order: () => chain,
          limit: () => Promise.resolve(responses.shift()),
        };
        return chain;
      },
    }),
  },
}));

import { loadChatHistory } from "./useChatHistory";
import { aggregateLeitnerBoxes } from "@/features/dashboard/hooks/useLeitnerBoxes";

describe("loadChatHistory", () => {
  beforeEach(() => {
    selects.length = 0;
    responses = [];
  });

  it("returns messages oldest-first with parsed citations", async () => {
    responses = [
      {
        data: [
          {
            id: "m2",
            role: "assistant",
            content: "Answer [1]",
            created_at: "2026-11-26T10:01:00Z",
            citations: [{ n: 1, order_index: 3, similarity: 0.9, text: "passage" }],
          },
          { id: "m1", role: "user", content: "Question", created_at: "2026-11-26T10:00:00Z", citations: null },
          { id: "s", role: "system", content: "hidden", created_at: "2026-11-26T09:00:00Z" },
        ],
        error: null,
      },
    ];
    const out = await loadChatHistory("doc");
    expect(out.map((m) => m.id)).toEqual(["m1", "m2"]);
    expect(out[1].citations).toEqual([{ n: 1, order_index: 3, similarity: 0.9, text: "passage" }]);
    expect(out[0].citations).toBeUndefined();
  });

  it("retries without citations when the column does not exist (42703)", async () => {
    responses = [
      { data: null, error: { code: "42703", message: "column chat_messages.citations does not exist" } },
      { data: [{ id: "m1", role: "user", content: "Q", created_at: "2026-11-26T10:00:00Z" }], error: null },
    ];
    const out = await loadChatHistory("doc");
    expect(selects).toHaveLength(2);
    expect(selects[0]).toContain("citations");
    expect(selects[1]).not.toContain("citations");
    expect(out).toHaveLength(1);
  });

  it("throws other errors", async () => {
    responses = [{ data: null, error: { code: "42501", message: "denied" } }];
    await expect(loadChatHistory("doc")).rejects.toMatchObject({ code: "42501" });
  });
});

describe("aggregateLeitnerBoxes", () => {
  it("counts reviews per box with the 1/2/4/7/14 day intervals", () => {
    const boxes = aggregateLeitnerBoxes([{ box: 1 }, { box: 1 }, { box: 3 }, { box: 5 }, { box: 9 }]);
    expect(boxes.map((b) => b.count)).toEqual([2, 0, 1, 0, 2]);
    expect(boxes.map((b) => b.interval)).toEqual(["1d", "2d", "4d", "7d", "14d"]);
  });
});
