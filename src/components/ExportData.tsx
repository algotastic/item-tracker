import { useState } from 'react';
import { Button } from './ui/button';

export default function ExportData() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    // TODO: Implement export functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    setExporting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
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
