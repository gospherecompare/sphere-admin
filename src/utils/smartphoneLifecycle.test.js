import test from "node:test";
import assert from "node:assert/strict";

import {
  getSmartphoneLifecycle,
  getSmartphoneRenderState,
  normalizeLifecycleStatus,
} from "./smartphoneLifecycle.js";
import { buildMobileSubmitPayload } from "./mobileEditorLogic.js";

test("released product with live sale and store should render as available", () => {
  const result = getSmartphoneRenderState({
    launchStage: "released",
    saleStage: "on_sale",
    storeStage: "live",
  });

  assert.equal(result.renderType, "available");
  assert.equal(result.displayStatus, "Available now");
});

test("lifecycle normalization matches the canonical launch states", () => {
  assert.equal(normalizeLifecycleStatus("Available"), "available");
  assert.equal(normalizeLifecycleStatus("Upcoming"), "upcoming");
  assert.equal(normalizeLifecycleStatus("Announced"), "announced");
  assert.equal(normalizeLifecycleStatus("Released"), "released");
});

test("editorial status stays upcoming regardless of launch date", () => {
  for (const launchDate of ["2026-09-02", "2026-09-01", "2026-09-03"]) {
    const result = getSmartphoneLifecycle({
      launchDate,
      launchStatus: "upcoming",
    });

    assert.equal(result.launchStage, "upcoming");
  }
});

test("explicit released status is the only launch transition", () => {
  const result = getSmartphoneLifecycle({
    launchDate: "2026-09-01",
    launchStatus: "released",
  });

  assert.equal(result.launchStage, "released");
});

test("missing launch status defaults to upcoming", () => {
  const result = getSmartphoneLifecycle({
    launchDate: "2026-09-01",
  });

  assert.equal(result.launchStage, "upcoming");
});

test("create and edit payloads use the same editorial status field", () => {
  const createPayload = buildMobileSubmitPayload({
    formData: {
      product: { name: "Test Phone", brand_id: "1" },
      smartphone: {
        model: "Test Phone",
        launch_date: "2026-09-02",
        launch_status_override: "upcoming",
      },
      variants: [],
      images: [],
    },
    mode: "create",
  });
  const editPayload = buildMobileSubmitPayload({
    formData: {
      name: "Test Phone",
      brand_id: "1",
      model: "Test Phone",
      launch_date: "2026-09-02",
      launch_status_override: "upcoming",
      variants: [],
      images: [],
    },
    mode: "edit",
    id: 1,
  });

  assert.equal(createPayload.launch_status_override, "upcoming");
  assert.equal(editPayload.launch_status_override, "upcoming");
  assert.equal(createPayload.smartphone.launch_status_override, "upcoming");
  assert.equal(editPayload.smartphone.launch_status_override, "upcoming");
});
