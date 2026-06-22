import { Plugin, type WorkspaceLeaf } from 'obsidian';
import { Memory3DView, VIEW_TYPE_MEMORY_3D, type Memory3DHost } from './graph-view';
import { Memory3DSettingTab } from './settings-tab';
import { DEFAULT_SETTINGS, mergeSettings, type Memory3DSettings } from './settings';

// Agentage 3D Graph - opens the vault's note graph as a 3D, rotating force-graph.
// Nodes = notes (+ optional tags/attachments/unresolved), edges = links. Mirrors the
// built-in graph view's data model + filters, rendered in 3D via 3d-force-graph.
export default class Memory3DPlugin extends Plugin implements Memory3DHost {
  settings: Memory3DSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_MEMORY_3D, (leaf) => new Memory3DView(leaf, this));

    this.addRibbonIcon('brain', 'Open 3D graph', () => void this.activateView());
    this.addCommand({
      id: 'open-memory-3d',
      name: 'Open 3D graph',
      callback: () => void this.activateView(),
    });

    this.addSettingTab(new Memory3DSettingTab(this.app, this));
  }

  async loadSettings(): Promise<void> {
    this.settings = mergeSettings(await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_TYPE_MEMORY_3D)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getLeaf('tab');
      await leaf.setViewState({ type: VIEW_TYPE_MEMORY_3D, active: true });
    }
    void workspace.revealLeaf(leaf);
  }
}
