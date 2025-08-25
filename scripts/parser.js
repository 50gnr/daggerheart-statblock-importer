/**
 * Parser for Daggerheart statblocks from freshcutgrass.app
 */
export class StatblockParser {
  constructor() {
    this.debugMode = game?.settings?.get("daggerheart-statblock-importer", "debugMode") || false;
  }
  
  /**
   * Parse a statblock text into structured data
   * @param {string} text - The raw statblock text
   * @returns {Object} Parsed statblock data
   */
  async parse(text) {
    if (!text || typeof text !== "string") {
      throw new Error(game.i18n.localize("daggerheart-statblock-importer.notifications.empty"));
    }
    
    const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error(game.i18n.localize("daggerheart-statblock-importer.notifications.empty"));
    }
    
    const result = {
      name: "",
      type: "adversary",
      tier: 1,
      subtype: "",
      description: "",
      difficulty: 10,
      attack: 0,
      attackInfo: null,
      experience: "",
      experiences: [], // Array for multi-line experiences
      motivesAndTactics: "",
      features: [],
      hitPoints: { minor: 0, major: 0, severe: 0 },
      stress: 0,
      resistances: [],
      immunities: [],
      vulnerabilities: []
    };
    
    let currentSection = "header";
    let currentFeature = null;
    let expectingMotivesContinuation = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      this._debug(`Processing line ${i}: "${line}" (section: ${currentSection})`);
      
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Check for section transitions first
      if (line.toUpperCase().includes("FEATURES") && !line.includes(":")) {
        // Save current feature before transitioning
        if (currentFeature) {
          result.features.push(currentFeature);
          this._debug("Saved feature before Features section", currentFeature);
          currentFeature = null;
        }
        currentSection = "features";
        this._debug("Switched to Features section");
        continue;
      }
      
      // Check for HP & Stress section
      if (line.toUpperCase().includes("HP") && line.toUpperCase().includes("STRESS") && line.includes("&")) {
        // Save current feature before transitioning
        if (currentFeature) {
          result.features.push(currentFeature);
          this._debug("Saved feature before HP section", currentFeature);
          currentFeature = null;
        }
        currentSection = "hp_stress";
        this._debug("Switched to HP & Stress section");
        continue;
      }
      
      // Check for Experience section start
      if (line.match(/^Experience:\s*$/i)) {
        currentSection = "experience";
        this._debug("Started experience section");
        continue;
      }
      
      // Parse based on current section
      if (currentSection === "header") {
        if (this._parseNameAndType(line, result)) {
          continue;
        } else if (this._parseDescription(line, result)) {
          continue;
        } else if (this._parseBasicStats(line, result)) {
          // Check if we just parsed "Motives & Tactics:" header
          if (line.match(/^Motives\s*&\s*Tactics:\s*$/i)) {
            expectingMotivesContinuation = true;
          }
          continue;
        } else if (expectingMotivesContinuation && !line.toUpperCase().includes("FEATURES")) {
          // This line contains the actual motives and tactics content
          result.motivesAndTactics = line.trim();
          expectingMotivesContinuation = false;
          this._debug("Parsed motives and tactics continuation", { motivesAndTactics: result.motivesAndTactics });
          continue;
        }
      } else if (currentSection === "experience") {
        // Parse experience lines (e.g., "Fallen Lore +2", "Rituals +2", "Boundless Knowledge +4")
        const expMatch = line.match(/^(.+?)\s+\+(\d+)$/);
        if (expMatch) {
          const expName = expMatch[1].trim();
          const expValue = parseInt(expMatch[2]);
          
          result.experiences.push({
            name: expName,
            value: expValue
          });
          
          this._debug("Added experience item", { name: expName, value: expValue });
          continue;
        } else if (line.match(/^Motives\s*&\s*Tactics:/i)) {
          // Transition to header section for motives parsing
          currentSection = "header";
          if (this._parseBasicStats(line, result)) {
            if (line.match(/^Motives\s*&\s*Tactics:\s*$/i)) {
              expectingMotivesContinuation = true;
            }
          }
          continue;
        } else if (line.toUpperCase().includes("FEATURES")) {
          // Transition to features section
          currentSection = "features";
          this._debug("Switched from experience to features section");
          continue;
        } else if (!this._isExperienceLine(line)) {
          // Non-experience line, transition back to header
          currentSection = "header";
          this._debug("Exiting experience section, switching to header");
          // Try to parse this line in header context
          if (this._parseBasicStats(line, result)) {
            if (line.match(/^Motives\s*&\s*Tactics:\s*$/i)) {
              expectingMotivesContinuation = true;
            }
            continue;
          }
        }
      } else if (currentSection === "features") {
        const featureMatch = this._parseFeatureHeader(line);
        if (featureMatch) {
          // Save previous feature if exists
          if (currentFeature) {
            result.features.push(currentFeature);
            this._debug("Saved previous feature", currentFeature);
          }
          
          currentFeature = {
            name: featureMatch.value ? `${featureMatch.name} (${featureMatch.value})` : featureMatch.name,
            type: featureMatch.type.toLowerCase(),
            value: featureMatch.value || "",
            description: ""
          };
          this._debug("Started new feature", currentFeature);
        } else if (currentFeature && !this._isNewSection(line)) {
          // Add to current feature description
          if (currentFeature.description) {
            currentFeature.description += " ";
          }
          currentFeature.description += line.trim();
          this._debug("Added to feature description", { 
            name: currentFeature.name, 
            addedText: line.trim(),
            totalDescription: currentFeature.description 
          });
        } else if (!currentFeature && line.trim() && !this._isNewSection(line)) {
          // If we're in features section but don't have a current feature,
          // this might be a continuation of the previous feature or a missed header
          this._debug("Orphaned feature text (no current feature)", { line });
          
          // Try flexible feature header matching with more patterns
          const flexibleMatch = this._parseFeatureHeader(line) || this._parseFeatureHeaderFlexible(line);
          if (flexibleMatch) {
            currentFeature = {
              name: flexibleMatch.value ? `${flexibleMatch.name} (${flexibleMatch.value})` : flexibleMatch.name,
              type: flexibleMatch.type.toLowerCase(),
              value: flexibleMatch.value || "",
              description: ""
            };
            this._debug("Started new feature (flexible)", currentFeature);
          } else {
            // This might be a description line for a feature we missed parsing
            this._debug("Potential missed feature or description line", { line });
          }
        }
      } else if (currentSection === "hp_stress") {
        // Currently bypassing HP parsing as requested
        this._debug("Skipping HP/Stress parsing", { line });
      }
    }
    
    // Save the last feature if exists
    if (currentFeature) {
      result.features.push(currentFeature);
      this._debug("Saved final feature", currentFeature);
    }
    
    // Validate required fields
    if (!result.name) {
      throw new Error(game.i18n.localize("daggerheart-statblock-importer.errors.noName"));
    }
    
    this._debug("Parsing completed successfully", result);
    return result;
  }
  
  /**
   * Check if a line looks like an experience entry
   */
  _isExperienceLine(line) {
    return line.match(/^.+\s+\+\d+$/);
  }
  
  /**
   * Parse name and type from the first two lines
   */
  _parseNameAndType(line, result) {
    // First check if this line is just the name (first line)
    if (!result.name && !line.includes("T") && !line.includes(":")) {
      result.name = line.trim();
      this._debug("Parsed name", { name: result.name });
      return true;
    }
    
    // Parse tier and type (e.g., "T2 Support", "T1 Traversal - Environment")
    const tierTypeMatch = line.match(/^T(\d+)\s+(.+?)(?:\s*-\s*Environment)?$/i);
    if (tierTypeMatch) {
      result.tier = parseInt(tierTypeMatch[1]);
      const typeText = tierTypeMatch[2].trim().toLowerCase();
      
      // Check if this is an environment card
      if (line.toLowerCase().includes('environment')) {
        result.type = 'environment';
        result.subtype = typeText; // traversal, social, exploration, event
      } else {
        result.type = 'adversary';
        result.subtype = typeText; // solo, support, etc.
      }
      
      this._debug("Parsed tier and type", { tier: result.tier, type: result.type, subtype: result.subtype });
      return true;
    }
    
    // Legacy pattern: "CREATURE NAME T# Type" (e.g., "ACID BURROWER T1 Solo")
    const nameTypeMatch = line.match(/^(.+?)\s+(T(\d+)\s+(.+))$/i);
    if (nameTypeMatch) {
      result.name = nameTypeMatch[1].trim();
      result.tier = parseInt(nameTypeMatch[3]) || 1;
      result.subtype = nameTypeMatch[4].trim().toLowerCase();
      this._debug("Parsed name and type (legacy)", { name: result.name, tier: result.tier, subtype: result.subtype });
      return true;
    }
    
    return false;
  }
  
  _parseDescription(line, result) {
    // Only parse as description if we have a name but no description yet,
    // and this line doesn't contain stats or feature headers
    if (result.name && !result.description && !line.includes(":") && 
        !line.match(/^(Difficulty|Attack|Experience|Motives|HP|STRESS|Features)/i) && 
        !this._parseFeatureHeader(line) && !line.match(/^T\d+/i) &&
        !this._isExperienceLine(line)) {
      result.description = line.trim();
      this._debug("Parsed initial description line", { description: result.description });
      return true;
    }
    return false;
  }
  
  /**
   * Parse basic stats (Difficulty, Attack, Experience, Motives & Tactics)
   */
  _parseBasicStats(line, result) {
    // Difficulty
    const difficultyMatch = line.match(/^Difficulty:\s*(\d+)/i);
    if (difficultyMatch) {
      result.difficulty = parseInt(difficultyMatch[1]);
      this._debug("Parsed difficulty", { difficulty: result.difficulty });
      return true;
    }
    
    // Attack
    const attackMatch = line.match(/^Attack:\s*([+-]?\d+)/i);
    if (attackMatch) {
      result.attack = parseInt(attackMatch[1]);
      this._debug("Parsed attack", { attack: result.attack });
      return true;
    }
    
    // Attack line (e.g., "Claws: Very Close | 1d12+2 phy")
    const attackLineMatch = line.match(/^([^:]+):\s*([^|]+)\|\s*(.+)/i);
    if (attackLineMatch) {
      const attackName = attackLineMatch[1].trim();
      const range = attackLineMatch[2].trim();
      const damageInfo = attackLineMatch[3].trim();
      
      // Parse damage (e.g., "1d12+2 phy")
      const damageMatch = damageInfo.match(/(\d+d\d+)(?:\+(\d+))?\s+(phy|mag|physical|magical)/i);
      if (damageMatch) {
        const dice = damageMatch[1];
        const bonus = damageMatch[2] ? parseInt(damageMatch[2]) : 0;
        const damageType = damageMatch[3].toLowerCase();
        
        result.attackInfo = {
          name: attackName,
          range: range,
          dice: dice,
          bonus: bonus,
          damageType: damageType.startsWith('phy') ? 'physical' : 'magical'
        };
        
        this._debug("Parsed attack line", result.attackInfo);
        return true;
      }
    }
    
    // Experience (inline format) - Note: multi-line experience is handled in main parsing loop
    const experienceMatch = line.match(/^Experience:\s*(.+)/i);
    if (experienceMatch) {
      result.experience = experienceMatch[1].trim();
      this._debug("Parsed experience (inline)", { experience: result.experience });
      return true;
    }
    
    // Motives & Tactics
    const motivesMatch = line.match(/^Motives\s*&\s*Tactics:\s*(.+)/i);
    if (motivesMatch) {
      const content = motivesMatch[1].trim();
      if (content) {
        // Content is on the same line
        result.motivesAndTactics = content;
        this._debug("Parsed motives and tactics (inline)", { motivesAndTactics: result.motivesAndTactics });
      }
      // If content is empty, we'll expect it on the next line (handled in main loop)
      return true;
    }
    
    // Check for just "Motives & Tactics:" without content
    if (line.match(/^Motives\s*&\s*Tactics:\s*$/i)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Parse feature header line using the pattern: "Feature Name - Action/Passive/Reaction"
   */
  _parseFeatureHeader(line) {
    // Pattern: "Feature Name - Action/Passive/Reaction"
    const match = line.match(/^(.+?)\s*-\s*(Action|Passive|Reaction)\s*$/i);
    if (match) {
      const name = match[1].trim();
      const type = match[2].toLowerCase();
      
      // Check for value in parentheses (e.g., "Relentless (3)")
      const valueMatch = name.match(/^(.+?)\s*\((\d+)\)$/);
      if (valueMatch) {
        return {
          name: valueMatch[1].trim(),
          type: type,
          value: valueMatch[2]
        };
      }
      
      return {
        name: name,
        type: type,
        value: ""
      };
    }
    
    return null;
  }
  
  /**
   * More flexible feature header parsing for edge cases
   */
  _parseFeatureHeaderFlexible(line) {
    // Try different patterns that might be used
    
    // Pattern with colon: "Feature Name: Action"
    let match = line.match(/^(.+?)\s*:\s*(Action|Passive|Reaction)\s*$/i);
    if (match) {
      return {
        name: match[1].trim(),
        type: match[2].toLowerCase(),
        value: ""
      };
    }
    
    // Pattern without separator: "Feature Name Action" (risky, only use if line ends with action type)
    match = line.match(/^(.+?)\s+(Action|Passive|Reaction)\s*$/i);
    if (match && match[1].trim().length > 3) { // Ensure there's actually a feature name
      return {
        name: match[1].trim(),
        type: match[2].toLowerCase(),
        value: ""
      };
    }
    
    // Pattern with parentheses value and colon: "Feature Name (3): Action"
    match = line.match(/^(.+?)\s*\((\d+)\)\s*:\s*(Action|Passive|Reaction)\s*$/i);
    if (match) {
      return {
        name: match[1].trim(),
        type: match[3].toLowerCase(),
        value: match[2]
      };
    }
    
    return null;
  }
  
  /**
   * Check if a line indicates the start of a new section
   */
  _isNewSection(line) {
    // HP & Stress section indicators
    if ((line.toUpperCase().includes("HP") && line.toUpperCase().includes("STRESS")) ||
        line.match(/^(minor|major|severe)/i) ||
        line.match(/^\d+\s+HP/i)) {
      return true;
    }
    
    // Features section indicator
    if (line.toUpperCase().includes("FEATURES") && !line.includes(":")) {
      return true;
    }
    
    // Other section headers
    if (line.match(/^(Difficulty|Attack|Experience|Motives\s*&\s*Tactics):/i)) {
      return true;
    }
    
    // Check if this looks like a feature header (which would indicate we're still in features section)
    if (this._parseFeatureHeader(line) || this._parseFeatureHeaderFlexible(line)) {
      return false; // This is still within the features section
    }
    
    return false;
  }

  /**
   * Parse HP and Stress values (currently bypassed)
   */
  _parseHPStress(line, result) {
    // Look for HP values
    const minorHPMatch = line.match(/MINOR\s+HP[^\d]*(\d+)/i);
    if (minorHPMatch) {
      result.hitPoints.minor = parseInt(minorHPMatch[1]);
      this._debug("Parsed minor HP", { minor: result.hitPoints.minor });
    }
    
    const majorHPMatch = line.match(/MAJOR\s+HP[^\d]*(\d+)/i);
    if (majorHPMatch) {
      result.hitPoints.major = parseInt(majorHPMatch[1]);
      this._debug("Parsed major HP", { major: result.hitPoints.major });
    }
    
    const severeHPMatch = line.match(/SEVERE\s+HP[^\d]*(\d+)/i);
    if (severeHPMatch) {
      result.hitPoints.severe = parseInt(severeHPMatch[1]);
      this._debug("Parsed severe HP", { severe: result.hitPoints.severe });
    }
    
    // Look for Stress values
    const stressMatch = line.match(/STRESS[^\d]*(\d+)/i);
    if (stressMatch) {
      result.stress = parseInt(stressMatch[1]);
      this._debug("Parsed stress", { stress: result.stress });
    }
  }
  
  /**
   * Debug logging helper
   */
  _debug(message, data = null) {
    if (this.debugMode) {
      console.log(`StatblockParser | ${message}`, data);
    }
  }
}