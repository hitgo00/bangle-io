import React from 'react';

import type { RawSpecs } from '@bangle.dev/core';
import { SpecRegistry } from '@bangle.dev/core';
import type { RenderNodeViewsFunction as BangleRenderNodeViewsFunction } from '@bangle.dev/react';

import { Slice } from '@bangle.io/create-store';
import type {
  EditorWatchPluginState,
  SerialOperationDefinitionType,
  SerialOperationHandler,
  SerialOperationKeybindingMapping,
  SerialOperationNameType,
} from '@bangle.io/shared-types';

import { ApplicationConfig, EditorConfig, Extension } from './Extension';

function filterFlatMap<K>(
  array: any[],
  field: string,
  flatten = true,
): Array<K> {
  let items = array.filter((item) => Boolean(item[field]));
  if (flatten) {
    return items.flatMap((item) => item[field]);
  }

  return items.map((item) => item[field]);
}

export class ExtensionRegistry {
  specRegistry: SpecRegistry;
  // TODO move this to a method
  markdownItPlugins: any[];
  private renderReactNodeViewLookup: Exclude<
    EditorConfig['renderReactNodeView'],
    undefined
  >;
  private serialOperationHandlers: Set<SerialOperationHandler>;
  private registeredSerialOperations: SerialOperationDefinitionType[];
  private editorConfig: EditorConfig[];
  private operationKeybindingMapping: SerialOperationKeybindingMapping;
  private sidebars: Exclude<ApplicationConfig['sidebars'], undefined>;
  private slices: Slice<any, any>[];

  private editorWatchPluginStates: Exclude<
    EditorConfig['watchPluginStates'],
    undefined
  >;

  private noteSidebarWidgets: Exclude<
    ApplicationConfig['noteSidebarWidgets'],
    undefined
  >;

  public extensionsInitialState: { [name: string]: any };
  constructor(
    private extensions: Extension[] = [],
    // TODO move this to an extension
    _markdownItPlugins: any[] = [],
  ) {
    this.validate();

    this.extensionsInitialState = Object.fromEntries(
      extensions.map((r) => [r.name, r.initialState]),
    );

    this.editorConfig = extensions.map((e) => e.editor);
    this.specRegistry = new SpecRegistry([
      ...filterFlatMap<RawSpecs>(this.editorConfig, 'specs'),
    ]);
    this.markdownItPlugins = [
      ..._markdownItPlugins,
      ...filterFlatMap(this.editorConfig, 'markdownItPlugins'),
    ];
    this.renderReactNodeViewLookup = Object.fromEntries(
      filterFlatMap<any>(
        this.editorConfig,
        'renderReactNodeView',
        false,
      ).flatMap((obj) => Object.entries(obj)),
    );

    const applicationConfig = extensions.map((e) => e.application);

    this.serialOperationHandlers = new Set();
    this.editorWatchPluginStates = filterFlatMap(
      this.editorConfig,
      'watchPluginStates',
    );
    this.registeredSerialOperations = filterFlatMap(
      applicationConfig,
      'operations',
    );
    this.sidebars = filterFlatMap(applicationConfig, 'sidebars');
    this.noteSidebarWidgets = filterFlatMap(
      applicationConfig,
      'noteSidebarWidgets',
    );

    this.slices = filterFlatMap(applicationConfig, 'slices');

    this.operationKeybindingMapping =
      this._getSerialOperationKeybindingMapping();
  }
  private validate() {
    if (
      new Set(this.extensions.filter((r) => Boolean(r.name)).map((r) => r.name))
        .size !== this.extensions.length
    ) {
      throw new Error('Extension name must be unique');
    }
  }

  private _getSerialOperationKeybindingMapping(): SerialOperationKeybindingMapping {
    const operations = this.getRegisteredOperations()
      .filter((r) => typeof r.keybinding === 'string')
      .map((r): [SerialOperationNameType, string] => [r.name, r.keybinding!]);

    return Object.fromEntries(operations);
  }

  renderReactNodeViews({
    nodeViewRenderArg,
  }: {
    nodeViewRenderArg: Parameters<BangleRenderNodeViewsFunction>[0];
  }): React.ReactNode {
    return this.renderReactNodeViewLookup[nodeViewRenderArg.node.type.name]?.({
      nodeViewRenderArg,
    });
  }

  getPlugins() {
    return [
      ...filterFlatMap(this.editorConfig, 'highPriorityPlugins'),
      ...filterFlatMap(this.editorConfig, 'plugins'),
    ];
  }

  getSidebars() {
    return this.sidebars;
  }

  getNoteSidebarWidgets() {
    return this.noteSidebarWidgets;
  }

  getSerialOperationKeybindingMapping() {
    return this.operationKeybindingMapping;
  }

  getEditorWatchPluginStates(): EditorWatchPluginState[] {
    return this.editorWatchPluginStates;
  }

  getSlices() {
    return this.slices;
  }

  renderExtensionEditorComponents = () => {
    const result = this.editorConfig
      .map((e) => {
        const { ReactComponent } = e;
        if (ReactComponent) {
          return <ReactComponent key={e.name} />;
        }
        return undefined;
      })
      .filter((e): e is JSX.Element => Boolean(e));
    return result;
  };

  getRegisteredOperations(): Readonly<SerialOperationDefinitionType[]> {
    return this.registeredSerialOperations;
  }

  getRegisteredOperationKeybinding(
    name: SerialOperationNameType,
  ): string | undefined {
    return this.registeredSerialOperations.find((a) => a.name === name)
      ?.keybinding;
  }

  getSerialOperationHandlers() {
    return this.serialOperationHandlers;
  }

  renderApplicationComponents = () => {
    const result = this.extensions
      .map((extension) => {
        const { ReactComponent } = extension.application;
        if (ReactComponent) {
          return (
            <ReactComponent
              key={extension.name}
              registerSerialOperationHandler={
                this.registerSerialOperationHandler
              }
            />
          );
        }
        return undefined;
      })
      .filter((e): e is JSX.Element => Boolean(e));

    return result;
  };

  registerSerialOperationHandler = (cb: SerialOperationHandler) => {
    this.serialOperationHandlers.add(cb);
    return () => {
      this.serialOperationHandlers.delete(cb);
    };
  };
}
