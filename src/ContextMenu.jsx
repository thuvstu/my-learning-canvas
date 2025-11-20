import React from 'react';
import { Trash2, Copy, Palette } from 'lucide-react';

export default function ContextMenu({ id, top, left, onDelete, onDuplicate, onColorChange, onClose }) {
  
  // メニュー項目共通クラス
  const itemClass = "flex items-center gap-2 px-4 py-2 hover:bg-slate-100 w-full text-left text-sm text-slate-700 transition-colors";

  return (
    // 背景をクリックしたらメニューを閉じるための見えないカバー
    // z-indexを高くしてメニューを最前面に
    <div className="absolute z-50" style={{ top, left }}>
      <div className="bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden min-w-[160px] flex flex-col">
        
        {/* 色変更エリア */}
        <div className="px-4 py-2 border-b border-slate-100">
          <p className="text-xs text-slate-500 mb-2 font-medium">色を変更</p>
          <div className="flex gap-2">
            {/* プリセットカラー */}
            {['#ffffff', '#ffcaca', '#caf1ff', '#e4ffca', '#fffeca'].map((color) => (
              <button
                key={color}
                onClick={() => { onColorChange(id, color); onClose(); }}
                className="w-5 h-5 rounded-full border border-slate-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* 複製ボタン */}
        <button onClick={() => { onDuplicate(id); onClose(); }} className={itemClass}>
          <Copy size={16} />
          <span>複製</span>
        </button>

        {/* 削除ボタン（赤文字にして警告感を出す） */}
        <button onClick={() => { onDelete(id); onClose(); }} className={`${itemClass} text-red-500 hover:bg-red-50`}>
          <Trash2 size={16} />
          <span>削除</span>
        </button>
      </div>
    </div>
  );
}