import React from "react";
import ReactDOMServer from "react-dom/server";
import * as XLSX from "xlsx-js-style";

const ProjectTableExcel = ({ data }) => {
  return (
    <table border="1" cellPadding="5">
      <thead>
        <tr>
          {/* Top-level headers */}
          <th rowSpan={2}>מס'</th>
          <th rowSpan={2}>ארגון</th>
          <th rowSpan={2}>שם פרויקט</th>
          <th colSpan={3}>פרטי סטודנט 1</th>
          <th colSpan={3}>פרטי סטודנט 2</th>
          <th colSpan={3}>שם מנחה אקדמי</th>
          <th colSpan={3}>מנחה מקצועי</th>
        </tr>
        <tr>
          {/* Sub-headers for each group */}
          <th>שם</th>
          <th>ת"ז</th>
          <th>רישום לקורס</th>
          <th>שם</th>
          <th>ת"ז</th>
          <th>רישום לקורס</th>
          <th>שם</th>
          <th>ליווי מלא / חלקי?</th>
          <th>דוא"ל</th>
          <th>שם</th>
          <th>טלפון</th>
          <th>דוא"ל</th>
        </tr>
      </thead>
      <tbody>
        {data.map((project, index) => (
          <tr key={index}>
            <td>{index + 1}</td>
            <td></td>
            <td>{project.title}</td>

            {/* Student 1 */}
            <td>{project.students[0]?.student.name}</td>
            <td>{project.students[0]?.student.id}</td>
            <td>{project.students[0] ? "כן" : ""}</td>

            {/* Student 2 */}
            <td>{project.students[1]?.student.name}</td>
            <td>{project.students[1]?.student.id}</td>
            <td>{project.students[1] ? "כן" : ""}</td>

            {/* Academic Mentor */}
            <td>{project.advisors[0]?.name}</td>
            <td>מלא</td>
            <td>{project.advisors[0]?.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const downloadProjectExcel = (data, year) => {
  // Render the table as static HTML using ReactDOMServer
  const tableHtml = ReactDOMServer.renderToStaticMarkup(<ProjectTableExcel data={data} />);

  // Create a temporary element to hold the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = tableHtml;

  // Get the table element from the temporary container
  const tableElement = tempDiv.querySelector("table");

  // Convert the HTML table to a workbook using SheetJS
  const workbook = XLSX.utils.table_to_book(tableElement, { sheet: "Projects" });
  const ws = workbook.Sheets["Projects"];

  // Calculate the maximum width for each column
  const width = XLSX.utils.decode_range(ws["!ref"]);
  const colWidths = [];

  for (let col = width.s.c; col <= width.e.c; col++) {
    let maxWidth = 10; // a minimum width (in characters)
    for (let row = width.s.r; row <= width.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
      const cell = ws[cellAddress];
      if (cell && cell.v != null) {
        const cellLength = cell.v.toString().length;
        maxWidth = Math.max(maxWidth, cellLength);
      }
    }
    colWidths.push({ wch: maxWidth });
  }

  // Set the calculated widths on the worksheet
  ws["!cols"] = colWidths;

  // Define the header style: centered alignment (both horizontal and vertical) and thin black borders.
  const headerStyle = {
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "000000" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "medium", color: { rgb: "000000" } },
      right: { style: "medium", color: { rgb: "000000" } },
    },
  };

  // Define the project title style: RIGHT alignment
  const projectTitleStyle = {
    alignment: { horizontal: "right", vertical: "center" },
  };

  // Get the range of cells in the worksheet.
  const range = XLSX.utils.decode_range(ws["!ref"]);
  // Assume the header rows are the first two rows (0-indexed: rows 0 and 1).
  for (let R = range.s.r; R <= range.e.r; R++) {
    if (R <= 1) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (ws[cellRef]) {
          ws[cellRef].s = headerStyle;
        }
      }
    }
  }

  // Apply right-alignment only to the project title column (column index 2, which is column "C")
  for (let R = 2; R <= range.e.r; R++) {
    // Skip headers (start from row 2)
    const cellRef = XLSX.utils.encode_cell({ c: 2, r: R }); // Column C (index 2)
    if (ws[cellRef]) {
      ws[cellRef].s = projectTitleStyle;
    }
  }

  // Trigger the download of the Excel file as "projects.xlsx"
  XLSX.writeFile(workbook, `טבלת פרויקטים - ${year}.xlsx`);
};

export const downloadGradesExcel = (data, year) => {
  const worksheetData = data.flatMap((project, index) => {
    const rows = [];
    project.students.forEach((student, studentIndex) => {
      rows.push({
        id: student.student.id,
        grade: project.totalGrade,
      });
    });
    return rows;
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData, { skipHeader: true });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");

  // Trigger the download of the Excel file as "grades.xlsx"
  XLSX.writeFile(workbook, `טבלת ציונים - ${year}.xlsx`);
};

export default ProjectTableExcel;
