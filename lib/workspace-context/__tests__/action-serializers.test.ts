import { OpenedWsPaths } from '@bangle.io/ws-path';

import { WorkspaceSliceAction } from '../common';
import { createStore } from './test-utils';

const testFixtures: Array<WorkspaceSliceAction> = [
  {
    name: 'action::workspace-context:set-pending-refresh-ws-paths',
    value: {
      pendingRefreshWsPaths: 'test-ws',
    },
  },
  {
    name: 'action::workspace-context:set-pending-refresh-ws-paths',
    value: {
      pendingRefreshWsPaths: undefined,
    },
  },

  {
    name: 'action::workspace-context:update-location',
    value: {
      openedWsPaths: OpenedWsPaths.createFromArray(['test-ws:one.md']),
      wsName: 'test-ws',
    },
  },

  {
    name: 'action::workspace-context:update-location',
    value: {
      openedWsPaths: OpenedWsPaths.createEmpty(),
      wsName: 'test-ws',
    },
  },

  {
    name: 'action::workspace-context:update-location',
    value: {
      openedWsPaths: OpenedWsPaths.createEmpty(),
      wsName: undefined,
    },
  },

  {
    name: 'action::workspace-context:update-recently-used-ws-paths',
    value: {
      recentlyUsedWsPaths: [],
      wsName: 'test-ws',
    },
  },

  {
    name: 'action::workspace-context:update-recently-used-ws-paths',
    value: {
      recentlyUsedWsPaths: ['test-ws:one.md'],
      wsName: 'test-ws',
    },
  },

  {
    name: 'action::workspace-context:update-ws-paths',
    value: {
      wsName: 'test-ws',
      wsPaths: ['test-ws:one.md'],
    },
  },

  {
    name: 'action::workspace-context:update-ws-paths',
    value: {
      wsName: 'test-ws',
      wsPaths: undefined,
    },
  },
];

const { store } = createStore();

test.each(testFixtures)(`%# workspace actions serialization`, (action) => {
  const res = store.parseAction(store.serializeAction(action) as any);

  expect(res).toEqual({ ...action, fromStore: 'workspace-store' });
});
