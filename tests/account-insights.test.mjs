import assert from "node:assert/strict";
import test from "node:test";
import {
  averageByWeekday,
  averagePerReportedDay,
  countPublished,
  engagementComposition,
  followerChange,
  ratio,
  readEngagement,
  strongestWeekday,
} from "../lib/analytics/account-insights.ts";

function day(date, values = {}) {
  return {
    date, label: date, views: null, reach: null, interactions: null, likes: null,
    comments: null, shares: null, saves: null, profileViews: null, linkTaps: null,
    followers: null, ...values,
  };
}

test("una tasa sin base no existe", () => {
  assert.equal(ratio(5, 100), 0.05);
  assert.equal(ratio(5, 0), null);
  assert.equal(ratio(null, 100), null);
});

test("reparte las interacciones en orden fijo", () => {
  const slices = engagementComposition({ likes: 30, comments: 10, saves: 40, shares: 20 });

  assert.deepEqual(slices.map(({ part }) => part), ["likes", "comments", "saves", "shares"]);
  assert.equal(slices[2].share, 0.4);
  assert.equal(engagementComposition({ likes: 0, comments: 0, saves: null, shares: 0 }), null);
});

test("no hace lecturas con poco volumen", () => {
  assert.equal(readEngagement(engagementComposition({ likes: 1, comments: 0, saves: 2, shares: 0 })), null);
});

test("detecta contenido que se guarda y se comparte", () => {
  const reading = readEngagement(engagementComposition({ likes: 30, comments: 10, saves: 40, shares: 20 }));
  assert.match(reading, /guardados y compartidos/);
});

test("promedia por día de la semana usando el día calendario", () => {
  // 2026-09-07 es lunes.
  const averages = averageByWeekday(
    [day("2026-09-07", { interactions: 10 }), day("2026-09-14", { interactions: 20 }), day("2026-09-08", { interactions: 4 })],
    "interactions",
  );

  assert.deepEqual(averages[0], { weekday: "Lun", days: 2, average: 15 });
  assert.equal(averages[1].average, 4);
  assert.equal(averages[2].average, null);
});

test("sólo señala un mejor día con al menos dos semanas de base", () => {
  const oneWeek = averageByWeekday(
    ["2026-09-07", "2026-09-08", "2026-09-09", "2026-09-10", "2026-09-11", "2026-09-12", "2026-09-13"]
      .map((date, index) => day(date, { interactions: index + 1 })),
    "interactions",
  );
  assert.equal(strongestWeekday(oneWeek), null);

  const twoWeeks = averageByWeekday(
    Array.from({ length: 14 }, (_, index) =>
      day(new Date(Date.UTC(2026, 8, 7 + index)).toISOString().slice(0, 10), { interactions: index % 7 === 2 ? 50 : 5 }),
    ),
    "interactions",
  );
  assert.equal(strongestWeekday(twoWeeks).weekday, "Mié");
});

test("promedia el alcance sólo sobre días informados", () => {
  assert.equal(averagePerReportedDay([day("a", { reach: 10 }), day("b"), day("c", { reach: 20 })], "reach"), 15);
  assert.equal(averagePerReportedDay([day("a")], "reach"), null);
});

test("el cambio de seguidores necesita dos fotos", () => {
  assert.equal(followerChange([day("2026-09-12", { followers: 3 })]), null);
  assert.deepEqual(
    followerChange([day("2026-09-12", { followers: 3 }), day("2026-09-13"), day("2026-09-14", { followers: 5 })]),
    { change: 2, from: "2026-09-12", to: "2026-09-14", snapshots: 2, days: 2, perDay: 1 },
  );
});

test("cuenta publicaciones dentro del período, inclusive", () => {
  const posted = ["2026-09-01T10:00:00+0000", "2026-09-10T23:00:00+0000", "2026-09-11T01:00:00+0000"];
  assert.equal(countPublished(posted, "2026-09-01", "2026-09-10"), 2);
});

test("el promedio de seguidores usa los días transcurridos, no la cantidad de fotos", () => {
  // Dos fotos separadas por cuatro días: +8 son +2 por día, no +4.
  const change = followerChange([day("2026-09-10", { followers: 10 }), day("2026-09-14", { followers: 18 })]);
  assert.equal(change.perDay, 2);
});
