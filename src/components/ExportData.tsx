import { useState } from 'react';
import { Button } from './ui/button';
import { exportToCsv } from '../lib/db';

export default function ExportData() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportToCsv();
      const csv = convertToCSV(data);
      downloadCSV(csv);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]);
    const rows = data.map(item => 
      headers.map(header => JSON.stringify(item[header])).join(',')
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
      <p className="mb-4">Export your data as CSV. This will include all item details and photo URLs.</p>
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
