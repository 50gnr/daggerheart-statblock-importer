/**
 * Test cases for the Daggerheart Statblock Importer
 */

export const TEST_CASES = {
  // Test case 1: Acid Burrower (from the provided example)
  acidBurrower: {
    input: `ACID BURROWER T1 Solo
A home-sized insect with digging claws and acidic blood.
Difficulty: 14
Attack: +3
Experience: Tremor Sense +2
Motives & Tactics: Burrow, Drag away, Feed, Reposition

FEATURES
Relentless (2) - Passive
The Burrower can be spotlighted up to three times per GM turn. Spend Fear as usual to spotlight them.
Earth Eruption - Action
Mark a Stress to have the Burrower burst out of the ground. Make an attack against all targets in front of the Burrower within Close range. Targets the Burrower succeeds against take 2d6 physical damage and must mark an Armor Slot without receiving its benefits. If they can't mark an Armor Slot, they must mark an additional HP and you gain a Fear.
Acid Bath - Reaction
When the Burrower takes Severe damage, all creatures within Close range are bathed in their acidic blood, taking 1d10 physical damage. This splash covers the ground within Very Close range with blood, and all creatures other than the Burrower who move through it take 1d6 physical damage.

HP & STRESS
MINOR HP [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 8 MAJOR HP [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 15 SEVERE HP [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ]
STRESS [ ] [ ] [ ]`,
    expected: {
      name: 'ACID BURROWER',
      type: 'adversary',
      tier: 1,
      subtype: 'Solo',
      description: 'A home-sized insect with digging claws and acidic blood.',
      difficulty: 14,
      attack: 3,
      experience: 'Tremor Sense +2',
      motivesAndTactics: 'Burrow, Drag away, Feed, Reposition',
      features: [
        {
          name: 'Relentless',
          type: 'passive',
          value: '2'
        },
        {
          name: 'Earth Eruption',
          type: 'action'
        },
        {
          name: 'Acid Bath',
          type: 'reaction'
        }
      ],
      hitPoints: { minor: 8, major: 15, severe: 0 },
      stress: 3
    }
  },

  // Test case 2: Simple adversary without features
  simpleAdversary: {
    input: `GIANT RAT T1 Minion
A large, aggressive rodent.
Difficulty: 10
Attack: +1
Experience: Keen Smell +1
Motives & Tactics: Swarm, Bite, Flee

HP & STRESS
MINOR HP [ ] [ ] [ ] 3 MAJOR HP [ ] [ ] [ ] [ ] [ ] 5
STRESS [ ] [ ]`,
    expected: {
      name: 'GIANT RAT',
      type: 'adversary',
      tier: 1,
      subtype: 'Minion',
      description: 'A large, aggressive rodent.',
      difficulty: 10,
      attack: 1,
      experience: 'Keen Smell +1',
      motivesAndTactics: 'Swarm, Bite, Flee',
      features: [],
      hitPoints: { minor: 3, major: 5, severe: 0 },
      stress: 2
    }
  },

  // Test case 3: Environment statblock
  environment: {
    input: `ABANDONED GROVE T1 Event - Environment
A once-sacred grove now tainted by dark magic.
Difficulty: 12
The Difficulty of this environment equals that of the adversaries within it.
Surprise: Vines
Vines and brambles burst from the ground to entangle intruders.

BARONIAL COURT T1 Social - Environment
Opulent court politics and elaborate rituals abound in these halls.
Difficulty: 13
You Survive My Test: Finesse
The court's social machinations require finesse to navigate. When a character attempts to navigate the court's social dynamics, they must make a Finesse roll with Fear. On a success, they gain valuable information or an ally. On a failure, they commit a social faux pas and gain an enemy.`,
    expected: {
      name: 'ABANDONED GROVE',
      type: 'adversary',
      tier: 1,
      subtype: 'Event - Environment',
      description: 'A once-sacred grove now tainted by dark magic.',
      difficulty: 12
    }
  },

  // Test case 4: Malformed input (missing name)
  malformed: {
    input: `Difficulty: 15
Attack: +2
Some random text without proper structure`,
    shouldFail: true,
    expectedError: 'noName'
  },

  // Test case 5: Empty input
  empty: {
    input: '',
    shouldFail: true,
    expectedError: 'empty'
  }
};

/**
 * Run all test cases
 */
export async function runTests() {
  console.log('Running Daggerheart Statblock Importer Tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };
  
  for (const [testName, testCase] of Object.entries(TEST_CASES)) {
    try {
      console.log(`\nRunning test: ${testName}`);
      
      const parser = new window.DaggerheartStatblockImporter.StatblockParser();
      
      if (testCase.shouldFail) {
        // Test should fail
        try {
          await parser.parse(testCase.input);
          results.failed++;
          results.errors.push(`${testName}: Expected failure but parsing succeeded`);
          console.error(`❌ ${testName}: Expected failure but parsing succeeded`);
        } catch (error) {
          results.passed++;
          console.log(`✅ ${testName}: Correctly failed with error`);
        }
      } else {
        // Test should succeed
        const result = await parser.parse(testCase.input);
        
        // Validate key fields
        const expected = testCase.expected;
        let isValid = true;
        
        if (result.name !== expected.name) {
          isValid = false;
          console.error(`Name mismatch: expected "${expected.name}", got "${result.name}"`);
        }
        
        if (result.difficulty !== expected.difficulty) {
          isValid = false;
          console.error(`Difficulty mismatch: expected ${expected.difficulty}, got ${result.difficulty}`);
        }
        
        if (expected.features && result.features.length !== expected.features.length) {
          isValid = false;
          console.error(`Feature count mismatch: expected ${expected.features.length}, got ${result.features.length}`);
        }
        
        if (isValid) {
          results.passed++;
          console.log(`✅ ${testName}: Passed`);
        } else {
          results.failed++;
          results.errors.push(`${testName}: Validation failed`);
          console.error(`❌ ${testName}: Validation failed`);
        }
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`${testName}: ${error.message}`);
      console.error(`❌ ${testName}: ${error.message}`);
    }
  }
  
  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total: ${results.passed + results.failed}`);
  
  if (results.errors.length > 0) {
    console.log(`\nErrors:`);
    results.errors.forEach(error => console.log(`- ${error}`));
  }
  
  return results;
}

