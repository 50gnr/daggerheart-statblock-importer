import { StatblockParser } from './parser.js';
import { DaggerheartActorCreator } from './actor-creator.js';
import { ImportDialog } from './import-dialog.js';

/**
 * Main module initialization
 */
Hooks.once("init", () => {
  console.log("Daggerheart Statblock Importer | Initializing module");
  
  // Register module settings if needed
  game.settings.register("daggerheart-statblock-importer", "debugMode", {
    name: "Debug Mode",
    hint: "Enable debug logging for the statblock importer",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
});

/**
 * Add import button to actors directory
 */
Hooks.on('renderActorDirectory', (app, html, data) => {
  // Only show for Daggerheart system
  if (game.system.id !== 'daggerheart') return;
  
  // Add import button to the header
  const header = $(html).find(".directory-header");
  if (header.length) {
    const importButton = $(`
      <button class="daggerheart-import-button" title="${game.i18n.localize('daggerheart-statblock-importer.title')}">
        <i class="fas fa-file-import"></i>
        ${game.i18n.localize('daggerheart-statblock-importer.button.import')}
      </button>
    `);
    
    importButton.on('click', () => {
      new ImportDialog().render(true);
    });
    
    header.append(importButton);
  }
});

/**
 * Debug logging utility
 */
window.DaggerheartStatblockImporter = {
  debug: (message, ...args) => {
    if (game.settings.get('daggerheart-statblock-importer', 'debugMode')) {
      console.log(`Daggerheart Statblock Importer | ${message}`, ...args);
    }
  },
  
  error: (message, ...args) => {
    console.error(`Daggerheart Statblock Importer | ${message}`, ...args);
  },
  
  // Expose classes for debugging
  StatblockParser,
  DaggerheartActorCreator,
  ImportDialog
};

