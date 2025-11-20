import React, { useState, useRef } from 'react'; // useRefを追加
import { Plus, Download, Upload, ChevronUp, ChevronDown } from 'lucide-react';

const MenuBar = ({ onAddNode, onSave, onLoad }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 隠しファイル入力への参照
  const fileInputRef = useRef(null);

  const btnClass = "p-2 hover:bg-slate-100 rounded text-slate-600 transition-colors flex flex-col items-center gap-1 min-w-[60px]";
  const labelClass = "text-[10px] font-medium";

  // 読込ボタンが押されたら、隠してあるinputをクリックしたことにする
  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  // ファイルが選ばれたら、親（App.jsx）に渡す
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onLoad(file);
    }
    // 同じファイルを連続で選べるようにリセットしておく
    event.target.value = '';
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="bg-white shadow-lg border border-slate-200 rounded-full p-2 hover:bg-slate-50 transition-transform hover:scale-110 text-slate-600"
        >
          <ChevronDown size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
      <div className="bg-white/90 backdrop-blur-sm shadow-xl border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2">
        
        <button onClick={onAddNode} className={btnClass} title="新しいメモを追加">
          <Plus size={20} className="text-blue-500" />
          <span className={labelClass}>追加</span>
        </button>

        <div className="w-px h-8 bg-slate-200 mx-1" />

        <button onClick={onSave} className={btnClass} title="保存する">
          <Download size={20} />
          <span className={labelClass}>保存</span>
        </button>

        <button onClick={handleLoadClick} className={btnClass} title="ファイルを読み込む">
          <Upload size={20} />
          <span className={labelClass}>読込</span>
        </button>
        
        {/* ここに隠し要素を作成 */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json,.dat" // 許可する拡張子
          className="hidden"
          style={{ display: 'none' }}
        />
      </div>

      <button 
        onClick={() => setIsCollapsed(true)}
        className="bg-white shadow-md border border-slate-200 rounded-full p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 text-xs"
      >
        <ChevronUp size={16} />
      </button>
    </div>
  );
};

export default MenuBar;