import {
  isValidNoteWsPath,
  OpenedWsPaths,
  pathnameToWsPath,
  searchToWsPath,
} from '@bangle.io/ws-path';

export function validateOpenedWsPaths(openedWsPath: OpenedWsPaths):
  | {
      valid: true;
    }
  | {
      invalidWsPath: string;
      valid: false;
    } {
  let invalidWsPath: string | undefined = undefined;

  openedWsPath.forEachWsPath((path) => {
    if (invalidWsPath || path == null) {
      return;
    }

    if (!isValidNoteWsPath(path)) {
      invalidWsPath = path;
    }
  });

  if (invalidWsPath) {
    return { valid: false, invalidWsPath: invalidWsPath };
  }

  return {
    valid: true,
  };
}

export const findInvalidLocation = (
  locationPathname?: string,
  locationSearchQuery?: string,
) => {
  // primary
  if (locationPathname && locationPathname.length > 0) {
    const primaryWsPath = pathnameToWsPath(locationPathname);
    if (primaryWsPath && !isValidNoteWsPath(primaryWsPath)) {
      return primaryWsPath;
    }
  }

  // secondary
  if (locationSearchQuery) {
    const secondaryWsPath = searchToWsPath(locationSearchQuery);
    if (secondaryWsPath && !isValidNoteWsPath(secondaryWsPath)) {
      return secondaryWsPath;
    }

    // since there can be other things in the search query we can not
    // mark the whole thing as invalid
  }

  return undefined;
};

export function getPrevOpenedWsPathsFromSearch(
  search?: string,
): OpenedWsPaths | undefined {
  let searchParams = new URLSearchParams(search);
  let prev = searchParams.get('ws_paths');
  if (prev) {
    try {
      let openedWsPaths = OpenedWsPaths.createFromArray(JSON.parse(prev));
      return openedWsPaths;
    } catch (err) {
      return undefined;
    }
  }

  return undefined;
}

export function savePrevOpenedWsPathsToSearch(
  openedWsPaths: OpenedWsPaths,
  searchParams: URLSearchParams,
) {
  if (openedWsPaths.hasSomeOpenedWsPaths()) {
    searchParams.append('ws_paths', JSON.stringify(openedWsPaths.toArray()));
  }
}
