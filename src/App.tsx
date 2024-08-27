import styles from './App.module.scss';
import { useState } from 'react';
import Database from './Database';
import DBManager from './components/db-manager/db-manager';


function App() {
  

  return (
    <>
      <DBManager />
    </>
  );
}

export default App;