import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeResizer, useNodeConnections, useUpdateNodeInternals } from '@xyflow/react';
import { Plus, X } from 'lucide-react';

const TextNode = ({ data, selected, id }) => {
  // 初期値をdata.labelから取る
  const [text, setText] = useState(data.label || 'ダブルクリックで編集');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);

  const connections = useNodeConnections({ nodeId: id });
  const updateNodeInternals = useUpdateNodeInternals();

  const bgColor = data.color || '#ffffff';
  const textColor = data.textColor || '#334155';
  const fontSize = data.fontSize || '14px';
  const isBold = data.isBold || false;
  const isUnderline = data.isUnderline || false;
  const tags = data.tags || [];

  const textStyle = {
    color: textColor,
    fontSize: fontSize,
    fontWeight: isBold ? 'bold' : 'normal',
    textDecoration: isUnderline ? 'underline' : 'none',
    lineHeight: '1.5',
  };

  const handles = data.handles || [
    { id: 'top', type: 'source', position: Position.Top, style: { left: '50%' } },
    { id: 'right', type: 'source', position: Position.Right, style: { top: '50%' } },
    { id: 'bottom', type: 'source', position: Position.Bottom, style: { left: '50%' } },
    { id: 'left', type: 'source', position: Position.Left, style: { top: '50%' } },
  ];
  const areHandlesHidden = data.areHandlesHidden || false;

  // ハンドル位置更新
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals, data.handles]);

  // ■ フラッシュ防止ロジック
  // 親からのデータ(data.label)が変わったときだけローカルstateを更新するが、
  // 「自分が編集中のとき」は更新しない（自分の入力を優先するため）
  useEffect(() => {
    if (!isEditing && data.label !== text) {
      setText(data.label || '');
    }
  }, [data.label, isEditing, text]); // text依存は安全策

  // 編集開始時のフォーカス
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // カーソルを末尾に
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
    }
  }, [isEditing]);

  // ■ デバウンス（間引き）更新用のタイマーRef
  const debounceTimer = useRef(null);

  const onDoubleClick = () => {
    setIsEditing(true);
    // 編集開始タイミングを親に通知（Undo履歴の保存用）
    if (data.onTextEditStart) data.onTextEditStart();
  };

  // 入力中の処理
  const handleChange = (e) => {
    const val = e.target.value;
    setText(val); // ローカルは即時反映（ラグなし）

    // 親への通知は少し待つ（300ms）
    // これにより、高速タイピング中のカーソルぐるぐる（再レンダリング連打）を防ぐ
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (data.onTextChange) data.onTextChange(id, val);
    }, 300);
  };

  const onBlur = () => {
    setIsEditing(false);
    // 最後の変更を確定送信
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (data.label !== text) {
      if (data.onTextChange) data.onTextChange(id, text);
    }
  };

  const handleRemoveTag = (e, tag) => {
    e.stopPropagation();
    if (data.onRemoveTag) data.onRemoveTag(id, tag);
  };

  const AddHandleButton = ({ pos, onClick, style }) => (
    <button
      className={`absolute bg-white border border-slate-300 rounded-full w-4 h-4 flex items-center justify-center text-slate-500 hover:bg-blue-500 hover:text-white hover:scale-125 transition-all shadow-sm 
        opacity-0 group-hover:opacity-100 ${selected ? 'opacity-100' : ''}`}
      style={{ ...style, transitionDuration: '0.2s', zIndex: 50 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="コネクタを追加"
      onMouseDown={(e) => e.stopPropagation()} 
    >
      <Plus size={10} strokeWidth={4} />
    </button>
  );

  return (
    <div className="group relative h-full w-full">
      <NodeResizer 
        color="#3b82f6" isVisible={selected} minWidth={100} minHeight={50}
        handleStyle={{ width: 12, height: 12, border: '1px solid #3b82f6' }}
      />

      <AddHandleButton pos="top"    style={{ top: -18, left: '50%', transform: 'translateX(-50%)' }} onClick={() => data.onAddHandle(id, 'top')} />
      <AddHandleButton pos="bottom" style={{ bottom: -18, left: '50%', transform: 'translateX(-50%)' }} onClick={() => data.onAddHandle(id, 'bottom')} />
      <AddHandleButton pos="left"   style={{ left: -18, top: '50%', transform: 'translateY(-50%)' }} onClick={() => data.onAddHandle(id, 'left')} />
      <AddHandleButton pos="right"  style={{ right: -18, top: '50%', transform: 'translateY(-50%)' }} onClick={() => data.onAddHandle(id, 'right')} />

      {handles.map((handle) => {
        const isConnected = connections.some(c => c.sourceHandle === handle.id || c.targetHandle === handle.id);
        let opacityClass = "opacity-100";
        if (areHandlesHidden && !isConnected) opacityClass = "opacity-0 group-hover:opacity-100";

        return (
          <Handle
            key={handle.id} id={handle.id} type={handle.type} position={handle.position}
            className={`!bg-blue-500 !w-3 !h-3 transition-opacity duration-200 z-50 ${opacityClass}`}
            style={handle.style} 
          />
        );
      })}
      
      <div 
        className="h-full w-full border-2 border-slate-300 rounded-md shadow-sm overflow-hidden flex flex-col transition-colors duration-200"
        style={{ backgroundColor: bgColor }}
        onDoubleClick={onDoubleClick}
      >
        <div className="flex-1 min-h-0 p-2 relative">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="nodrag w-full h-full resize-none outline-none bg-transparent relative z-20"
              style={textStyle}
              value={text}
              onChange={handleChange} // デバウンス付きハンドラに変更
              onBlur={onBlur}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="w-full h-full whitespace-pre-wrap pointer-events-none" style={textStyle}>
              {text}
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="px-2 pb-2 pt-1 flex flex-wrap gap-1 border-t border-black/5 bg-black/5 shrink-0">
            {tags.map((tag, index) => (
              <span key={index} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                #{tag}
                <button 
                  onClick={(e) => handleRemoveTag(e, tag)}
                  className="text-slate-400 hover:text-red-500 flex items-center justify-center w-3 h-3 rounded-full hover:bg-slate-100"
                  title="削除"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <X size={8} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(TextNode);