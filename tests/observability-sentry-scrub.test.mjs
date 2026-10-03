import assert from "node:assert/strict";
import test from "node:test";
import { scrubEvent } from "../lib/observability/sentry-options.ts";

test("a Sentry no le llega nada de la persona: ni mail, ni IP, ni cookies, ni lo que escribió", () => {
  const event = scrubEvent({
    user: { id: "persona-1", email: "joaco@zenovi.app", ip_address: "1.2.3.4" },
    request: {
      url: "https://app.zenovi.app/api/director/chat",
      data: '{"message":"mi guion secreto"}',
      cookies: { "sb-token": "x" },
      headers: { Cookie: "sb=1", Authorization: "Bearer y", "X-Forwarded-For": "1.2.3.4", "User-Agent": "Chrome" },
    },
  });
  assert.deepEqual(event.user, { id: "persona-1" });
  assert.equal(event.request.data, undefined);
  assert.equal(event.request.cookies, undefined);
  assert.deepEqual(event.request.headers, { "User-Agent": "Chrome" });
  assert.equal(event.request.url, "https://app.zenovi.app/api/director/chat");
});

test("sin id, la persona no se manda", () => {
  assert.equal(scrubEvent({ user: { email: "a@b.c" } }).user, undefined);
});
