import React, { useState } from 'react';
import { Trash2, Copy, Clipboard, Plus, Eye, ArrowUp, ArrowRight, ArrowDown, ArrowLeft, Tag, X } from 'lucide-react';

export default function ContextMenu({ 
  type, top, left, id, 
  onDelete, onDuplicate, onCopy, onPaste, onAddNode, onClose,
  onStyleChange, onToggleHandles, onAddHandle,
  // ★App.jsxから渡ってくる最新のタグリストを使う
  tags = [], onAddTag, onRemoveTag
}) {
  const [tagInput, setTagInput] = useState('');

  const itemClass = "flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left text-sm text-slate-700 transition-colors";
  const handleChange = (key, value) => { onStyleChange(id, key, value); };

  const handleAddTagSubmit = (e) => {
    e.preventDefault();
    if (tagInput.trim()) {
      onAddTag(id, tagInput.trim());
      setTagInput('');
    }
  };

  return (
    <div className="absolute z-50" style={{ top, left }}>
      <div className="bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden min-w-[240px] flex flex-col">
        
        {type === 'node' && (
          <>
            {/* 色・文字設定 */}
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium">スタイル</p>
              <div className="flex gap-2 mb-2">
                {['#ffffff', '#ffcaca', '#caf1ff', '#e4ffca', '#fffeca', '#f3f4f6'].map((c) => (
                   <button key={c} onClick={() => handleChange('color', c)} className="w-4 h-4 rounded-full border border-slate-300 hover:scale-110" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex items-center gap-1 justify-between bg-slate-50 p-1 rounded">
                <div className="flex gap-1">
                  <button onClick={() => handleChange('fontSize', '12px')} className="p-1 hover:bg-white rounded text-xs">S</button>
                  <button onClick={() => handleChange('fontSize', '14px')} className="p-1 hover:bg-white rounded text-sm font-bold">M</button>
                  <button onClick={() => handleChange('fontSize', '20px')} className="p-1 hover:bg-white rounded text-lg font-bold">L</button>
                </div>
              </div>
            </div>

            {/* ■ タグ設定エリア (即時反映 & 大きなバツボタン) */}
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium flex items-center gap-1"><Tag size={12} /> タグ</p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.length === 0 && <span className="text-[10px] text-slate-400">なし</span>}
                {tags.map((tag, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded flex items-center gap-1 border border-blue-100">
                    #{tag}
                    {/* バツボタンを大きく、押しやすく */}
                    <button 
                      onClick={() => onRemoveTag(id, tag)} 
                      className="text-blue-400 hover:text-red-500 p-0.5 hover:bg-white rounded-full transition-colors"
                      title="削除"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddTagSubmit} className="flex gap-1">
                <input 
                  type="text" 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="タグ追加" 
                  className="flex-1 text-xs border border-slate-300 rounded px-1 py-1 outline-none focus:border-blue-500"
                  onKeyDown={(e) => e.stopPropagation()} 
                />
                <button type="submit" className="bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600"><Plus size={14} /></button>
              </form>
            </div>

            {/* コネクタ設定 */}
            <div className="px-4 py-2 border-b border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-500 font-medium">コネクタ</p>
                <button onClick={() => { onToggleHandles(id); onClose(); }} className="text-slate-400 hover:text-blue-500" title="表示切替"><Eye size={14} /></button>
              </div>
              <div className="flex justify-between gap-1">
                <button onClick={() => onAddHandle(id, 'top')} className="flex-1 p-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded flex justify-center"><ArrowUp size={12} /></button>
                <button onClick={() => onAddHandle(id, 'bottom')} className="flex-1 p-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded flex justify-center"><ArrowDown size={12} /></button>
                <button onClick={() => onAddHandle(id, 'left')} className="flex-1 p-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded flex justify-center"><ArrowLeft size={12} /></button>
                <button onClick={() => onAddHandle(id, 'right')} className="flex-1 p-1 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded flex justify-center"><ArrowRight size={12} /></button>
              </div>
            </div>

            <button onClick={() => { onCopy(id); onClose(); }} className={itemClass}><Clipboard size={16} /><span>コピー</span></button>
            <button onClick={() => { onDuplicate(id); onClose(); }} className={itemClass}><Copy size={16} /><span>複製</span></button>
            <div className="h-px bg-slate-100 my-1" />
            <button onClick={() => { onDelete(id); onClose(); }} className={`${itemClass} text-red-500 hover:bg-red-50`}><Trash2 size={16} /><span>削除</span></button>
          </>
        )}
        {type === 'pane' && (
          <>
            <button onClick={() => { onAddNode({ x: left, y: top }); onClose(); }} className={itemClass}><Plus size={16} /><span>ここに追加</span></button>
            <button onClick={() => { onPaste({ x: left, y: top }); onClose(); }} className={itemClass}><Clipboard size={16} /><span>貼り付け</span></button>
          </>
        )}
      </div>
    </div>
  );
}