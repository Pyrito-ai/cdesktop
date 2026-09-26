import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSessionPickerSelection } from './sessionPickerSelection.ts';
import type { ExecutorConfig } from 'shared/types';

const receipt = {
  executor: 'CODEX',
  variant: 'WORKBENCH',
  model_id: 'gpt-5.6-sol',
  permission_policy: 'SUPERVISED',
} as ExecutorConfig;
const preset = {
  executor: 'CODEX',
  variant: null,
  model_id: 'gpt-5.5',
  reasoning_id: 'medium',
} as ExecutorConfig;

test('external launch restores its explicit model and named-preset effort', () => {
  assert.deepEqual(resolveSessionPickerSelection(receipt, preset), {
    selectedProviderId: null,
    selectedModelId: 'gpt-5.6-sol',
    selectedReasoningId: 'medium',
    preferredEffortId: 'medium',
  });
});

test('explicit receipt reasoning takes precedence over changed preset defaults', () => {
  const selection = resolveSessionPickerSelection(
    { ...receipt, reasoning_id: 'high' },
    preset
  );
  assert.equal(selection.selectedReasoningId, 'high');
  assert.equal(selection.preferredEffortId, 'high');
});

test('historical model IDs need not exist in the current discovery catalog', () => {
  assert.equal(
    resolveSessionPickerSelection(
      { ...receipt, model_id: 'custom-future-model' },
      preset
    ).selectedModelId,
    'custom-future-model'
  );
});

test('ambient sessions retain the agent-default sentinel without forced reasoning', () => {
  const selection = resolveSessionPickerSelection(
    { executor: receipt.executor },
    null
  );
  assert.equal(selection.selectedModelId, '');
  assert.equal(selection.selectedReasoningId, null);
  assert.equal(selection.selectedProviderId, null);
});

test('a different executor preset cannot supply model or effort', () => {
  const selection = resolveSessionPickerSelection(receipt, {
    ...preset,
    executor: 'CLAUDE_CODE' as ExecutorConfig['executor'],
    reasoning_id: 'xhigh',
  });
  assert.equal(selection.selectedModelId, 'gpt-5.6-sol');
  assert.equal(selection.selectedReasoningId, null);
});

test('restoration leaves explicit executor, variant, and permissions intact', () => {
  const original = structuredClone(receipt);
  resolveSessionPickerSelection(receipt, preset);
  assert.deepEqual(receipt, original);
  assert.equal(receipt.variant, 'WORKBENCH');
  assert.equal(receipt.permission_policy, 'SUPERVISED');
});
