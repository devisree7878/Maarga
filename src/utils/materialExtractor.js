
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/*
  MAARGA - Generic Material Extractor

  Generic extraction only.
  No Python/DSA/LeetCode hardcoding.
*/

const PDF_STANDARD_FONT_URL =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`;
/* -------------------------------------------------------
   Basic text helpers
------------------------------------------------------- */

function cleanText(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function countWords(text = "") {
  const value = cleanText(text);

  if (!value) return 0;

  return value
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function normalizeNumber(value) {
  const text = cleanText(value);

  if (!text) return null;

  const number = Number(text);

  if (!Number.isFinite(number)) return null;

  return number;
}


/* -------------------------------------------------------
   PDF text item extraction
------------------------------------------------------- */

async function extractPdfPages(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    standardFontDataUrl: PDF_STANDARD_FONT_URL,
  });

  const pdf = await loadingTask.promise;

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);

    const viewport = page.getViewport({
      scale: 1,
    });

    const content = await page.getTextContent();

    const items = content.items
      .filter((item) => item.str && cleanText(item.str))
      .map((item) => {
        const transform = item.transform || [];

        const x = transform[4] || 0;
        const y = transform[5] || 0;

        const fontSize =
          Math.abs(transform[0]) ||
          Math.abs(transform[3]) ||
          10;

        const width =
          Number(item.width) ||
          Math.max(cleanText(item.str).length * fontSize * 0.45, 1);

        const height =
          Number(item.height) ||
          fontSize;

        return {
          text: cleanText(item.str),
          x,
          y,
          width,
          height,
          fontSize,
          endX: x + width,
          centerX: x + width / 2,
        };
      });

    pages.push({
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      items,
    });
  }

  return {
    pdf,
    pages,
  };
}


/* -------------------------------------------------------
   Group PDF items into visual lines
------------------------------------------------------- */

function groupItemsIntoLines(items) {
  if (!items.length) return [];

  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 3) {
      return a.x - b.x;
    }

    return b.y - a.y;
  });

  const lines = [];

  for (const item of sorted) {
    let target = null;

    /*
      PDF coordinates can vary slightly even when text
      visually belongs to the same line.
    */
    for (const line of lines) {
      const tolerance = Math.max(
        3,
        Math.min(item.height, line.averageHeight || item.height) * 0.6
      );

      if (Math.abs(item.y - line.y) <= tolerance) {
        target = line;
        break;
      }
    }

    if (!target) {
      target = {
        y: item.y,
        items: [],
        averageHeight: item.height,
      };

      lines.push(target);
    }

    target.items.push(item);

    target.averageHeight =
      target.items.reduce((sum, current) => sum + current.height, 0) /
      target.items.length;
  }

  for (const line of lines) {
    line.items.sort((a, b) => a.x - b.x);

    line.text = cleanText(
      line.items.map((item) => item.text).join(" ")
    );

    line.xStart = Math.min(...line.items.map((item) => item.x));
    line.xEnd = Math.max(...line.items.map((item) => item.endX));

    line.y = line.items.reduce(
      (sum, item) => sum + item.y,
      0
    ) / line.items.length;
  }

  lines.sort((a, b) => b.y - a.y);

  return lines;
}


/* -------------------------------------------------------
   Detect column anchors dynamically
------------------------------------------------------- */

function clusterColumnAnchors(lines) {
  const positions = [];

  for (const line of lines) {
    for (const item of line.items) {
      positions.push({
        x: item.x,
        width: item.width,
      });
    }
  }

  if (!positions.length) return [];

  positions.sort((a, b) => a.x - b.x);

  const anchors = [];

  /*
    Dynamic tolerance.

    We don't know whether the PDF contains:
    2 columns
    3 columns
    4 columns
    8 columns

    So we discover them from repeated x positions.
  */
  for (const position of positions) {
    const tolerance = Math.max(
      8,
      position.width * 0.35
    );

    let anchor = anchors.find(
      (candidate) =>
        Math.abs(candidate.x - position.x) <= tolerance
    );

    if (!anchor) {
      anchor = {
        x: position.x,
        count: 0,
        widths: [],
      };

      anchors.push(anchor);
    }

    anchor.count += 1;
    anchor.widths.push(position.width);

    anchor.x =
      anchor.widths.reduce(
        (sum, width) => sum + width,
        0
      ) /
        anchor.widths.length +
      (anchor.x * (anchor.count - 1)) /
        anchor.count;
  }

  /*
    Keep anchors that occur repeatedly.

    A random x-position appearing once is unlikely
    to represent a real table column.
  */
  const minimumOccurrences =
    Math.max(2, Math.ceil(lines.length * 0.04));

  const repeated = anchors.filter(
    (anchor) => anchor.count >= minimumOccurrences
  );

  if (repeated.length >= 2) {
    return repeated.sort((a, b) => a.x - b.x);
  }

  return anchors
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .sort((a, b) => a.x - b.x);
}


/* -------------------------------------------------------
   Assign visual line items into columns
------------------------------------------------------- */

function buildColumnRow(line, anchors) {
  if (!anchors.length) {
    return [line.text];
  }

  const columns = Array.from(
    { length: anchors.length },
    () => []
  );

  for (const item of line.items) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    anchors.forEach((anchor, index) => {
      const distance = Math.abs(
        item.x - anchor.x
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    columns[bestIndex].push(item.text);
  }

  return columns.map((column) =>
    cleanText(column.join(" "))
  );
}


/* -------------------------------------------------------
   Determine whether a line is probably a table row
------------------------------------------------------- */

function rowHasStructure(row) {
  const nonEmpty = row.filter(Boolean);

  return nonEmpty.length >= 2;
}


/* -------------------------------------------------------
   Generic sequential-number detection
------------------------------------------------------- */

function extractLeadingNumber(text) {
  const value = cleanText(text);

  const match = value.match(
    /^(\d{1,4})(?:[.)\-:]|\s|$)/
  );

  if (!match) return null;

  return Number(match[1]);
}


/*
  Detect rows where the first column is:

  1
  2
  3
  4
  ...

  This is generic and works for any roadmap/table,
  regardless of subject.
*/
function detectSequentialRows(rows) {
  const candidates = rows.map((row) => {
    const firstNonEmpty =
      row.find((cell) => cleanText(cell));

    return firstNonEmpty
      ? extractLeadingNumber(firstNonEmpty)
      : null;
  });

  let bestStart = -1;
  let bestLength = 0;

  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i] === null) continue;

    let length = 1;

    for (
      let j = i + 1;
      j < candidates.length;
      j++
    ) {
      if (
        candidates[j] ===
        candidates[i] + length
      ) {
        length++;
      } else {
        break;
      }
    }

    if (length > bestLength) {
      bestStart = i;
      bestLength = length;
    }
  }

  return {
    start: bestStart,
    length: bestLength,
  };
}


/* -------------------------------------------------------
   Remove numbering from first cell
------------------------------------------------------- */

function removeLeadingNumber(text) {
  return cleanText(
    String(text || "").replace(
      /^\d{1,4}(?:[.)\-:]|\s)+/,
      ""
    )
  );
}


/* -------------------------------------------------------
   Merge rows that belong to the same visual table row
------------------------------------------------------- */

function mergeCompatibleRows(rows) {
  if (!rows.length) return [];

  const result = [];

  for (const row of rows) {
    const cleaned = row.map(cleanText);

    if (!cleaned.some(Boolean)) continue;

    const previous =
      result[result.length - 1];

    /*
      If a row has the same or fewer populated columns
      and contains no obvious row identifier, it can be
      a wrapped continuation of the previous row.
    */
    const currentNumber =
      extractLeadingNumber(
        cleaned.find(Boolean) || ""
      );

    const previousNumber =
      previous
        ? extractLeadingNumber(
            previous.find(Boolean) || ""
          )
        : null;

    const looksLikeContinuation =
      previous &&
      currentNumber === null &&
      previousNumber !== null &&
      cleaned.filter(Boolean).length <=
        previous.filter(Boolean).length;

    if (looksLikeContinuation) {
      const previousIndex =
        previous.length - 1;

      /*
        Prefer putting continuation text into the last
        populated cell.
      */
      for (
        let i = cleaned.length - 1;
        i >= 0;
        i--
      ) {
        if (cleaned[i]) {
          let targetIndex = i;

          while (
            targetIndex >= previous.length
          ) {
            targetIndex--;
          }

          if (targetIndex >= 0) {
            previous[targetIndex] = cleanText(
              `${previous[targetIndex]} ${cleaned[i]}`
            );
          }

          break;
        }
      }

      continue;
    }

    result.push(cleaned);
  }

  return result;
}


/* -------------------------------------------------------
   Detect a table from one PDF page
------------------------------------------------------- */

function detectPageTable(page) {
  const lines = groupItemsIntoLines(page.items);

  if (!lines.length) {
    return null;
  }

  const anchors =
    clusterColumnAnchors(lines);

  let rows = lines.map((line) =>
    buildColumnRow(line, anchors)
  );

  rows = mergeCompatibleRows(rows);

  /*
    Remove completely empty columns.
  */
  const maxColumns = Math.max(
    ...rows.map((row) => row.length),
    0
  );

  const usefulColumnIndexes = [];

  for (let column = 0; column < maxColumns; column++) {
    const hasValue = rows.some(
      (row) => cleanText(row[column] || "")
    );

    if (hasValue) {
      usefulColumnIndexes.push(column);
    }
  }

  rows = rows.map((row) =>
    usefulColumnIndexes.map(
      (index) => cleanText(row[index] || "")
    )
  );

  /*
    Remove rows with only one short fragment.
  */
  rows = rows.filter((row) => {
    const values = row.filter(Boolean);

    return (
      values.length >= 2 ||
      (values.length === 1 &&
        countWords(values[0]) > 3)
    );
  });

  if (!rows.length) {
    return null;
  }

  return {
    pageNumber: page.pageNumber,
    rows,
    lines,
    anchors,
  };
}


/* -------------------------------------------------------
   Detect header row dynamically
------------------------------------------------------- */

function findHeaderIndex(rows) {
  if (rows.length < 2) return -1;

  const firstRows = rows.slice(
    0,
    Math.min(rows.length, 8)
  );

  let bestIndex = -1;
  let bestScore = -Infinity;

  firstRows.forEach((row, index) => {
    const values = row.filter(Boolean);

    if (values.length < 2) return;

    const text = values.join(" ");

    const wordCount = countWords(text);

    const firstValue = values[0];

    const hasNumber =
      extractLeadingNumber(firstValue) !== null;

    let score = 0;

    /*
      Headers usually:
      - contain multiple cells
      - aren't numbered
      - are relatively short
    */
    score += values.length * 2;

    if (!hasNumber) score += 4;

    if (wordCount <= 30) score += 2;

    if (wordCount <= 15) score += 2;

    if (index === 0) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}


/* -------------------------------------------------------
   Normalize table columns
------------------------------------------------------- */

function normalizeTableRows(rawRows) {
  if (!rawRows.length) {
    return {
      headers: [],
      rows: [],
    };
  }

  const headerIndex =
    findHeaderIndex(rawRows);

  let headers = [];
  let dataRows = rawRows;

  if (headerIndex >= 0) {
    const headerRow =
      rawRows[headerIndex];

    headers = headerRow.map(
      (header, index) =>
        cleanText(header) ||
        `Column ${index + 1}`
    );

    dataRows = rawRows.slice(
      headerIndex + 1
    );
  }

  const maxColumns = Math.max(
    headers.length,
    ...dataRows.map(
      (row) => row.length
    ),
    0
  );

  if (!headers.length) {
    headers = Array.from(
      { length: maxColumns },
      (_, index) => `Column ${index + 1}`
    );
  }

  while (headers.length < maxColumns) {
    headers.push(
      `Column ${headers.length + 1}`
    );
  }

  const rows = dataRows
    .map((row) => {
      const cells = Array.from(
        { length: maxColumns },
        (_, index) =>
          cleanText(row[index] || "")
      );

      return cells;
    })
    .filter((row) =>
      row.some(Boolean)
    );

  return {
    headers,
    rows,
  };
}


/* -------------------------------------------------------
   Special handling for numbered table rows
------------------------------------------------------- */

function normalizeNumberedTable(
  headers,
  rows
) {
  if (!rows.length) {
    return {
      headers,
      rows,
    };
  }

  const sequence =
    detectSequentialRows(rows);

  /*
    We only apply this when there is a reasonably strong
    sequential structure.

    Example:

    1 ...
    2 ...
    3 ...
    ...
    30 ...
  */
  if (
    sequence.start < 0 ||
    sequence.length < 3
  ) {
    return {
      headers,
      rows,
    };
  }

  const normalized = rows.map(
    (row) => [...row]
  );

  for (const row of normalized) {
    if (!row.length) continue;

    const firstIndex =
      row.findIndex(Boolean);

    if (firstIndex < 0) continue;

    row[firstIndex] =
      removeLeadingNumber(
        row[firstIndex]
      );
  }

  return {
    headers,
    rows: normalized,
  };
}


/* -------------------------------------------------------
   Build table from PDF pages
------------------------------------------------------- */

function buildTables(pageTables) {
  if (!pageTables.length) {
    return [];
  }

  const allRows = [];

  for (const pageTable of pageTables) {
    for (const row of pageTable.rows) {
      allRows.push(row);
    }
  }

  if (!allRows.length) {
    return [];
  }

  const normalized =
    normalizeTableRows(allRows);

  const numbered =
    normalizeNumberedTable(
      normalized.headers,
      normalized.rows
    );

  return [
    {
      id: "table-1",
      headers: numbered.headers,
      rows: numbered.rows,
      rowCount: numbered.rows.length,
      columnCount: numbered.headers.length,
    },
  ];
}


/* -------------------------------------------------------
   Generic fallback for ordinary documents
------------------------------------------------------- */

function buildFallbackUnits(
  pages
) {
  const units = [];

  for (const page of pages) {
    const lines =
      groupItemsIntoLines(page.items);

    for (const line of lines) {
      const text = cleanText(line.text);

      if (!text) continue;

      /*
        Ignore tiny fragments because PDF files often
        contain page numbers / decorative text.
      */
      if (
        countWords(text) === 1 &&
        text.length < 3
      ) {
        continue;
      }

      units.push({
        id: `page-${page.pageNumber}-${units.length + 1}`,
        sourcePage: page.pageNumber,
        sourceRow: units.length + 1,
        cells: [
          {
            label: "Content",
            value: text,
          },
        ],
        text,
        words: countWords(text),
        weight: Math.max(
          1,
          countWords(text) / 12
        ),
      });
    }
  }

  return units;
}


/* -------------------------------------------------------
   Convert detected table into learning units
------------------------------------------------------- */

function tableToUnits(table) {
  return table.rows.map(
    (row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => ({
          label:
            table.headers[columnIndex] ||
            `Column ${columnIndex + 1}`,
          value: cleanText(value),
        }))
        .filter((cell) => cell.value);

      const text = cells
        .map((cell) => cell.value)
        .join(" ");

      const words =
        countWords(text);

      return {
        id: `row-${rowIndex + 1}`,
        sourceRow: rowIndex + 1,
        cells,
        text,
        words,
        weight: Math.max(
          1,
          words / 12
        ),
      };
    }
  );
}


/* -------------------------------------------------------
   Extract PDF
------------------------------------------------------- */

async function extractPdf(file) {
  const arrayBuffer =
    await file.arrayBuffer();

  const {
    pages,
  } =
    await extractPdfPages(
      arrayBuffer
    );

  const pageTables = [];

  for (const page of pages) {
    const table =
      detectPageTable(page);

    if (table) {
      pageTables.push(table);
    }
  }

  const tables =
    buildTables(pageTables);

  let units = [];

  if (tables.length) {
    /*
      The most important step:

      A 30-row roadmap becomes 30 separate units.
    */
    units =
      tableToUnits(tables[0]);
  }

  /*
    If no meaningful table was detected,
    use document lines instead.
  */
  if (!units.length) {
    units =
      buildFallbackUnits(pages);
  }

  const plainText =
    pages
      .map((page) => {
        const lines =
          groupItemsIntoLines(
            page.items
          );

        return [
          `[PAGE ${page.pageNumber}]`,
          ...lines.map(
            (line) => line.text
          ),
        ].join("\n");
      })
      .join("\n\n");

  const structuredText =
    tables.length
      ? [
          ...tables[0].headers,
          ...tables[0].rows.map(
            (row) => row.join(" | ")
          ),
        ].join("\n")
      : plainText;

  return {
    type: "pdf",
    name: file.name,
    pageCount: pages.length,
    pages,
    tables,
    units,
    text: structuredText,
    plainText,
    wordCount: countWords(plainText),
    hasTables: tables.length > 0,
  };
}


/* -------------------------------------------------------
   TXT
------------------------------------------------------- */

async function extractTextFile(file) {
  const text =
    await file.text();

  const lines =
    text
      .split(/\r?\n/)
      .map(cleanText)
      .filter(Boolean);

  const units =
    lines.map((line, index) => ({
      id: `line-${index + 1}`,
      sourceRow: index + 1,
      cells: [
        {
          label: "Content",
          value: line,
        },
      ],
      text: line,
      words: countWords(line),
      weight: Math.max(
        1,
        countWords(line) / 12
      ),
    }));

  return {
    type: "text",
    name: file.name,
    text,
    plainText: text,
    pages: [],
    tables: [],
    units,
    pageCount: 1,
    wordCount: countWords(text),
    hasTables: false,
  };
}


/* -------------------------------------------------------
   DOCX
------------------------------------------------------- */

async function extractDocx(file) {
  let mammoth;

  try {
    mammoth =
      await import("mammoth");
  } catch {
    throw new Error(
      "DOCX support requires mammoth. Install it with: npm install mammoth"
    );
  }

  const arrayBuffer =
    await file.arrayBuffer();

  const result =
    await mammoth.extractRawText({
      arrayBuffer,
    });

  const text =
    result.value || "";

  const lines =
    text
      .split(/\r?\n/)
      .map(cleanText)
      .filter(Boolean);

  const units =
    lines.map((line, index) => ({
      id: `line-${index + 1}`,
      sourceRow: index + 1,
      cells: [
        {
          label: "Content",
          value: line,
        },
      ],
      text: line,
      words: countWords(line),
      weight: Math.max(
        1,
        countWords(line) / 12
      ),
    }));

  return {
    type: "docx",
    name: file.name,
    text,
    plainText: text,
    pages: [],
    tables: [],
    units,
    pageCount: 1,
    wordCount: countWords(text),
    hasTables: false,
  };
}


/* -------------------------------------------------------
   Main public API
------------------------------------------------------- */

export async function extractMaterial(
  file
) {
  if (!file) {
    throw new Error(
      "No file was selected."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();

  if (extension === "pdf") {
    return extractPdf(file);
  }

  if (
    extension === "txt" ||
    extension === "md"
  ) {
    return extractTextFile(file);
  }

  if (
    extension === "docx"
  ) {
    return extractDocx(file);
  }

  throw new Error(
    `Unsupported file type: .${extension}`
  );
}


/* -------------------------------------------------------
   Optional helper exports
------------------------------------------------------- */

export {
  cleanText,
  countWords,
};