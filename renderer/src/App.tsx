import React, { useState } from 'react';

export function App() {
  const [fileContent, setFileContent] = useState('');

  const handleReadFile = async () => {
    const content = await window.electronAPI.readFile();
    setFileContent(content);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Electron + React</h1>
      
      <div style={{ marginTop: 16 }}>
        <button onClick={handleReadFile}>
          Прочитать файл
        </button>
      </div>

      <h3 style={{ marginTop: 24 }}>Содержимое файла:</h3>
      <pre style={{ 
        backgroundColor: '#f4f4f4', 
        padding: 16, 
        borderRadius: 4, 
        whiteSpace: 'pre-wrap', 
        wordBreak: 'break-all'
      }}>
        {fileContent || 'Нажмите на кнопку, чтобы выбрать и прочитать файл...'}
      </pre>
    </div>
  );
}