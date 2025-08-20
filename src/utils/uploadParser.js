const fs = require('fs');
const { parse } = require('csv-parse');
const XLSX = require('xlsx');
const path = require('path');

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

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);
  return rows;
}

module.exports = { parseCsvOrExcel };
