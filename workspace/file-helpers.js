import { markdownParser, markdownSerializer } from 'editor/index';
import { IndexDBIO } from './indexdb';
import { NativeFileOps } from './nativefs-helpers';
import { resolvePath, validatePath, validateWsFilePath } from './path-helpers';
import { getWorkspaceInfo } from './workspace-helpers';

const nativeFS = new NativeFileOps({
  allowedFile: (fileHandle) => fileHandle.name.endsWith('.md'),
});

const toNativePath = (rootDirHandle, filePath) => [
  rootDirHandle.name,
  ...filePath.split('/'),
];

// TODO make this get file
export async function getDoc(wsPath) {
  const { wsName, filePath } = resolvePath(wsPath);
  const ws = await getWorkspaceInfo(wsName);

  let file;

  switch (ws.type) {
    case 'browser': {
      file = (await IndexDBIO.getFile(wsPath)).doc;
      break;
    }

    case 'nativefs': {
      const { rootDirHandle } = ws.metadata;
      const path = toNativePath(rootDirHandle, filePath);
      const fileData = await nativeFS.readFile(path, rootDirHandle);
      if (fileData.file.type === 'application/json') {
        file = JSON.parse(fileData.textContent);
      } else if (fileData.file.name.endsWith('.md')) {
        // TODO avoid doing toJSON
        file = markdownParser(fileData.textContent).toJSON();
      }
      break;
    }

    default: {
      throw new Error('Unknown workspace type ' + ws.type);
    }
  }

  if (file === undefined) {
    throw new Error(`File ${wsPath} not found`);
  }

  return file;
}

/**
 *
 * @param {string} wsPath
 * @param {PMNode} doc
 */
export async function saveDoc(wsPath, doc) {
  const { wsName, filePath } = resolvePath(wsPath);
  const ws = await getWorkspaceInfo(wsName);
  let file;

  switch (ws.type) {
    case 'browser': {
      file = await IndexDBIO.getFile(wsPath);
      if (!file) {
        throw new Error(`File ${wsPath} not found`);
      }
      file = await IndexDBIO.updateFile(wsPath, {
        ...file,
        doc: doc.toJSON(),
      });
      break;
    }

    case 'nativefs': {
      const { rootDirHandle } = ws.metadata;
      const path = toNativePath(rootDirHandle, filePath);
      let data;
      if (filePath.endsWith('.md')) {
        data = markdownSerializer(doc);
      } else if (filePath.endsWith('.json')) {
        data = JSON.stringify(doc.toJSON());
      } else {
        throw new Error('Unknown file extension ' + filePath);
      }

      file = await nativeFS.saveFile(path, rootDirHandle, data);

      break;
    }

    default: {
      throw new Error('Unknown workspace type ' + ws.type);
    }
  }
}

export async function createFile(wsPath, doc) {
  validateWsFilePath(wsPath);
  const { wsName, filePath } = resolvePath(wsPath);
  const workspace = await getWorkspaceInfo(wsName);

  switch (workspace.type) {
    case 'browser': {
      await IndexDBIO.createFile(wsPath, {
        doc: doc.toJSON(),
      });
      break;
    }

    case 'nativefs': {
      const { rootDirHandle } = workspace.metadata;
      const path = toNativePath(rootDirHandle, filePath);
      await nativeFS.saveFile(path, rootDirHandle, markdownSerializer(doc));

      break;
    }

    default: {
      throw new Error('Unknown workspace type ' + workspace.type);
    }
  }
}

export async function deleteFile(wsPath) {
  validatePath(wsPath);
  const { wsName, filePath } = resolvePath(wsPath);
  const workspace = await getWorkspaceInfo(wsName);
  switch (workspace.type) {
    case 'browser': {
      await IndexDBIO.deleteFile(wsPath);
      break;
    }

    case 'nativefs': {
      const { rootDirHandle } = workspace.metadata;

      await nativeFS.deleteFile(
        toNativePath(rootDirHandle, filePath),
        rootDirHandle,
        true,
      );
      break;
    }

    default: {
      throw new Error('Unknown workspace type ' + workspace.type);
    }
  }
}

export async function listAllFiles(wsName) {
  const ws = await getWorkspaceInfo(wsName);

  let files = [];

  switch (ws.type) {
    case 'browser': {
      files = await IndexDBIO.listFiles(wsName);
      break;
    }

    case 'nativefs': {
      const { rootDirHandle } = ws.metadata;

      const rawPaths = await nativeFS.listFiles(rootDirHandle);
      files = rawPaths.map((fileHandlers) => {
        return (
          wsName +
          ':' +
          fileHandlers
            .slice(1)
            .map((f) => f.name)
            .join('/')
        );
      });
      break;
    }

    default: {
      throw new Error('Unknown workspace type ' + ws.type);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

export async function renameFile(wsPath, newWsPath) {
  validatePath(wsPath);
  validatePath(newWsPath);
  const { wsName, filePath } = resolvePath(wsPath);
  const { wsName: newWsName, filePath: newFilePath } = resolvePath(newWsPath);

  if (wsName !== newWsName) {
    throw new Error('Workspace name must be the same');
  }

  const workspace = await getWorkspaceInfo(wsName);

  switch (workspace.type) {
    case 'browser': {
      await IndexDBIO.renameFile(wsPath, newWsPath);
      break;
    }

    case 'nativefs': {
      const { rootDirHandle } = workspace.metadata;

      await nativeFS.renameFile(
        toNativePath(rootDirHandle, filePath),
        toNativePath(rootDirHandle, newFilePath),
        rootDirHandle,
      );
      break;
    }

    default: {
      throw new Error('Unknown workspace type ' + workspace.type);
    }
  }
}