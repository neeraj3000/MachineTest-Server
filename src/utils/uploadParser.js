// Helpers to parse CSV and Excel files into JSON rows
const fs = require('fs');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const path = require('path');

// Detect file extension and route to the correct parser
async function parseCsvOrExcel(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    return parseCsv(filePath);
  }
  if (ext === '.xlsx' || ext === '.xls') {
    return parseExcel(filePath);
  }
  throw new Error('Unsupported file');
}

// Parse CSV file into an array of objects
function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', (err) => reject(err));
  });
}

// Parse first worksheet in an Excel workbook into an array of objects
function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);
  return rows;
}

module.exports = { parseCsvOrExcel };
