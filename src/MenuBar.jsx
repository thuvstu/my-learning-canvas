import React, { useState, useRef } from 'react';
import { 
  Plus, Download, Upload, ChevronUp, ChevronDown, Undo2, Redo2, 
  Bold, Underline, Type, Palette, Search, 
  ArrowDown as ArrowDownIcon, ArrowUp as ArrowUpIcon, 
  Trash2, Hand, MousePointer2 // アイコン追加
} from 'lucide-react';

const MenuBar = ({ 
  onAddNode, onSave, onLoad, onUndo, onRedo, canUndo, canRedo,
  selectedNode, onStyleChange,
  onSearch, searchResultCount, currentSearchIndex, onNextSearch, onPrevSearch, searchInputRef,
  onClearAll,
  // 追加プロップス
  isSelectionMode, onToggleSelectionMode, // モード切替用
  onDeleteSelected, hasSelection // 選択削除用
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const [searchVal, setSearchVal] = useState('');

  const currentFontSize = parseInt(selectedNode?.data?.fontSize || '14');
  const currentKvColor = selectedNode?.data?.color || '#ffffff';
  const currentTextColor = selectedNode?.data?.textColor || '#334155';

  const btnClass = (disabled, active = false) => `
    p-2 rounded flex flex-col items-center gap-1 min-w-[50px] transition-colors 
    ${disabled ? 'text-slate-300 cursor-not-allowed' : 
      active ? 'bg-blue-100 text-blue-600' : 'text-slate-600 hover:bg-slate-100 cursor-pointer'}
  `;
  const labelClass = "text-[10px] font-medium";
  
  const handleFontSizeChange = (e) => { onStyleChange(selectedNode.id, 'fontSize', `${e.target.value}px`); };
  const handleLoadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => { if (e.target.files[0]) onLoad(e.target.files[0]); e.target.value = ''; };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    onSearch(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) onPrevSearch();
      else onNextSearch();
    }
  };

  const handleClearClick = () => {
    if (window.confirm('キャンバスをすべて消去してもよろしいですか？')) {
      onClearAll();
    }
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <button onClick={() => setIsCollapsed(false)} className="bg-white shadow-lg border border-slate-200 rounded-full p-2 text-slate-600 hover:scale-110 transition-transform"><ChevronDown size={20} /></button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-sm shadow-xl border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 pointer-events-auto">
        
        {/* ■ ツール切り替え (移動 vs 選択) */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 mr-2">
          <button 
            onClick={() => onToggleSelectionMode(false)} 
            className={`p-1.5 rounded ${!isSelectionMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="移動ツール (スペースキー長押しでも可)"
          >
            <Hand size={18} />
          </button>
          <button 
            onClick={() => onToggleSelectionMode(true)} 
            className={`p-1.5 rounded ${isSelectionMode ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            title="範囲選択ツール (Shiftドラッグでも可)"
          >
            <MousePointer2 size={18} />
          </button>
        </div>

        <button onClick={onUndo} disabled={!canUndo} className={btnClass(!canUndo)} title="戻す"><Undo2 size={18} /><span className={labelClass}>戻す</span></button>
        <button onClick={onRedo} disabled={!canRedo} className={btnClass(!canRedo)} title="進む"><Redo2 size={18} /><span className={labelClass}>進む</span></button>
        
        <div className="w-px h-8 bg-slate-200 mx-1" />
        
        <button onClick={onAddNode} className={btnClass(false)} title="追加"><Plus size={18} className="text-blue-500" /><span className={labelClass}>追加</span></button>
        
        {/* ■ 選択削除ボタン */}
        <button onClick={onDeleteSelected} disabled={!hasSelection} className={btnClass(!hasSelection)} title="選択削除 (Delete)">
          <Trash2 size={18} className={hasSelection ? "text-red-500" : ""} />
          <span className={labelClass}>削除</span>
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />
        
        <button onClick={onSave} className={btnClass(false)} title="保存"><Download size={18} /><span className={labelClass}>保存</span></button>
        <button onClick={handleLoadClick} className={btnClass(false)} title="読込"><Upload size={18} /><span className={labelClass}>読込</span></button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.dat" className="hidden" />
        
        {/* 全消去 (少し離すか、区切りを入れる) */}
        <div className="w-px h-8 bg-slate-200 mx-1" />
        <button onClick={handleClearClick} className={btnClass(false)} title="全消去"><Trash2 size={18} className="text-slate-400 hover:text-red-600" /><span className={labelClass}>全消去</span></button>

        <div className="w-px h-8 bg-slate-200 mx-1" />
        
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1.5 border border-slate-200 focus-within:border-blue-400 transition-colors">
          <Search size={16} className="text-slate-400" />
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchVal}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="検索 (Ctrl+F)" 
            className="bg-transparent outline-none text-sm text-slate-700 w-24 placeholder:text-slate-400"
            onKeyDownCapture={(e) => { if(e.key !== 'Enter') e.stopPropagation(); }}
          />
          {searchVal && (
             <div className="flex items-center text-slate-400 text-xs gap-1 border-l border-slate-300 pl-1">
               <span className="min-w-[30px] text-center">
                 {searchResultCount > 0 ? `${currentSearchIndex + 1}/${searchResultCount}` : '0/0'}
               </span>
               <button onClick={onPrevSearch} className="hover:text-blue-500"><ArrowUpIcon size={14} /></button>
               <button onClick={onNextSearch} className="hover:text-blue-500"><ArrowDownIcon size={14} /></button>
             </div>
          )}
        </div>
      </div>

      {selectedNode && (
        <div className="bg-white/95 backdrop-blur-md shadow-lg border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-3 mt-1 pointer-events-auto animate-in slide-in-from-top-2 duration-200">
           {/* スタイルバー (省略なし) */}
           <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
            <Type size={16} className="text-slate-400" />
            <input type="number" min="8" max="100" value={currentFontSize} onChange={handleFontSizeChange} className="w-12 p-1 border border-slate-300 rounded text-sm text-center focus:outline-none focus:border-blue-500" />
            <span className="text-xs text-slate-400">px</span>
          </div>
          <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
            <button onClick={() => onStyleChange(selectedNode.id, 'toggleBold', true)} className={`p-1.5 rounded hover:bg-slate-100 ${selectedNode.data.isBold ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}><Bold size={16} /></button>
            <button onClick={() => onStyleChange(selectedNode.id, 'toggleUnderline', true)} className={`p-1.5 rounded hover:bg-slate-100 ${selectedNode.data.isUnderline ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}><Underline size={16} /></button>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded overflow-hidden border border-slate-300 relative cursor-pointer group">
               <span className="absolute inset-0" style={{ backgroundColor: currentTextColor }} />
               <input type="color" value={currentTextColor} onChange={(e) => onStyleChange(selectedNode.id, 'textColor', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
             </div>
          </div>
          <div className="flex items-center gap-2">
             <Palette size={16} className="text-slate-400" />
             <div className="w-6 h-6 rounded overflow-hidden border border-slate-300 relative cursor-pointer group">
               <span className="absolute inset-0" style={{ backgroundColor: currentKvColor }} />
               <input type="color" value={currentKvColor} onChange={(e) => onStyleChange(selectedNode.id, 'color', e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
             </div>
          </div>
        </div>
      )}

      <button onClick={() => setIsCollapsed(true)} className="bg-white shadow-md border border-slate-200 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-xs pointer-events-auto">
        <ChevronUp size={16} />
      </button>
    </div>
  );
};

export default MenuBar;