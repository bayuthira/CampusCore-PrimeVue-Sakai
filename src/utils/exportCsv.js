function escapeCsvValue(value) {
    if (value === null || value === undefined) return '';

    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return `"${text.replace(/"/g, '""')}"`;
}

export function exportToCsv(rows, filename) {
    if (!Array.isArray(rows) || rows.length === 0) return;

    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const lines = [headers.map(escapeCsvValue).join(','), ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(','))];
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
