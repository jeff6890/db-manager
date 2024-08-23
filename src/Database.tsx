import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mjcfrjysshcqrqaxpxqi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qY2Zyanlzc2hjcXJxYXhweHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMTI4ODYsImV4cCI6MjAzOTU4ODg4Nn0.gFZM_fmc3bxKmIF5QOU8mZoZVQ-eJNTz1L2HI_U4zYc';
const supabaseSecret = 'YOUR_API_SECRET_HERE';

const supabase = createClient(supabaseUrl, supabaseKey);

const DatabaseManager = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedRows, setEditedRows] = useState<any[]>([]); // Store edited rows
  const [message, setMessage] = useState(''); // Added to display a message after changes have been submitted
  const [newRow, setNewRow] = useState<{ [key: string]: any }>({}); // Added to store new row data

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchRows();
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase.rpc('get_tables');

      if (error) throw error;
      setTables(data.map((table: { table_name: string }) => table.table_name));
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(selectedTable)
      .select('*');

    if (error) console.error(`Error fetching rows from ${selectedTable}:`, error);
    else {
      setRows(data || []);
      setEditedRows(data || []); // Initialize editedRows with the fetched data
    }
    setLoading(false);
  };

  const updateRow = (id: number, updates: Record<string, any>) => {
    setEditedRows(rows.map(row => row.id === id ? { ...row, ...updates } : row));
  };

  const addRow = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(selectedTable)
      .insert([newRow]);

    if (error) console.error('Error adding row:', error);
    else {
      fetchRows(); // Refresh the data
      setNewRow({}); // Reset new row data
      setMessage('Row added successfully!'); // Display a message after row has been added
    }
    setLoading(false);
  };

  const saveChanges = async () => {
    setLoading(true);
    for (const row of editedRows) {
      const { data, error } = await supabase
        .from(selectedTable)
        .update(row)
        .eq('id', row.id);

      if (error) console.error('Error updating row:', error);
    }
    fetchRows(); // Refresh the data after saving changes
    setMessage('Changes saved successfully!'); // Display a message after changes have been submitted
    setLoading(false);
  };

  const deleteRow = async (id: number) => {
    const { data, error } = await supabase
      .from(selectedTable)
      .delete()
      .eq('id', id);

    if (error) console.error('Error deleting row:', error);
    else {
      fetchRows(); // Refresh the data
      setMessage('Row deleted successfully!'); // Display a message after row has been deleted
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Database Manager</h1>
      <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
        <option value="">Select a table</option>
        {tables.map((tableName) => (
          <option key={tableName} value={tableName}>
            {tableName}
          </option>
        ))}
      </select>

      {selectedTable && (
        <div>
          <table>
            <thead>
              <tr>
                {rows.length > 0 &&
                  Object.keys(rows[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {Object.entries(row).map(([key, value]) => (
                    <td key={key}>
                      <input
                        value={editedRows.find(editedRow => editedRow.id === row.id)?.[key]?.toString() || ''}
                        onChange={(e) => updateRow(row.id, { [key]: e.target.value })}
                      />
                    </td>
                  ))}
                  <td>
                    <button onClick={() => deleteRow(row.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              <tr>
                {rows.length > 0 &&
                  Object.keys(rows[0]).map((key) => (
                    <td key={key}>
                      <input
                        value={newRow[key]?.toString() || ''}
                        onChange={(e) => setNewRow({ ...newRow, [key]: e.target.value })}
                      />
                    </td>
                  ))}
                <td>
                  <button onClick={addRow}>Add</button>
                </td>
              </tr>
            </tbody>
          </table>
          <button onClick={saveChanges}>Save Changes</button>
          {message && <div>{message}</div>} {/* Display the message after changes have been submitted */}
        </div>
      )}
    </div>
  );
};

export default DatabaseManager;