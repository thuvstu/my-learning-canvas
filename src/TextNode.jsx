import React, { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const TextNode = ({ data, selected, id }) => {
  const [text, setText] = useState(data.label || 'ダブルクリックで編集');
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);

  // ★ここを追加：データから色を取得（デフォルトは白）
  const bgColor = data.color || '#ffffff';

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const onDoubleClick = () => {
    setIsEditing(true);
  };

  const onBlur = () => {
    setIsEditing(false);
    data.label = text;
  };

  return (
    <>
      <NodeResizer color="#3b82f6" isVisible={selected} minWidth={100} minHeight={50} />
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3" />

      <div 
        className="h-full w-full border-2 border-slate-300 rounded-md shadow-sm overflow-hidden flex flex-col transition-colors duration-200"
        // ★ここを変更：背景色をスタイルで直接指定
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex-1 p-2 min-h-0" onDoubleClick={onDoubleClick}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="nodrag w-full h-full resize-none outline-none text-sm text-slate-700 bg-transparent"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={onBlur}
            />
          ) : (
            <div className="w-full h-full text-sm text-slate-700 whitespace-pre-wrap pointer-events-none">
              {text}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3" />
    </>
  );
};

export default memo(TextNode);