import { CorePalette } from '@bangle.io/constants';
import { SliceKey } from '@bangle.io/create-store';
import { UniversalPalette } from '@bangle.io/ui-components';

export const extensionName = 'bangle-io-core-palettes';
export const sliceKey = new SliceKey(extensionName + ':');

export interface PaletteManagerReactComponentProps {
  query: string;
  paletteType?: string | null;
  paletteMetadata: any;
  updatePalette: (type: CorePalette | null, initialQuery?: string) => void;
  dismissPalette: (focusEditor?: boolean) => void;
  onSelect: ReturnType<typeof UniversalPalette.usePaletteDriver>['onSelect'];
  counter: number;
  getActivePaletteItem: (items) => undefined | UniversalPalette.ItemType;
  updateCounter: ReturnType<
    typeof UniversalPalette.usePaletteDriver
  >['updateCounter'];
  allPalettes: ExtensionPaletteType[];
}

export type PaletteReactComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<PaletteManagerReactComponentProps> &
    React.RefAttributes<PaletteManagerImperativeHandle>
>;

export type PaletteManagerImperativeHandle = {
  onExecuteItem: UniversalPalette.PaletteOnExecuteItem;
};

export interface ExtensionPaletteType {
  type: CorePalette;
  icon: JSX.Element;
  identifierPrefix: string;
  placeholder: string;
  parseRawQuery: (query: string) => string | undefined | null;
  ReactComponent: PaletteReactComponent;
}
