import { Plugin, PluginSettingTab, Setting, type App } from 'obsidian';
import type { Memory3DHost } from './graph-view';

// Defaults for the 3D graph. Live, fine-grained tuning (forces, sizes, search) lives
// in the in-view controls panel; this tab sets the persisted starting point.
export class Memory3DSettingTab extends PluginSettingTab {
  private host: Memory3DHost;

  constructor(app: App, host: Memory3DHost & Plugin) {
    super(app, host);
    this.host = host;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const s = this.host.settings;
    const save = () => void this.host.saveSettings();

    new Setting(containerEl).setName('View').setHeading();
    new Setting(containerEl)
      .setName('Auto-rotate')
      .setDesc('Slowly orbit the camera around the graph.')
      .addToggle((t) =>
        t.setValue(s.autoRotate).onChange((v) => {
          s.autoRotate = v;
          save();
        })
      );
    new Setting(containerEl).setName('Show labels').addToggle((t) =>
      t.setValue(s.showLabels).onChange((v) => {
        s.showLabels = v;
        save();
      })
    );
    new Setting(containerEl).setName('Show arrows').addToggle((t) =>
      t.setValue(s.showArrows).onChange((v) => {
        s.showArrows = v;
        save();
      })
    );

    new Setting(containerEl).setName('Filters').setHeading();
    new Setting(containerEl).setName('Tags').addToggle((t) =>
      t.setValue(s.filters.showTags).onChange((v) => {
        s.filters.showTags = v;
        save();
      })
    );
    new Setting(containerEl).setName('Attachments').addToggle((t) =>
      t.setValue(s.filters.showAttachments).onChange((v) => {
        s.filters.showAttachments = v;
        save();
      })
    );
    new Setting(containerEl).setName('Existing files only').addToggle((t) =>
      t.setValue(s.filters.hideUnresolved).onChange((v) => {
        s.filters.hideUnresolved = v;
        save();
      })
    );
    new Setting(containerEl).setName('Orphans').addToggle((t) =>
      t.setValue(s.filters.showOrphans).onChange((v) => {
        s.filters.showOrphans = v;
        save();
      })
    );
  }
}
