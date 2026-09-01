import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getSmartphoneRenderState,
  normalizeLifecycleStatus,
} from './smartphoneLifecycle.js';

test('released product with live sale and store should render as available', () => {
  const result = getSmartphoneRenderState({
    launchStage: 'released',
    saleStage: 'on_sale',
    storeStage: 'live',
  });

  assert.equal(result.renderType, 'available');
  assert.equal(result.displayStatus, 'Available now');
});

test('lifecycle normalization matches the canonical launch states', () => {
  assert.equal(normalizeLifecycleStatus('Available'), 'available');
  assert.equal(normalizeLifecycleStatus('Upcoming'), 'upcoming');
  assert.equal(normalizeLifecycleStatus('Announced'), 'announced');
  assert.equal(normalizeLifecycleStatus('Released'), 'released');
});
