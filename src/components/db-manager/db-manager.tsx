import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './db-manager.module.scss';

const DBManager = () => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null);
  const [connected, setConnected] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editedRows, setEditedRows] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [newRow, setNewRow] = useState<{ [key: string]: any }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      handleConnect();
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (connected) {
      fetchTables();
    }
  }, [connected]);

  useEffect(() => {
    if (selectedTable) {
      fetchRows();
    }
  }, [selectedTable, currentPage, rowsPerPage]);

  const handleConnect = async () => {
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        setSupabase(supabase as ReturnType<typeof createClient>);
        setConnected(true);
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchTables = async () => {
    try {
      if (supabase) {
        const { data, error } = await supabase.rpc('get_tables');

        if (error) {
          console.error('Error fetching tables:', error);
        } else {
          setTables((data as { table_name: string }[]).map((table) => table.table_name));
          setLoading(false);
        }
      } else {
        console.error('Supabase is not initialized');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setLoading(false);
    }
  };

  const fetchRows = async () => {
    setLoading(true);

    if (currentPage < 1 || rowsPerPage < 1) {
      console.error('Invalid page or rows per page');
      setLoading(false);
      return;
    }
    try {
      if (supabase) {
        const response = await supabase
          ?.from(selectedTable)
          .select('*', { count: 'exact' })
          .order('id', { ascending: true })
          .range((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage - 1);
        if (!response) throw new Error('No response received');
        const { data, error, count } = response;
        if (error) throw error;
        setRows(data || []);
        setEditedRows(data || []);
        setTotalCount(count || 0);
      } else {
        console.error('Supabase is not initialized');
      }
    } catch (error) {
      console.error(`Error fetching rows from ${selectedTable}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (id: number, updates: Record<string, any>) => {
    setEditedRows(rows.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const addRow = async () => {
    setLoading(true);
    if (supabase) {
      const { data, error } = await supabase.from(selectedTable).insert([newRow]);

      if (error) console.error('Error adding row:', error);
    } else {
      console.error('Supabase is not initialized');
    }
    setLoading(false);
  };

  const saveChanges = async () => {
    setLoading(true);
    if (supabase) {
      for (const row of editedRows) {
        const { data, error } = await supabase
          .from(selectedTable)
          .update(row)
          .eq('id', row.id);
        if (error) console.error('Error updating row:', error);
      }
    } else {
      console.error('Supabase is not initialized');
    }
    fetchRows();
    setMessage('Changes saved successfully!');
    setLoading(false);
  };

  const deleteRow = async (id: number) => {
    if (supabase) {
      const { data, error } = await supabase.from(selectedTable).delete().eq('id', id);

      if (error) console.error('Error deleting row:', error);
      else {
        fetchRows();
        setMessage('Row deleted successfully!');
      }
    } else {
      console.error('Supabase is not initialized');
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalCount / rowsPerPage)) {
      console.error('Invalid page number');
      return;
    }
    setLoading(true);
    setCurrentPage(newPage);
    await fetchRows();
    setLoading(false);
  };

  return (
    <div className={styles.databaseContainer}>
      <h1 className={styles.title}>Database Manager</h1>
      <div>
        <label>Supabase Project URL:</label>
        <input
          type="text"
          className={styles.connectInput}
          value={supabaseUrl}
          onChange={(e) => setSupabaseUrl(e.target.value)}
        />
      </div>
      <div>
        <label>Supabase API Key:</label>
        <input
          type="text"
          className={styles.connectInput}
          value={supabaseKey}
          onChange={(e) => setSupabaseKey(e.target.value)}
        />
      </div>
      <button className={styles.connectButton} onClick={handleConnect}>Connect</button>
      {connected ? (
        <div>
          <select className={styles.tableSelect} value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
            <option value="">Select a table</option>
            {tables.map((tableName) => (
              <option key={tableName} value={tableName}>
                {tableName}
              </option>
            ))}
          </select>

          {selectedTable && (
            <div>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {rows.length > 0 &&
                      Object.keys(rows[0]).map((key) => (
                        <th key={key} className={styles.tableHeader}>
                          {key}
                        </th>
                      ))}
                    <th className={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {rows.map((row) => (
                    <tr key={row.id}>
                      {Object.entries(row).map(([key, value]) => (
                        <td key={key}>
                          <input
                            className={styles.inputField}
                            value={
                              editedRows.find((editedRow) => editedRow.id === row.id)?.[key]?.toString() ||
                              ''
                            }
                            onChange={(e) => updateRow(row.id, { [key]: e.target.value })}
                          />
                        </td>
                      ))}
                      <td>
                        <button
                          className={styles.deleteButton}
                          onClick={() => deleteRow(row.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    {rows.length > 0 &&
                      Object.keys(rows[0]).map((key) => (
                        <td key={key}>
                          <input
                            className={styles.inputField}
                            value={newRow[key]?.toString() || ''}
                            onChange={(e) => setNewRow({ ...newRow, [key]: e.target.value })}
                          />
                        </td>
                      ))}
                    <td>
                      <button className={styles.addButton} onClick={addRow}>
                        Add
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              {totalCount > rowsPerPage && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.prevButton}
                  >
                    Previous
                  </button>
                  <span>{currentPage}</span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage * rowsPerPage >= totalCount}
                    className={styles.nextButton}
                  >
                    Next
                  </button>
                </div>
              )}
              <button className={styles.saveButton} onClick={saveChanges}>
                Save Changes
              </button>
              {message && <div className={styles.message}>{message}</div>}
            </div>
          )}
        </div>
      ) : (
        <div>Not connected to Supabase</div>
      )}
      {loading && <div className={styles.loading}>Loading...</div>}
    </div>
  );
};

export default DBManager;