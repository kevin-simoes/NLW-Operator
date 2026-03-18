require("dotenv").config({ path: ".env.local" });

import { faker } from "@faker-js/faker";
import { db } from "./index";
import { analysisItems, roasts } from "./schema";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "csharp",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "sql",
  "html",
  "css",
  "jsx",
  "tsx",
  "bash",
  "yaml",
  "json",
  "markdown",
] as const;

const VERDICTS = [
  "needs_serious_help",
  "rough_around_edges",
  "decent_code",
  "solid_work",
  "exceptional",
] as const;

type VerdictType = (typeof VERDICTS)[number];

const CODE_TEMPLATES: Record<string, string[]> = {
  javascript: [
    "function {{name}}({{params}}) { return {{value}}; }",
    "const {{name}} = ({{params}}) => {{value}};",
    "async function {{name}}({{params}}) { const result = await {{value}}; return result; }",
    "class {{name}} { constructor({{params}}) { this.value = {{value}}; } }",
    "const {{name}} = {{value}};",
  ],
  typescript: [
    "function {{name}}({{params}}: {{types}}): {{returnType}} { return {{value}}; }",
    "const {{name}} = ({{params}}: {{types}}): {{returnType}} => {{value}};",
    "interface {{Name}} { {{property}}: {{type}}; }",
    "type {{Name}} = {{value}};",
  ],
  python: [
    "def {{name}}({{params}}): return {{value}}",
    "class {{Name}}: def __init__(self, {{params}}): self.value = {{value}}",
    "{{name}} = {{value}}",
    "async def {{name}}({{params}}): return {{value}}",
  ],
  sql: [
    "SELECT {{columns}} FROM {{table}} WHERE {{condition}}",
    "INSERT INTO {{table}} ({{columns}}) VALUES ({{values}})",
    "UPDATE {{table}} SET {{assignments}} WHERE {{condition}}",
    "DELETE FROM {{table}} WHERE {{condition}}",
    "JOIN {{table}} ON {{condition}}",
  ],
};

const ANALYSIS_TITLES: Record<string, string[]> = {
  critical: [
    "SQL Injection Vulnerability",
    "Remote Code Execution Risk",
    "Unvalidated User Input",
    "Missing Authentication",
    "Sensitive Data Exposure",
    "Race Condition",
    "Memory Leak",
    "Infinite Loop",
    "Off-by-one Error",
    "Null Pointer Dereference",
  ],
  warning: [
    "Unused Variable",
    "Deprecated API Usage",
    "Missing Error Handling",
    "Inefficient Loop",
    "Hardcoded Credentials",
    "Missing Type Definitions",
    "Poor Naming Convention",
    "Code Duplication",
    "Missing Documentation",
    "Magic Numbers",
  ],
  good: [
    "Clean Function Structure",
    "Proper Error Handling",
    "Good Variable Naming",
    "Modern Syntax Usage",
    "Type Safety",
    "Separation of Concerns",
    "Pure Function",
    "Single Responsibility",
    "DRY Principle",
    "Proper Error Messages",
  ],
};

const ANALYSIS_DESCRIPTIONS: Record<string, string[]> = {
  critical: [
    "This code contains a critical security vulnerability that could be exploited by attackers.",
    "This pattern can lead to system crashes or data loss if not addressed immediately.",
    "This is a severe performance issue that will cause problems at scale.",
    "This error will crash the application in production.",
  ],
  warning: [
    "This could lead to bugs in edge cases. Consider refactoring for better reliability.",
    "This pattern makes the code harder to maintain and understand.",
    "Consider using a more modern approach for better readability.",
    "This may cause issues when the codebase grows.",
  ],
  good: [
    "This follows best practices and makes the code maintainable.",
    "Clean and readable code that other developers will appreciate.",
    "Good use of modern language features.",
    "Proper handling of the use case.",
  ],
};

const ROAST_QUOTES: Record<VerdictType, string[]> = {
  needs_serious_help: [
    "This code is a disaster waiting to happen. I'm genuinely concerned for your production servers.",
    "I've seen better logic in a fortune cookie. Please, for the love of all that is holy, refactor this.",
    "This is the coding equivalent of putting tape on a bomb. It might work, but I wouldn't bet on it.",
    "If this code were a movie, it would be a horror film. Nightmares guaranteed.",
  ],
  rough_around_edges: [
    "It's not terrible, but there's definitely room for improvement. Don't give up!",
    "Close, but no cigar. A few tweaks and this could actually be decent.",
    "I've seen worse, but I've also seen much better. Time to polish this diamond.",
  ],
  decent_code: [
    "Not bad! You remembered the basics. That's more than I can say for some submissions.",
    "This actually works! Color me surprised. A few more tweaks and you'll be golden.",
    "Solid effort. The foundation is there, now build upon it.",
  ],
  solid_work: [
    "Clean code that does the job. Can't ask for much more than that.",
    "Well written and thought out. Someone's been paying attention in class!",
    "This is professional quality work. Good job!",
  ],
  exceptional: [
    "Beautiful! This is art, not just code. Museums should display this.",
    "I'm genuinely impressed. This is textbook perfect.",
    "Someone finally gets it! Absolute masterpiece of software engineering.",
  ],
};

const SUGGESTED_FIXES = [
  "Consider using a more functional approach with map/filter/reduce.",
  "Extract this logic into a separate function for better reusability.",
  "Add proper error handling with try-catch blocks.",
  "Use modern syntax like optional chaining and nullish coalescing.",
  "Add TypeScript types for better type safety.",
  "Consider using a design pattern here for better organization.",
  "Extract constants for magic numbers and strings.",
  "Add JSDoc comments for better documentation.",
  "Consider caching expensive computations.",
  "Use proper naming conventions - be descriptive!",
];

function generateCode(language: string): string {
  const templates = CODE_TEMPLATES[language] || CODE_TEMPLATES.javascript;
  const template = faker.helpers.arrayElement(templates);

  return template
    .replaceAll("{{name}}", faker.lorem.word())
    .replaceAll(
      "{{Name}}",
      faker.lorem
        .word({ length: { min: 3, max: 8 }, strategy: "any-length" })
        .replace(/^\w/, (c) => c.toUpperCase()),
    )
    .replaceAll(
      "{{params}}",
      faker.lorem.words(faker.number.int({ min: 0, max: 3 })),
    )
    .replaceAll(
      "{{types}}",
      faker.helpers
        .arrayElements(
          ["string", "number", "boolean", "any", "void"],
          faker.number.int({ min: 1, max: 2 }),
        )
        .join(", "),
    )
    .replaceAll(
      "{{returnType}}",
      faker.helpers.arrayElement([
        "void",
        "string",
        "number",
        "boolean",
        "Promise<void>",
        "Promise<string>",
      ]),
    )
    .replaceAll("{{value}}", faker.lorem.sentence({ min: 1, max: 5 }))
    .replaceAll(
      "{{columns}}",
      faker.helpers
        .arrayElements(
          ["id", "name", "email", "created_at", "updated_at", "status"],
          faker.number.int({ min: 2, max: 4 }),
        )
        .join(", "),
    )
    .replaceAll(
      "{{table}}",
      faker.helpers
        .arrayElement([
          "users",
          "orders",
          "products",
          "customers",
          "transactions",
        ])
        .replace(/^\w/, (c) => c.toUpperCase()),
    )
    .replaceAll(
      "{{condition}}",
      `${faker.lorem.word()} = ${faker.lorem.word()}`,
    )
    .replaceAll(
      "{{assignments}}",
      `${faker.lorem.word()} = ${faker.lorem.word()}`,
    )
    .replaceAll(
      "{{values}}",
      faker.helpers
        .arrayElements(
          ["'value'", "1", "NOW()", "true"],
          faker.number.int({ min: 2, max: 3 }),
        )
        .join(", "),
    )
    .replaceAll("{{property}}", faker.lorem.word())
    .replaceAll(
      "{{type}}",
      faker.helpers.arrayElement(["string", "number", "boolean"]),
    );
}

interface AnalysisItemInsert {
  roastId: string;
  severity: "critical" | "warning" | "good";
  title: string;
  description: string;
  order: number;
}

function generateAnalysisItems(
  roastId: string,
  severityDistribution: Record<string, number>,
): AnalysisItemInsert[] {
  const items: AnalysisItemInsert[] = [];
  const totalItems = faker.number.int({ min: 2, max: 6 });

  for (let i = 0; i < totalItems; i++) {
    let severity: "critical" | "warning" | "good";
    const rand = faker.number.float({ min: 0, max: 1 });

    if (rand < severityDistribution.critical) {
      severity = "critical";
    } else if (
      rand <
      severityDistribution.critical + severityDistribution.warning
    ) {
      severity = "warning";
    } else {
      severity = "good";
    }

    items.push({
      roastId,
      severity,
      title: faker.helpers.arrayElement(ANALYSIS_TITLES[severity]),
      description: faker.helpers.arrayElement(ANALYSIS_DESCRIPTIONS[severity]),
      order: i + 1,
    });
  }

  return items;
}

function getSeverityDistribution(verdict: VerdictType): Record<string, number> {
  switch (verdict) {
    case "needs_serious_help":
      return { critical: 0.5, warning: 0.4, good: 0.1 };
    case "rough_around_edges":
      return { critical: 0.2, warning: 0.6, good: 0.2 };
    case "decent_code":
      return { critical: 0.1, warning: 0.4, good: 0.5 };
    case "solid_work":
      return { critical: 0.05, warning: 0.25, good: 0.7 };
    case "exceptional":
      return { critical: 0, warning: 0.1, good: 0.9 };
    default:
      return { critical: 0.2, warning: 0.4, good: 0.4 };
  }
}

interface RoastInsert {
  code: string;
  language: string;
  lineCount: number;
  roastMode: boolean;
  score: number;
  verdict: VerdictType;
  roastQuote: string;
  suggestedFix: string;
  createdAt: Date;
}

async function seed() {
  console.log("🌱 Starting database seed...");

  const TARGET_ROASTS = 1000;
  const BATCH_SIZE = 50;

  try {
    console.log(`Creating ${TARGET_ROASTS} roasts...`);

    for (
      let batch = 0;
      batch < Math.ceil(TARGET_ROASTS / BATCH_SIZE);
      batch++
    ) {
      const roastsToInsert: RoastInsert[] = [];
      const batchCount = Math.min(
        BATCH_SIZE,
        TARGET_ROASTS - batch * BATCH_SIZE,
      );

      for (let i = 0; i < batchCount; i++) {
        const language = faker.helpers.arrayElement(LANGUAGES);
        const verdict = faker.helpers.arrayElement(VERDICTS);
        const roastMode = faker.datatype.boolean();

        let score: number;
        switch (verdict) {
          case "needs_serious_help":
            score = faker.number.float({ min: 0, max: 3, fractionDigits: 1 });
            break;
          case "rough_around_edges":
            score = faker.number.float({ min: 3, max: 5.5, fractionDigits: 1 });
            break;
          case "decent_code":
            score = faker.number.float({ min: 5.5, max: 7, fractionDigits: 1 });
            break;
          case "solid_work":
            score = faker.number.float({ min: 7, max: 8.5, fractionDigits: 1 });
            break;
          case "exceptional":
            score = faker.number.float({
              min: 8.5,
              max: 10,
              fractionDigits: 1,
            });
            break;
          default:
            score = faker.number.float({ min: 0, max: 10, fractionDigits: 1 });
        }

        const code = generateCode(language);
        const lineCount = code.split("\n").length;

        roastsToInsert.push({
          code,
          language,
          lineCount,
          roastMode,
          score,
          verdict,
          roastQuote: faker.helpers.arrayElement(ROAST_QUOTES[verdict]),
          suggestedFix: faker.helpers.arrayElement(SUGGESTED_FIXES),
          createdAt: faker.date.between({
            from: new Date("2024-01-01"),
            to: new Date(),
          }),
        });
      }

      const createdRoasts = await db
        .insert(roasts)
        .values(roastsToInsert)
        .returning({ id: roasts.id, verdict: roasts.verdict });

      console.log(
        `✓ Batch ${batch + 1}: Created ${createdRoasts.length} roasts`,
      );

      const allAnalysisItems: AnalysisItemInsert[] = [];
      for (let i = 0; i < createdRoasts.length; i++) {
        const roast = createdRoasts[i];
        const roastData = roastsToInsert[i];
        const severityDist = getSeverityDistribution(roastData.verdict);
        const items = generateAnalysisItems(roast.id, severityDist);
        allAnalysisItems.push(...items);
      }

      if (allAnalysisItems.length > 0) {
        await db.insert(analysisItems).values(allAnalysisItems);
        console.log(`  ✓ Added ${allAnalysisItems.length} analysis items`);
      }
    }

    const totalRoasts = await db.select().from(roasts);
    const totalItems = await db.select().from(analysisItems);

    console.log(`\n✅ Seed completed successfully!`);
    console.log(`   Total roasts: ${totalRoasts.length}`);
    console.log(`   Total analysis items: ${totalItems.length}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
