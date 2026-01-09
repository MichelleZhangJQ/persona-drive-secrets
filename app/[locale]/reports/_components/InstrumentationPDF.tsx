import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface Reversal {
  target: string;
  reason: string;
  description: string;
}

interface DriveData {
  name: string;
  rank: number;
  satisfaction?: number;
  contextualNote?: string;
  genuinePassionNote?: string;
  reversals: Reversal[];
}

interface PDFProps {
  data: DriveData[];
  driveDefinitions: Record<string, string>;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 55,
    paddingHorizontal: 40,
    backgroundColor: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#201f33",
    borderStyle: "solid",
    paddingBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "bold", textTransform: "uppercase", color: "#0f172a" },
  subtitle: { fontSize: 9, textTransform: "uppercase", letterSpacing: 2, color: "#64748b", marginTop: 4 },
  introBox: {
    backgroundColor: "#f8fafc",
    padding: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
  },
  introText: { lineHeight: 1.5, color: "#334155" },

  driveSection: {
    marginBottom: 14,
    borderWidth: 1,
    borderStyle: "solid",
  },
  driveHeader: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driveName: { fontSize: 14, fontWeight: "bold", textTransform: "uppercase", color: "#ffffff" },
  rankBadge: { fontSize: 9, color: "#ffffff", opacity: 0.9 },

  contentBody: { padding: 14, flexDirection: "row" },
  column: { flex: 1 },
  columnLeft: { marginRight: 16 },
  columnTitle: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  bodyText: { fontSize: 10, lineHeight: 1.4, color: "#1e293b" },

  metaRow: { marginTop: 6, flexDirection: "row" },
  metaPill: {
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    marginRight: 6,
  },

  noteBox: {
    marginTop: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderStyle: "solid",
    backgroundColor: "#ffffff",
  },
  noteText: { fontSize: 9, lineHeight: 1.35, color: "#475569", fontStyle: "italic" },

  reversalItem: { marginTop: 8, padding: 8, borderLeftWidth: 3, borderStyle: "solid" },
  reversalReason: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", marginBottom: 3, letterSpacing: 1 },
  reversalDesc: { fontSize: 9, color: "#475569", lineHeight: 1.3 },
  noReversals: { fontSize: 9, fontStyle: "italic" },

  synthesisBox: {
    marginTop: 6,
    padding: 14,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "solid",
  },
  synthesisTitle: { fontSize: 14, fontWeight: "bold", textTransform: "uppercase", color: "#0f172a", marginBottom: 8 },
  synthesisLabel: { fontSize: 8, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 },
  synthesisText: { fontSize: 10, lineHeight: 1.4, color: "#334155" },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderStyle: "solid",
    paddingTop: 8,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8,
  },
});

function getTheme(name: string) {
  const BLUE = "#0f51a1";
  const PURPLE = "#671c77";
  const ORANGE = "#ae522b";

  let base = "#64748b";
  if (name === "Exploration") base = BLUE;
  if (["Value", "Affiliation", "Care"].includes(name)) base = PURPLE;
  if (["Dominance", "Achievement", "Pleasure"].includes(name)) base = ORANGE;

  if (base === BLUE) {
    return {
      base,
      sectionBg: "#f2f7ff",
      sectionBorder: "#b9d3f2",
      columnTitle: "#0f51a1",
      suppressionBg: "#eef4ff",
      suppressionBorder: "#0f51a1",
      suppressionText: "#0b3b78",
      priorityBg: "#f6f9ff",
      priorityBorder: "#2e6fc6",
      priorityText: "#1d4f92",
      noRevText: "#0b3b78",
      noteBorder: "#94a3b8",
      passionBorder: "#f59e0b",
    };
  }
  if (base === PURPLE) {
    return {
      base,
      sectionBg: "#fbf4fc",
      sectionBorder: "#ddb9e3",
      columnTitle: "#671c77",
      suppressionBg: "#f7ecf8",
      suppressionBorder: "#671c77",
      suppressionText: "#4f145c",
      priorityBg: "#fcf7fd",
      priorityBorder: "#84408f",
      priorityText: "#5b1e67",
      noRevText: "#4f145c",
      noteBorder: "#94a3b8",
      passionBorder: "#f59e0b",
    };
  }
  return {
    base,
    sectionBg: "#fff6f1",
    sectionBorder: "#f0c6b3",
    columnTitle: "#ae522b",
    suppressionBg: "#fff0e8",
    suppressionBorder: "#ae522b",
    suppressionText: "#7f3a1e",
    priorityBg: "#fff8f4",
    priorityBorder: "#c76b43",
    priorityText: "#8b4324",
    noRevText: "#7f3a1e",
    noteBorder: "#94a3b8",
    passionBorder: "#f59e0b",
  };
}

function stripHtml(s: string) {
  return String(s || "").replace(/<[^>]*>?/gm, "");
}

/**
 * --- Height estimation (points) ---
 * Letter: 612x792
 * Usable height = 792 - (40 top) - (55 bottom) = 697
 *
 * We estimate text lines by character count per column.
 * (Not perfect, but consistent enough to prevent splits.)
 */
const LETTER_H = 792;
const PAGE_PAD_TOP = 40;
const PAGE_PAD_BOT = 55;
const USABLE_H = LETTER_H - PAGE_PAD_TOP - PAGE_PAD_BOT;

// Tune these once, then you’re done.
const CHARS_PER_LINE_COL_10PT = 34; // half-column 10pt
const CHARS_PER_LINE_COL_9PT = 38;  // half-column 9pt

function estLines(text: string, charsPerLine: number) {
  const t = stripHtml(text || "").trim();
  if (!t) return 0;
  return Math.max(1, Math.ceil(t.length / charsPerLine));
}

function estimateDrivePanelHeight(item: DriveData, definition: string) {
  // Fixed chrome
  const headerH = 40; // driveHeader + text
  const bodyPadH = 28; // contentBody padding vertical (14*2)
  const columnTitleH = 16; // title + spacing
  const metaH = item.satisfaction != null ? 16 : 0;

  // Left column blocks
  const leftBodyLines = estLines(`The ${item.name.toLowerCase()} drive is ${definition}`, CHARS_PER_LINE_COL_10PT);
  const leftBodyH = leftBodyLines * 14;

  const passionLines = item.genuinePassionNote ? estLines(item.genuinePassionNote, CHARS_PER_LINE_COL_9PT) : 0;
  const passionH = passionLines ? (16 /*note padding*/ + passionLines * 12) : 0;

  const contextLines = item.contextualNote ? estLines(item.contextualNote, CHARS_PER_LINE_COL_9PT) : 0;
  const contextH = contextLines ? (16 + contextLines * 12) : 0;

  const leftColH = columnTitleH + leftBodyH + metaH + passionH + contextH;

  // Right column blocks
  const rightTitleH = columnTitleH;

  let rightContentH = 0;
  if (item.reversals && item.reversals.length > 0) {
    for (const rev of item.reversals) {
      const reasonH = 12; // one line
      const descLines = estLines(rev.description, CHARS_PER_LINE_COL_9PT);
      const descH = descLines * 12;
      const boxChrome = 16; // padding + margin-ish
      rightContentH += boxChrome + reasonH + descH;
    }
  } else {
    rightContentH = 14; // "No instrumentation detected"
  }

  const rightColH = rightTitleH + rightContentH;

  // Panel height is governed by the taller column
  const contentH = bodyPadH + Math.max(leftColH, rightColH);

  // + borders / margins
  const panelOuter = 8; // border + breathing room
  const marginBottom = 14;

  return headerH + contentH + panelOuter + marginBottom;
}

function estimateIntroHeight() {
  // Rough but stable
  const headerBlock = 18 + 10 + 22 + 12; // spacing + title/subtitle-ish
  const introBlock = 15 + 15 + 60; // padding + ~text
  return headerBlock + introBlock;
}

function estimateSynthesisHeight(suppressionCount: number, adaptationCount: number) {
  // Base title and padding
  let h = 14 + 14 + 18; // padding + title
  if (suppressionCount > 0) h += 46;
  if (adaptationCount > 0) h += 46;
  return h;
}

function buildPages(
  data: DriveData[],
  driveDefinitions: Record<string, string>
) {
  const pages: DriveData[][] = [];

  let current: DriveData[] = [];
  let used = 0;

  const introH = estimateIntroHeight();
  used = introH; // first page starts with intro

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const def = driveDefinitions[item.name] || "a core psychological motivator.";
    const panelH = estimateDrivePanelHeight(item, def);

    // If it doesn't fit, start a new page
    if (current.length > 0 && used + panelH > USABLE_H) {
      pages.push(current);
      current = [];
      used = 0; // subsequent pages have no intro
    }

    current.push(item);
    used += panelH;
  }

  if (current.length) pages.push(current);

  return pages;
}

export const InstrumentationPDF = ({ data = [], driveDefinitions = {} }: PDFProps) => {
  const suppressionCount = data.reduce(
    (acc, d) => acc + (d.reversals || []).filter((r) => r.reason === "suppression").length,
    0
  );
  const adaptationCount = data.reduce(
    (acc, d) => acc + (d.reversals || []).filter((r) => r.reason !== "suppression").length,
    0
  );

  // Build pages based on estimated panel heights
  let pages = buildPages(data, driveDefinitions);

  // Ensure synthesis fits on the last page; if not, put it on a new page
  const synthH = estimateSynthesisHeight(suppressionCount, adaptationCount);

  // Recompute last page usage estimate to decide if we need a new page for synthesis
  const lastPageItems = pages[pages.length - 1] || [];
  let lastUsed = 0;
  for (const item of lastPageItems) {
    const def = driveDefinitions[item.name] || "a core psychological motivator.";
    lastUsed += estimateDrivePanelHeight(item, def);
  }
  // If last page is also the first page, it had intro; but by here it’s safest to just be conservative:
  // If pages.length === 1, intro was present.
  if (pages.length === 1) lastUsed += estimateIntroHeight();

  const needsExtraSynthesisPage = lastUsed + synthH > USABLE_H;

  return (
    <Document>
      {pages.map((pageItems, pageIdx) => {
        const isFirst = pageIdx === 0;
        const isLast = pageIdx === pages.length - 1;

        return (
          <Page key={pageIdx} size="LETTER" style={styles.page}>
            {isFirst && (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Instrumentation Analysis</Text>
                  <Text style={styles.subtitle}>Structural Adaptation Profile</Text>
                </View>

                <View style={styles.introBox}>
                  <Text style={styles.introText}>
                    Instrumentation maps the tension between who you are and what your environment demands. It occurs
                    when your innate drives are deprioritized due to your environment, forcing other drives to act as
                    instruments for compensation. While successful adaptation allows you to thrive under pressure,
                    unresolved instrumentation leads to suppression and internal conflict. Below, we list your drives by
                    your innate preference ranking. If a drive is demoted to a lower priority in your surface persona,
                    we report whether it is due to instrumentation adaptation or suppression.
                  </Text>
                </View>
              </>
            )}

            {pageItems.map((item) => {
              const name = item?.name || "Unknown Drive";
              const theme = getTheme(name);
              const definition = driveDefinitions[name] || "a core psychological motivator.";
              const satisfaction = typeof item.satisfaction === "number" ? item.satisfaction : null;

              return (
                <View
                  key={`${pageIdx}-${name}`}
                  style={[styles.driveSection, { borderColor: theme.sectionBorder, backgroundColor: theme.sectionBg }]}
                  wrap={false} // ✅ NEVER split this panel
                >
                  <View style={[styles.driveHeader, { backgroundColor: theme.base }]}>
                    <Text style={styles.driveName}>{name}</Text>
                    <Text style={styles.rankBadge}>Rank {item.rank || "?"} of 7</Text>
                  </View>

                  <View style={styles.contentBody}>
                    <View style={[styles.column, styles.columnLeft]}>
                      <Text style={[styles.columnTitle, { color: theme.columnTitle }]}>Innate Orientation</Text>

                      <Text style={styles.bodyText}>
                        The {name.toLowerCase()} drive is {definition}
                      </Text>

                      <View style={styles.metaRow}>
                        {satisfaction !== null && (
                          <Text
                            style={[
                              styles.metaPill,
                              {
                                borderColor: satisfaction < 3 ? "#fb7185" : "#34d399",
                                color: satisfaction < 3 ? "#9f1239" : "#065f46",
                              },
                            ]}
                          >
                            Satisfaction: {satisfaction.toFixed(1)}
                          </Text>
                        )}
                      </View>

                      {item.genuinePassionNote ? (
                        <View style={[styles.noteBox, { borderLeftColor: theme.passionBorder }]}>
                          <Text style={styles.noteText}>{stripHtml(item.genuinePassionNote)}</Text>
                        </View>
                      ) : null}

                      {item.contextualNote ? (
                        <View style={[styles.noteBox, { borderLeftColor: theme.noteBorder }]}>
                          <Text style={styles.noteText}>{stripHtml(item.contextualNote)}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.column}>
                      <Text style={[styles.columnTitle, { color: theme.columnTitle }]}>Drive Instrumentation</Text>

                      {item.reversals && item.reversals.length > 0 ? (
                        item.reversals.map((rev, i) => {
                          const isSuppression = rev.reason === "suppression";
                          return (
                            <View
                              key={i}
                              style={[
                                styles.reversalItem,
                                {
                                  borderLeftColor: isSuppression ? theme.suppressionBorder : theme.priorityBorder,
                                  backgroundColor: isSuppression ? theme.suppressionBg : theme.priorityBg,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.reversalReason,
                                  { color: isSuppression ? theme.suppressionText : theme.priorityText },
                                ]}
                              >
                                {isSuppression ? "Drive Suppression" : "Drive Adaptation"}
                              </Text>
                              <Text style={styles.reversalDesc}>{stripHtml(rev.description)}</Text>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={[styles.noReversals, { color: theme.noRevText }]}>
                          No drive instrumentation detected.
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Only render synthesis on last page if it fits there */}
            {isLast && !needsExtraSynthesisPage && (
              <View style={styles.synthesisBox} wrap={false}>
                <Text style={styles.synthesisTitle}>Strategic Synthesis</Text>

                {suppressionCount > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={[styles.synthesisLabel, { color: "#e11d48" }]}>Regarding Suppressed Drives</Text>
                    <Text style={styles.synthesisText}>
                      We&apos;ve identified areas where your innate drives are currently suppressed. To maintain long-term
                      well-being, find a balanced approach that respects both inner needs and environmental demands.
                    </Text>
                  </View>
                )}

                {adaptationCount > 0 && (
                  <View>
                    <Text style={[styles.synthesisLabel, { color: "#4f46e5" }]}>Regarding Drive Instrumentation</Text>
                    <Text style={styles.synthesisText}>
                      While your innate drives are largely fulfilled, your environment necessitates a strategic shift in
                      priority. When this realignment occurs without causing internal friction, it represents effective
                      instrumentation—where one drive is successfully utilized to support the needs of another.
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Text style={styles.footer} fixed>
              Confidential Persona Instrumentation Report • © 2025 PersonaDriveSecrete
            </Text>
          </Page>
        );
      })}

      {/* If synthesis doesn’t fit on the last drive page, put it on its own page */}
      {needsExtraSynthesisPage && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.synthesisBox} wrap={false}>
            <Text style={styles.synthesisTitle}>Strategic Synthesis</Text>

            {suppressionCount > 0 && (
              <View style={{ marginBottom: 10 }}>
                <Text style={[styles.synthesisLabel, { color: "#e11d48" }]}>Regarding Suppressed Drives</Text>
                <Text style={styles.synthesisText}>
                  We&apos;ve identified areas where your innate drives are currently suppressed. To maintain long-term
                  well-being, find a balanced approach that respects both inner needs and environmental demands.
                </Text>
              </View>
            )}

            {adaptationCount > 0 && (
              <View>
                <Text style={[styles.synthesisLabel, { color: "#4f46e5" }]}>Regarding Drive Instrumentation</Text>
                <Text style={styles.synthesisText}>
                  While your innate drives are largely fulfilled, your environment necessitates a strategic shift in
                  priority. When this realignment occurs without causing internal friction, it represents effective
                  instrumentation—where one drive is successfully utilized to support the needs of another.
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.footer} fixed>
            Confidential Persona Instrumentation Report • © 2025 PersonaDriveSecrete
          </Text>
        </Page>
      )}
    </Document>
  );
};