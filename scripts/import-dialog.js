import { StatblockParser } from './parser.js';
import { DaggerheartActorCreator } from './actor-creator.js';

/**
 * Dialog for importing Daggerheart statblocks
 */
export class ImportDialog extends Dialog {
  constructor(options = {}) {
    const data = {
      title: game.i18n.localize('daggerheart-statblock-importer.dialog.title'),
      content: `
        <form class="daggerheart-statblock-importer">
          <div class="dialog-content">
            <div class="instructions">
              ${game.i18n.localize("daggerheart-statblock-importer.dialog.instructions")}
            </div>
            
            <textarea 
              class="statblock-input" 
              name="statblockText" 
              placeholder="${game.i18n.localize('daggerheart-statblock-importer.dialog.placeholder')}"
              required
            ></textarea>
          </div>
        </form>
      `,
      buttons: {
        import: {
          icon: "fas fa-download",
          label: game.i18n.localize("daggerheart-statblock-importer.button.import"),
          callback: (html) => this._onImport(html)
        },
        close: {
          icon: "fas fa-times",
          label: game.i18n.localize("daggerheart-statblock-importer.button.close"),
          callback: () => this.close()
        }
      },
      default: "import",
      close: () => {}
    };
    
    super(data, options);
    
    this.options.classes = ['daggerheart-statblock-importer', 'dialog'];
    this.options.width = 600;
    this.options.height = 500;
    this.options.resizable = true;
  }
  
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    
    // Focus on textarea when dialog opens
    html.find('.statblock-input').focus();
  }
  
  /**
   * Handle the import action
   */
  async _onImport(html) {
    const statblockText = html.find(".statblock-input").val().trim();
    
    if (!statblockText) {
      ui.notifications.warn(game.i18n.localize("daggerheart-statblock-importer.notifications.empty"));
      return;
    }
    
    // Disable the import button during processing
    const importButton = html.find("[data-button='import']");
    const originalText = importButton.html();
    importButton.prop("disabled", true);
    importButton.html("<i class=\"fas fa-spinner fa-spin\"></i> " + 
      game.i18n.localize("daggerheart-statblock-importer.notifications.parsing"));
    
    try {
      // Parse the statblock
      console.log("Daggerheart Statblock Importer | Starting statblock import", { text: statblockText });
      
      ui.notifications.info(game.i18n.localize("daggerheart-statblock-importer.notifications.parsing"));
      
      const parser = new StatblockParser();
      const parsedData = await parser.parse(statblockText);
      
      console.log("Daggerheart Statblock Importer | Parsed statblock data", parsedData);
      
      // Create the actor
      importButton.html("<i class=\"fas fa-spinner fa-spin\"></i> " + 
        game.i18n.localize("daggerheart-statblock-importer.notifications.creating"));
      
      const actorCreator = new DaggerheartActorCreator();
      const actor = await actorCreator.createActor(parsedData);
      
      console.log("Daggerheart Statblock Importer | Created actor", actor);
      
      // Success notification
      ui.notifications.info(
        game.i18n.format("daggerheart-statblock-importer.notifications.success", {
          name: actor.name
        })
      );
      
      // Close the dialog
      this.close();
      
      // Open the created actor sheet
      actor.sheet.render(true);
      
    } catch (error) {
      console.error("Daggerheart Statblock Importer | Import failed", error);
      
      ui.notifications.error(
        game.i18n.format("daggerheart-statblock-importer.notifications.error", {
          error: error.message
        })
      );
    } finally {
      // Re-enable the import button
      importButton.prop("disabled", false);
      importButton.html(originalText);
    }
  }
}

