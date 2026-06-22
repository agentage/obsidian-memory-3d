import { describe, expect, it, vi } from 'vitest';

// Mock Obsidian + the WebGL libs so we can load the plugin wiring in Node and assert
// it registers the toolbar button, the view, the command, and the settings tab.
vi.mock('3d-force-graph', () => ({ default: class {} }));
vi.mock('three-spritetext', () => ({ default: class {} }));

vi.mock('obsidian', () => {
  class Plugin {
    app: unknown;
    constructor(app: unknown) {
      this.app = app;
    }
    addRibbonIcon = vi.fn();
    registerView = vi.fn();
    addCommand = vi.fn();
    addSettingTab = vi.fn();
    registerEvent = vi.fn();
    loadData = vi.fn().mockResolvedValue(undefined);
    saveData = vi.fn().mockResolvedValue(undefined);
  }
  class ItemView {
    constructor(public leaf: unknown) {}
  }
  class PluginSettingTab {
    constructor(
      public app: unknown,
      public plugin: unknown
    ) {}
  }
  class Setting {
    setName() {
      return this;
    }
    setDesc() {
      return this;
    }
    setHeading() {
      return this;
    }
    addToggle() {
      return this;
    }
    addText() {
      return this;
    }
    addSlider() {
      return this;
    }
  }
  return {
    Plugin,
    ItemView,
    PluginSettingTab,
    Setting,
    setIcon: vi.fn(),
    TFile: class {},
    debounce: (fn: unknown) => fn,
    getAllTags: () => [],
  };
});

import Memory3DPlugin from './main';
import { VIEW_TYPE_MEMORY_3D } from './graph-view';

const makeApp = () => {
  const setViewState = vi.fn().mockResolvedValue(undefined);
  return {
    workspace: {
      getLeavesOfType: vi.fn().mockReturnValue([]),
      getLeaf: vi.fn().mockReturnValue({ setViewState }),
      revealLeaf: vi.fn(),
    },
    _setViewState: setViewState,
  };
};

describe('Memory3DPlugin onload wiring', () => {
  it('registers the toolbar ribbon, the 3D view, a command, and a settings tab', async () => {
    const app = makeApp();
    const plugin = new Memory3DPlugin(app as never, {} as never);
    await plugin.onload();

    expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
      'brain',
      'Open Memory 3D',
      expect.any(Function)
    );
    expect(plugin.registerView).toHaveBeenCalledWith(VIEW_TYPE_MEMORY_3D, expect.any(Function));
    expect(plugin.addCommand).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'open-memory-3d' })
    );
    expect(plugin.addSettingTab).toHaveBeenCalledTimes(1);
  });

  it('clicking the ribbon opens a leaf with the 3D view type', async () => {
    const app = makeApp();
    const plugin = new Memory3DPlugin(app as never, {} as never);
    await plugin.onload();

    const ribbonCb = (plugin.addRibbonIcon as ReturnType<typeof vi.fn>).mock
      .calls[0][2] as () => void;
    ribbonCb();
    await Promise.resolve();
    await Promise.resolve();

    expect(app.workspace.getLeaf).toHaveBeenCalledWith('tab');
    expect(app._setViewState).toHaveBeenCalledWith(
      expect.objectContaining({ type: VIEW_TYPE_MEMORY_3D, active: true })
    );
  });

  it('reuses an existing 3D-view leaf instead of opening a new tab', async () => {
    const app = makeApp();
    const existing = { setViewState: vi.fn() };
    app.workspace.getLeavesOfType = vi.fn().mockReturnValue([existing]);
    const plugin = new Memory3DPlugin(app as never, {} as never);
    await plugin.onload();

    const ribbonCb = (plugin.addRibbonIcon as ReturnType<typeof vi.fn>).mock
      .calls[0][2] as () => void;
    ribbonCb();
    await Promise.resolve();

    expect(app.workspace.getLeaf).not.toHaveBeenCalled();
    expect(app.workspace.revealLeaf).toHaveBeenCalledWith(existing);
  });

  it('the open-3d command callback opens the view', async () => {
    const app = makeApp();
    const plugin = new Memory3DPlugin(app as never, {} as never);
    await plugin.onload();

    const cmd = (plugin.addCommand as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      callback: () => void;
    };
    cmd.callback();
    await Promise.resolve();
    await Promise.resolve();

    expect(app._setViewState).toHaveBeenCalledWith(
      expect.objectContaining({ type: VIEW_TYPE_MEMORY_3D })
    );
  });
});
