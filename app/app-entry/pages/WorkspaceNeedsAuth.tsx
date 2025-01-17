import React, { useEffect, useState } from 'react';

import { useBangleStoreContext } from '@bangle.io/app-state-context';
import { requestNativeBrowserFSPermission } from '@bangle.io/baby-fs';
import { ActionButton, ButtonContent } from '@bangle.io/ui-bangle-button';
import { CenteredBoxedPage } from '@bangle.io/ui-components';
import { useUIManagerContext } from '@bangle.io/ui-context';
import { keybindingsHelper } from '@bangle.io/utils';
import {
  goToWorkspaceHomeRoute,
  goToWsNameRoute,
  goToWsNameRouteNotFoundRoute,
} from '@bangle.io/workspace-context';
import {
  getWorkspaceInfo,
  WORKSPACE_NOT_FOUND_ERROR,
  WorkspaceError,
  WorkspaceInfo,
} from '@bangle.io/workspaces';

export function WorkspaceNativefsAuthBlockade({ wsName }: { wsName: string }) {
  wsName = decodeURIComponent(wsName || '');

  const [permissionDenied, updatePermissionDenied] = useState(false);
  const store = useBangleStoreContext();
  const [wsInfo, updateWsInfo] = useState<WorkspaceInfo>();

  useEffect(() => {
    let destroyed = false;
    getWorkspaceInfo(wsName).then(
      (wsInfo) => {
        if (destroyed) {
          return;
        }
        updateWsInfo(wsInfo);
      },
      (error) => {
        if (destroyed) {
          return;
        }
        if (
          error instanceof WorkspaceError &&
          error.code === WORKSPACE_NOT_FOUND_ERROR
        ) {
          goToWsNameRouteNotFoundRoute(wsName)(store.state);
        }
        throw error;
      },
    );

    return () => {
      destroyed = true;
    };
  }, [wsName, store]);

  const onGranted = () => {
    goToWsNameRoute(wsName, { replace: true })(store.state, store.dispatch);
  };

  const requestFSPermission = async () => {
    if (!wsInfo) {
      throw new Error('workspace not found');
    }
    if (wsInfo.type !== 'nativefs') {
      onGranted();
      return true;
    }
    const result = await requestNativeBrowserFSPermission(
      wsInfo.metadata.rootDirHandle,
    );
    if (result) {
      onGranted();
      return true;
    } else {
      updatePermissionDenied(true);
      return false;
    }
  };

  useEffect(() => {
    if (!wsName) {
      goToWorkspaceHomeRoute()(store.state, store.dispatch);
    }
  }, [store, wsName]);

  if (!wsName || !wsInfo) {
    return null;
  }

  return (
    <PermissionModal
      permissionDenied={permissionDenied}
      requestFSPermission={requestFSPermission}
      wsName={wsName}
    />
  );
}

function PermissionModal({ permissionDenied, requestFSPermission, wsName }) {
  const { paletteType, modal } = useUIManagerContext();
  const isPaletteActive = Boolean(paletteType);
  useEffect(() => {
    let callback = keybindingsHelper({
      Enter: () => {
        if (isPaletteActive || modal) {
          return false;
        }
        requestFSPermission();
        return true;
      },
    });
    document.addEventListener('keydown', callback);
    return () => {
      document.removeEventListener('keydown', callback);
    };
  }, [requestFSPermission, isPaletteActive, modal]);

  return (
    <CenteredBoxedPage
      title={
        <span className="font-normal">
          <WorkspaceSpan
            wsName={wsName}
            emoji={permissionDenied ? '❌' : '📖'}
          />
          <span className="pl-1">
            {permissionDenied ? 'permission denied' : 'requires permission'}
          </span>
        </span>
      }
      actions={
        <ActionButton
          ariaLabel="grant disk read permission"
          onPress={() => {
            requestFSPermission();
          }}
        >
          <ButtonContent
            text={
              <>
                <span>Grant permission {'[Enter]'}</span>
              </>
            }
          />
        </ActionButton>
      }
    >
      <span>
        Bangle.io needs permission to access your locally saved notes.
      </span>
    </CenteredBoxedPage>
  );
}

export function WorkspaceSpan({
  wsName,
  emoji = '📖',
}: {
  wsName: string;
  emoji?: string;
}) {
  return (
    <>
      <span className="font-normal">
        {emoji} Workspace <span className="font-bold">{wsName}</span>
      </span>
    </>
  );
}
