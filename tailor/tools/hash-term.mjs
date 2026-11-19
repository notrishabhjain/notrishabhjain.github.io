// node tailor/tools/hash-term.mjs "a confidential name" ["another one" ...]
// Prints the SHA-256 fingerprint to add to confidentialHashes in tailor/data/rules.json.
// The name itself never needs to be committed.
import { termHash } from '../js/text.js';
for (const t of process.argv.slice(2)) console.log(`"${termHash(t)}",`);
console.error("Paste each line into confidentialHashes in tailor/data/rules.json.");
