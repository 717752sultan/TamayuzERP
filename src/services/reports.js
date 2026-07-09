export const rowsToReportHtml = (title, rows, columns) => `
  <h1>${title}</h1>
  <table>
    <thead><tr>${columns.map((col) => `<th>${col.label}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows
        .map((row) => `<tr>${columns.map((col) => `<td>${row[col.key] ?? ""}</td>`).join("")}</tr>`)
        .join("")}
    </tbody>
  </table>
`;

export const reportRowsForExport = (rows, columns) =>
  rows.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.label] = row[col.key] ?? "";
      return acc;
    }, {}),
  );
