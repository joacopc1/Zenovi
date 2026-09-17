import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFollowerDemographics,
  countryFlag,
  demographicMetricKey,
} from "../lib/data/follower-demographics.ts";

test("la clave guarda dimensión y valor dentro de la métrica", () => {
  assert.equal(demographicMetricKey("country", "MX"), "follower_demographics.country.MX");
});

test("reparte cada dimensión y calcula su porción", () => {
  const demographics = buildFollowerDemographics([
    { metric: "follower_demographics.gender.M", value: 3 },
    { metric: "follower_demographics.gender.F", value: 1 },
  ]);

  assert.deepEqual(
    demographics.gender.map(({ label, value, share }) => [label, value, share]),
    [["Hombres", 3, 0.75], ["Mujeres", 1, 0.25]],
  );
});

test("la edad se ordena por tramo y no por tamaño", () => {
  const demographics = buildFollowerDemographics([
    { metric: "follower_demographics.age.25-34", value: 10 },
    { metric: "follower_demographics.age.13-17", value: 40 },
    { metric: "follower_demographics.age.18-24", value: 20 },
  ]);

  assert.deepEqual(demographics.age.map(({ key }) => key), ["13-17", "18-24", "25-34"]);
});

test("el país se muestra con su nombre y la ciudad tal como viene", () => {
  const demographics = buildFollowerDemographics([
    { metric: "follower_demographics.country.MX", value: 5 },
    { metric: "follower_demographics.city.Mexico City, Distrito Federal", value: 2 },
  ]);

  assert.equal(demographics.country[0].label, "México");
  assert.equal(demographics.city[0].label, "Mexico City");
});

test("descarta métricas ajenas, dimensiones desconocidas y valores vacíos", () => {
  assert.equal(buildFollowerDemographics([{ metric: "reach", value: 9 }]), null);
  assert.equal(buildFollowerDemographics([{ metric: "follower_demographics.planeta.Marte", value: 9 }]), null);
  assert.equal(buildFollowerDemographics([{ metric: "follower_demographics.age.18-24", value: 0 }]), null);
  assert.equal(buildFollowerDemographics([]), null);
});

test("la bandera sale del código ISO de dos letras", () => {
  assert.equal(countryFlag("MX"), "🇲🇽");
  assert.equal(countryFlag("ar"), "🇦🇷");
});

test("sin código válido no se dibuja una bandera rota", () => {
  assert.equal(countryFlag("Mexico City"), null);
  assert.equal(countryFlag("M"), null);
  assert.equal(countryFlag(""), null);
});

test("una ciudad sin región se muestra sola", () => {
  const demographics = buildFollowerDemographics([
    { metric: "follower_demographics.city.Montevideo", value: 4 },
  ]);

  assert.equal(demographics.city[0].label, "Montevideo");
});
