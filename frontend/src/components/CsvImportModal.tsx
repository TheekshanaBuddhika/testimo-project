//  M.Theekshana Buddhika - 25021196
import React, { useState } from 'react';
import Papa from 'papaparse';
import { api, type CreateTestimonialInput } from '../lib/api';
import './CsvImportModal.css';

interface CsvImportModalProps {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Mapping {
  submitter_name: string;
  submitter_email: string;
  submitter_title: string;
  submitter_company: string;
  content: string;
  rating: string;
}

export default function CsvImportModal({ workspaceId, onClose, onSuccess }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  
  const [mapping, setMapping] = useState<Mapping>({
    submitter_name: '',
    submitter_email: '',
    submitter_title: '',
    submitter_company: '',
    content: '',
    rating: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError('');

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Failed to parse CSV. Please ensure it is properly formatted.');
          return;
        }

        const parsedHeaders = results.meta.fields || [];
        setHeaders(parsedHeaders);
        setRows(results.data);

        // Auto-map if column names match exactly or closely
        const autoMap = { ...mapping };
        parsedHeaders.forEach(h => {
          const lower = h.toLowerCase();
          if (lower.includes('name')) autoMap.submitter_name = h;
          if (lower.includes('email')) autoMap.submitter_email = h;
          if (lower.includes('title')) autoMap.submitter_title = h;
          if (lower.includes('company')) autoMap.submitter_company = h;
          if (lower.includes('content') || lower.includes('review') || lower.includes('testimonial')) autoMap.content = h;
          if (lower.includes('rating') || lower.includes('stars')) autoMap.rating = h;
        });
        setMapping(autoMap);
      },
      error: () => setError('Error reading the CSV file.'),
    });
  };

  const handleImport = async () => {
    if (!mapping.submitter_name || !mapping.content) {
      setError('You must map both Name and Content columns.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const testimonials: CreateTestimonialInput[] = rows.map(row => ({
        submitter_name: row[mapping.submitter_name] || 'Anonymous',
        submitter_email: mapping.submitter_email ? row[mapping.submitter_email] : undefined,
        submitter_title: mapping.submitter_title ? row[mapping.submitter_title] : undefined,
        submitter_company: mapping.submitter_company ? row[mapping.submitter_company] : undefined,
        content: row[mapping.content] || '',
        rating: mapping.rating ? parseInt(row[mapping.rating], 10) : undefined,
        source: 'csv_import' as const,
      })).filter(t => t.content.trim() !== ''); // Filter out empty content rows

      if (testimonials.length === 0) {
        throw new Error('No valid testimonials found to import.');
      }

      await api.importTestimonials(workspaceId, testimonials);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal csv-modal">
        <h2 className="modal-title">Import Testimonials via CSV</h2>

        <div className="csv-modal-body">
          {!file ? (
            <div className="csv-dropzone" onClick={() => document.getElementById('csv-upload')?.click()}>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <p>Click to upload a .csv file</p>
            </div>
          ) : (
            <div className="csv-dropzone">
              <p className="file-name">📄 {file.name}</p>
              <p style={{ marginTop: '8px' }}>{rows.length} rows found.</p>
            </div>
          )}

          {error && <div className="csv-error">{error}</div>}

          {file && headers.length > 0 && (
            <div className="csv-mapping">
              <p className="csv-mapping-header">Map CSV Columns to Testimo</p>
              
              <MappingRow label="Name (Required)" field="submitter_name" mapping={mapping} headers={headers} setMapping={setMapping} />
              <MappingRow label="Content / Review (Required)" field="content" mapping={mapping} headers={headers} setMapping={setMapping} />
              <MappingRow label="Email" field="submitter_email" mapping={mapping} headers={headers} setMapping={setMapping} />
              <MappingRow label="Job Title" field="submitter_title" mapping={mapping} headers={headers} setMapping={setMapping} />
              <MappingRow label="Company" field="submitter_company" mapping={mapping} headers={headers} setMapping={setMapping} />
              <MappingRow label="Rating (1-5)" field="rating" mapping={mapping} headers={headers} setMapping={setMapping} />
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button 
              className="btn-primary" 
              onClick={handleImport} 
              disabled={loading || !file || !mapping.submitter_name || !mapping.content}
            >
              {loading ? 'Importing...' : 'Start Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MappingRow({ 
  label, 
  field, 
  mapping, 
  headers, 
  setMapping 
}: { 
  label: string, 
  field: keyof Mapping, 
  mapping: Mapping, 
  headers: string[], 
  setMapping: any 
}) {
  return (
    <div className="mapping-row">
      <span className="mapping-label">{label}</span>
      <select 
        className="mapping-select"
        value={mapping[field]}
        onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
      >
        <option value="">-- Ignore --</option>
        {headers.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
    </div>
  );
}
