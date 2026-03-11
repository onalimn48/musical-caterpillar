import { needsLedgerLines } from "./staff.js";

function isLinePosition(position) {
  return ((position % 2) + 2) % 2 === 0;
}

export function buildNoteGroups({ noteName, fullName, position, clef }) {
  const lineOrSpace = isLinePosition(position) ? "line" : "space";
  const hasLedgerLines = Number.isFinite(position) && needsLedgerLines(position, clef).length > 0;
  const clefLabel = `${clef} clef`;

  return [
    {
      id: `note:${noteName}`,
      label: noteName,
      category: "note-name",
    },
    {
      id: `placement:${lineOrSpace}`,
      label: `${lineOrSpace} notes`,
      category: "line-space",
    },
    {
      id: `ledger:${hasLedgerLines ? "ledger" : "staff"}`,
      label: hasLedgerLines ? "ledger-line notes" : "inside-staff notes",
      category: "ledger",
    },
    {
      id: `clef-placement:${clef.toLowerCase()}-${lineOrSpace}`,
      label: `${clefLabel} ${lineOrSpace} notes`,
      category: "clef-placement",
    },
    {
      id: `clef-ledger:${clef.toLowerCase()}-${hasLedgerLines ? "ledger" : "staff"}`,
      label: `${clefLabel} ${hasLedgerLines ? "ledger-line" : "inside-staff"} notes`,
      category: "clef-ledger",
    },
    {
      id: `full-name:${fullName}`,
      label: fullName,
      category: "full-note",
    },
  ];
}
