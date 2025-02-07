import React, { useState } from 'react';
import { Button } from './ui/button';
import { exportToCsv } from '../lib/db';

export default function ExportData() {
  const [exporting, setExporting] = useState(false);
  const [includePhotos, setIncludePhotos] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportToCsv(includePhotos);
      const csv = convertToCSV(data);
      downloadCSV(csv);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => JSON.stringify(item[header] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = (csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `items-export-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6">
      <p className="mb-4">Export your data as CSV.</p>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="includePhotos"
          checked={includePhotos}
          onChange={(e) => setIncludePhotos(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-700"
        />
        <label htmlFor="includePhotos">Include photo URLs in export</label>
      </div>
      <Button 
        onClick={handleExport} 
        disabled={exporting}
        className="w-full md:w-auto"
      >
        {exporting ? 'Exporting...' : 'Export as CSV'}
      </Button>
    </div>
  );
}
