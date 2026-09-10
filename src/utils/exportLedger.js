/**
 * exportLedger.js - Financial Ledger CSV & PDF Export Utility
 * Generates formatted CSVs and handles pristine print triggers.
 */

export const exportToCsv = (filename, rows, columns) => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const separator = ',';
  // columns: array of { key: 'id', label: 'Transaction ID' } or object { id: 'Transaction ID' }
  let colKeys = [];
  let colHeaders = [];

  if (Array.isArray(columns)) {
    colKeys = columns.map(c => c.key);
    colHeaders = columns.map(c => c.label || c.key);
  } else if (typeof columns === 'object') {
    colKeys = Object.keys(columns);
    colHeaders = Object.values(columns);
  } else {
    colKeys = Object.keys(rows[0]);
    colHeaders = colKeys;
  }

  const headerLine = colHeaders.map(h => `"${String(h).replace(/"/g, '""')}"`).join(separator);

  const rowLines = rows.map((row, idx) => {
    return colKeys.map(key => {
      let val = row[key];
      if (key === '#sno' || key === 'sno') {
        val = idx + 1;
      }
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'number') {
        val = val.toFixed(2);
      } else if (val instanceof Date) {
        val = val.toLocaleString();
      } else {
        val = String(val);
      }
      return `"${val.replace(/"/g, '""')}"`;
    }).join(separator);
  });

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const triggerPrint = () => {
  window.print();
};
