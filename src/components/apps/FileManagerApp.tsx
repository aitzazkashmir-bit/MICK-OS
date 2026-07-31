import React, { useState } from 'react';
import { FileItem } from '../../types';
import { DEFAULT_FILES } from '../../data';
import { Folder, File, FileText, Code, Plus, Trash2, Eye, Download, Search } from 'lucide-react';

interface FileManagerAppProps {
  onOpenFile?: (file: FileItem) => void;
}

export const FileManagerApp: React.FC<FileManagerAppProps> = ({ onOpenFile }) => {
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);
  const [currentFolder, setCurrentFolder] = useState<string>('/Documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const folders = ['/Documents', '/Projects', '/System'];

  const filteredFiles = files.filter(
    (f) =>
      f.path === currentFolder &&
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateFile = () => {
    const name = prompt('Enter new file name (e.g. note.md or script.js):');
    if (!name) return;

    const ext = name.split('.').pop() as any || 'txt';
    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      type: 'file',
      path: currentFolder,
      size: '0.1 KB',
      updated: 'Just now',
      extension: ext,
      content: `# ${name}\nCreated in Mick AI OS File Manager.`,
    };

    setFiles((prev) => [...prev, newFile]);
  };

  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFile?.id === id) setSelectedFile(null);
  };

  return (
    <div className="flex h-full bg-slate-950 text-slate-100">
      {/* Directory Sidebar */}
      <div className="w-52 p-3 bg-slate-900 border-r border-slate-800 flex flex-col gap-2">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
          Locations
        </div>
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => {
              setCurrentFolder(folder);
              setSelectedFile(null);
            }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              currentFolder === folder
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-400" />
            <span>{folder.replace('/', '')}</span>
          </button>
        ))}

        <div className="mt-auto pt-3 border-t border-slate-800">
          <button
            onClick={handleCreateFile}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-indigo-300 border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New File</span>
          </button>
        </div>
      </div>

      {/* Main Files View */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Path: <code className="text-indigo-400">{currentFolder}</code>
          </span>
        </div>

        {/* Files Grid / List */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredFiles.map((file) => {
            const isSelected = selectedFile?.id === file.id;

            return (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                onDoubleClick={() => onOpenFile?.(file)}
                className={`group relative p-3 rounded-xl border flex flex-col items-center justify-between text-center cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
                }`}
              >
                <div className="p-3 rounded-xl bg-slate-800/80 group-hover:scale-105 transition-transform my-2">
                  {file.extension === 'ts' || file.extension === 'js' ? (
                    <Code className="w-6 h-6 text-cyan-400" />
                  ) : file.extension === 'md' ? (
                    <FileText className="w-6 h-6 text-indigo-400" />
                  ) : (
                    <File className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                <div className="w-full">
                  <p className="font-semibold text-xs text-slate-100 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{file.size}</p>
                </div>

                <button
                  onClick={(e) => handleDeleteFile(file.id, e)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete file"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {filteredFiles.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              No files found in {currentFolder}. Click 'New File' to create one!
            </div>
          )}
        </div>

        {/* Selected File Details Pane */}
        {selectedFile && (
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-200">{selectedFile.name}</span>
              <span className="text-slate-500">({selectedFile.updated})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenFile?.(selectedFile)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open in Code Editor</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
