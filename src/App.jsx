import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  useOnSelectionChange, // 選択監視用
  Position,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TextNode from './TextNode';
import MenuBar from './MenuBar';
import ContextMenu from './ContextMenu';
import { useUndoRedo } from './useUndoRedo';

const initialNodesDefault = [
  { 
    id: '1', 
    type: 'textNode', 
    position: { x: 100, y: 100 }, 
    data: { 
      label: '【範囲選択モード追加】\n\n上の矢印アイコンを押すと\nドラッグで範囲選択できます！\nまとめて削除も簡単です。',
      tags: ['selection']
    },
    style: { width: 300, height: 200 },
  },
];

const STORAGE_KEY = 'my-learning-canvas-data';

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition, deleteElements, toObject, setViewport, setCenter } = useReactFlow();
  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo();

  const [menu, setMenu] = useState(null);
  const [copiedNode, setCopiedNode] = useState(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  // ■ 選択中のノードリスト（削除ボタンの活性化に使用）
  const [selectedNodes, setSelectedNodes] = useState([]);
  
  // ■ 範囲選択モードかどうかのフラグ
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [matchedNodeIds, setMatchedNodeIds] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef(null);

  const connectingNodeId = useRef(null);
  const connectingHandleId = useRef(null);

  // 初期ロード
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const flowData = JSON.parse(savedData);
        if (flowData) {
          setNodes(flowData.nodes || []);
          setEdges(flowData.edges || []);
          if (flowData.viewport) setViewport(flowData.viewport);
        }
      } catch (e) {
        console.error("Load failed", e);
        setNodes(initialNodesDefault);
      }
    } else {
      setNodes(initialNodesDefault);
    }
  }, [setNodes, setEdges, setViewport]);

  // 自動保存
  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) return;
    const timer = setTimeout(() => {
      const flowData = { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flowData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

  // ■ 選択状態の監視 (単体用 & 複数用)
  useOnSelectionChange({
    onChange: ({ nodes: selectedNds }) => {
      // プロパティ編集用には「最後に選んだ1つ」をセット
      setSelectedNode(selectedNds.length > 0 ? selectedNds[selectedNds.length - 1] : null);
      // 削除ボタン用には「全選択リスト」をセット
      setSelectedNodes(selectedNds);
    },
  });

  const recordHistory = useCallback(() => { takeSnapshot(nodes, edges); }, [nodes, edges, takeSnapshot]);
  const handleUndo = useCallback(() => undo(nodes, edges, setNodes, setEdges), [undo, nodes, edges, setNodes, setEdges]);
  const handleRedo = useCallback(() => redo(nodes, edges, setNodes, setEdges), [redo, nodes, edges, setNodes, setEdges]);

  const applySearchStyle = useCallback((currentNodes, query) => {
    if (!query || !query.trim()) {
      setMatchedNodeIds([]);
      return currentNodes.map(n => ({
        ...n,
        style: { ...n.style, opacity: 1, border: n.selected ? '2px solid #3b82f6' : undefined }
      }));
    }
    const matches = [];
    const newNodes = currentNodes.map((node) => {
      const orGroups = query.split(/\s+OR\s+/i);
      const isMatch = orGroups.some((group) => {
        const andTerms = group.trim().split(/\s+/);
        return andTerms.every((term) => {
          if (term.startsWith('#')) {
            const tagQuery = term.slice(1).toLowerCase();
            const nodeTags = (node.data.tags || []).map(t => t.toLowerCase());
            return nodeTags.some(t => t.includes(tagQuery));
          }
          const text = (node.data.label || '').toLowerCase();
          return text.includes(term.toLowerCase());
        });
      });
      if (isMatch) matches.push(node.id);
      return {
        ...node,
        style: {
          ...node.style,
          opacity: isMatch ? 1 : 0.1,
          border: isMatch ? '3px solid #fbbf24' : (node.selected ? '2px solid #3b82f6' : undefined)
        }
      };
    });
    setMatchedNodeIds(matches);
    return newNodes;
  }, []);

  const handleSearch = useCallback((val) => {
    setSearchQuery(val);
    setNodes((nds) => applySearchStyle(nds, val));
    setCurrentMatchIndex(0);
  }, [setNodes, applySearchStyle]);

  const onTextChange = useCallback((id, text) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === id) {
          const newData = { ...node.data, label: text };
          if (selectedNode && selectedNode.id === id) setSelectedNode({ ...node, data: newData });
          return { ...node, data: newData };
        }
        return node;
      });
      return applySearchStyle(updatedNodes, searchQuery);
    });
  }, [setNodes, selectedNode, searchQuery, applySearchStyle]);

  const onTextEditStart = useCallback(() => { recordHistory(); }, [recordHistory]);

  const handleAddTag = useCallback((id, newTag) => {
    recordHistory();
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === id) {
          const currentTags = node.data.tags || [];
          if (!currentTags.includes(newTag)) {
            const newData = { ...node.data, tags: [...currentTags, newTag] };
            if (selectedNode && selectedNode.id === id) setSelectedNode({ ...node, data: newData });
            return { ...node, data: newData };
          }
        }
        return node;
      });
      return applySearchStyle(updatedNodes, searchQuery);
    });
  }, [setNodes, recordHistory, selectedNode, searchQuery, applySearchStyle]);

  const handleRemoveTagDirect = useCallback((id, tagToRemove) => {
    recordHistory();
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === id) {
          const newData = { ...node.data, tags: (node.data.tags || []).filter(t => t !== tagToRemove) };
          if (selectedNode && selectedNode.id === id) setSelectedNode({ ...node, data: newData });
          return { ...node, data: newData };
        }
        return node;
      });
      return applySearchStyle(updatedNodes, searchQuery);
    });
  }, [setNodes, recordHistory, selectedNode, searchQuery, applySearchStyle]);

  const handleClearAll = useCallback(() => {
    recordHistory();
    setNodes([]);
    setEdges([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [setNodes, setEdges, recordHistory]);

  const handleToggleHandles = useCallback((id) => { recordHistory(); setNodes((nds) => nds.map(n => n.id === id ? { ...n, data: { ...n.data, areHandlesHidden: !n.data.areHandlesHidden } } : n)); }, [setNodes, recordHistory]);
  
  const handleAddHandle = useCallback((id, side) => {
    recordHistory();
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        let handles = node.data.handles ? [...node.data.handles] : [
          { id: 'top', type: 'source', position: Position.Top, style: { left: '50%' } },
          { id: 'right', type: 'source', position: Position.Right, style: { top: '50%' } },
          { id: 'bottom', type: 'source', position: Position.Bottom, style: { left: '50%' } },
          { id: 'left', type: 'source', position: Position.Left, style: { top: '50%' } },
        ];
        let position;
        if (side === 'top') position = Position.Top; else if (side === 'bottom') position = Position.Bottom; else if (side === 'left') position = Position.Left; else if (side === 'right') position = Position.Right;
        const newHandleId = `${side}-${Date.now()}`;
        handles.push({ id: newHandleId, type: 'source', position, style: {} });
        const sideHandles = handles.filter(h => h.position === position);
        sideHandles.forEach((h, index) => {
            const percent = (100 / (sideHandles.length + 1)) * (index + 1);
            if (position === Position.Top || position === Position.Bottom) h.style = { left: `${percent}%` }; else h.style = { top: `${percent}%` };
        });
        return { ...node, data: { ...node.data, handles } };
      }
      return node;
    }));
  }, [setNodes, recordHistory]);

  const handleStyleChange = useCallback((id, key, value) => {
    recordHistory();
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === id) {
          const newData = { ...node.data };
          if (key === 'toggleBold') newData.isBold = !newData.isBold;
          else if (key === 'toggleUnderline') newData.isUnderline = !newData.isUnderline;
          else newData[key] = value;
          if (selectedNode && selectedNode.id === id) setSelectedNode({ ...node, data: newData });
          return { ...node, data: newData };
        }
        return node;
      });
      return applySearchStyle(updatedNodes, searchQuery);
    });
  }, [setNodes, recordHistory, selectedNode, searchQuery, applySearchStyle]);

  const handleAddNode = useCallback((position = null) => {
    recordHistory();
    const id = `${Date.now()}`;
    let finalPos = position ? screenToFlowPosition(position) : { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 };
    const newNode = { id, type: 'textNode', position: finalPos, data: { label: '新しいテキスト', tags: [] }, style: { width: 200, height: 100 } };
    setNodes((nds) => applySearchStyle(nds.concat(newNode), searchQuery));
  }, [screenToFlowPosition, setNodes, recordHistory, searchQuery, applySearchStyle]);

  const handleDelete = useCallback((id) => {
     recordHistory();
     const nodeToDelete = nodes.find(n => n.id === id);
     if (nodeToDelete) deleteElements({ nodes: [nodeToDelete] });
  }, [nodes, deleteElements, recordHistory]);

  // ■ 選択中のノードを削除する機能
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    recordHistory();
    deleteElements({ nodes: selectedNodes });
    // 削除後は選択解除
    setSelectedNodes([]);
    setSelectedNode(null);
  }, [selectedNodes, deleteElements, recordHistory]);

  const handleDuplicate = useCallback((id) => {
      recordHistory();
      const nodeToCopy = nodes.find(n => n.id === id);
      if (!nodeToCopy) return;
      const newNode = { ...nodeToCopy, id: `${Date.now()}`, position: { x: nodeToCopy.position.x + 20, y: nodeToCopy.position.y + 20 }, data: { ...nodeToCopy.data }, selected: false };
      setNodes(nds => applySearchStyle(nds.concat(newNode), searchQuery));
  }, [nodes, setNodes, recordHistory, searchQuery, applySearchStyle]);

  const handleCopy = useCallback((id) => {
      const targetId = id || nodes.find(n => n.selected)?.id;
      const node = nodes.find(n => n.id === targetId);
      if (node) setCopiedNode(node);
  }, [nodes]);

  const handlePaste = useCallback((position = null) => {
      if (!copiedNode) return;
      recordHistory();
      let pastePos = position ? screenToFlowPosition(position) : screenToFlowPosition(lastMousePos);
      const newNode = { ...copiedNode, id: `${Date.now()}`, position: pastePos, data: { ...copiedNode.data }, selected: true };
      setNodes(nds => applySearchStyle(nds.concat(newNode), searchQuery));
  }, [copiedNode, screenToFlowPosition, setNodes, lastMousePos, recordHistory, searchQuery, applySearchStyle]);

  const onNodeDragStart = useCallback(() => { recordHistory(); setMenu(null); }, [recordHistory]);
  const onNodeDragStop = useCallback(() => {}, []);
  const onConnectStart = useCallback((_, { nodeId, handleId }) => { connectingNodeId.current = nodeId; connectingHandleId.current = handleId; }, []);
  const onConnect = useCallback((params) => { recordHistory(); setEdges((eds) => addEdge(params, eds)); }, [setEdges, recordHistory]);
  const onConnectEnd = useCallback(() => { connectingNodeId.current = null; connectingHandleId.current = null; }, []);
  const onNodeContextMenu = useCallback((e, n) => { e.preventDefault(); setMenu({ type: 'node', id: n.id, top: e.clientY, left: e.clientX }); }, []);
  const onPaneContextMenu = useCallback((e) => { e.preventDefault(); setMenu({ type: 'pane', top: e.clientY, left: e.clientX }); }, []);
  const onPaneClick = useCallback(() => setMenu(null), []);
  const handleSave = useCallback(() => { const d = toObject(); const b = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = 'my-canvas.json'; document.body.appendChild(l); l.click(); document.body.removeChild(l); }, [toObject]);
  const handleLoad = useCallback((file) => { const r = new FileReader(); r.onload = (e) => { try { const d = JSON.parse(e.target.result); if(d){ setNodes(d.nodes||[]); setEdges(d.edges||[]); setViewport(d.viewport||{x:0,y:0,zoom:1}); } } catch(er){ alert('読込失敗'); } }; r.readAsText(file); }, [setNodes, setEdges, setViewport]);

  const nodeTypes = useMemo(() => ({
    textNode: (props) => (
      <TextNode 
        {...props} 
        data={{ ...props.data, onTextChange: onTextChange, onTextEditStart: onTextEditStart, onAddHandle: handleAddHandle, onRemoveTag: handleRemoveTagDirect }} 
      />
    ),
  }), [handleAddHandle, onTextChange, onTextEditStart, handleRemoveTagDirect]);

  const jumpToMatch = useCallback((index) => {
    if (matchedNodeIds.length === 0) return;
    const targetId = matchedNodeIds[index];
    const node = nodes.find(n => n.id === targetId);
    if (node) {
      setCenter(node.position.x + (parseInt(node.style?.width)||200)/2, node.position.y + (parseInt(node.style?.height)||100)/2, { zoom: 1.2, duration: 800 });
    }
  }, [matchedNodeIds, nodes, setCenter]);

  const handleNextSearch = () => { if (matchedNodeIds.length === 0) return; const nextIndex = (currentMatchIndex + 1) % matchedNodeIds.length; setCurrentMatchIndex(nextIndex); jumpToMatch(nextIndex); };
  const handlePrevSearch = () => { if (matchedNodeIds.length === 0) return; const prevIndex = (currentMatchIndex - 1 + matchedNodeIds.length) % matchedNodeIds.length; setCurrentMatchIndex(prevIndex); jumpToMatch(prevIndex); };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'f': e.preventDefault(); searchInputRef.current?.focus(); break;
          case 'z': if(!['INPUT','TEXTAREA'].includes(e.target.tagName)){ e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); } break;
          case 'y': if(!['INPUT','TEXTAREA'].includes(e.target.tagName)){ e.preventDefault(); handleRedo(); } break;
          case 'c': if(!['INPUT','TEXTAREA'].includes(e.target.tagName)){ e.preventDefault(); handleCopy(); } break;
          case 'v': if(!['INPUT','TEXTAREA'].includes(e.target.tagName)){ e.preventDefault(); handlePaste(); } break;
        }
      }
    };
    const handleMouseMove = (e) => setLastMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('mousemove', handleMouseMove); };
  }, [handleUndo, handleRedo, handleCopy, handlePaste]);

  const contextMenuTags = menu?.type === 'node' ? (nodes.find(n => n.id === menu.id)?.data?.tags || []) : [];

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MenuBar 
        onAddNode={() => handleAddNode()} onSave={handleSave} onLoad={handleLoad} 
        onUndo={handleUndo} onRedo={handleRedo} canUndo={canUndo} canRedo={canRedo}
        selectedNode={selectedNode} onStyleChange={handleStyleChange}
        onSearch={handleSearch}
        searchResultCount={matchedNodeIds.length}
        currentSearchIndex={currentMatchIndex}
        onNextSearch={handleNextSearch}
        onPrevSearch={handlePrevSearch}
        searchInputRef={searchInputRef}
        onClearAll={handleClearAll}
        // ■ モード・選択削除のProps
        isSelectionMode={isSelectionMode}
        onToggleSelectionMode={setIsSelectionMode}
        onDeleteSelected={handleDeleteSelected}
        hasSelection={selectedNodes.length > 0}
      />
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} nodeTypes={nodeTypes} fitView
        onNodeContextMenu={onNodeContextMenu} onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick} onNodeDragStart={onNodeDragStart} onNodeDragStop={onNodeDragStop}
        connectionMode={ConnectionMode.Loose}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        // ■ モード切り替え設定
        // 移動モード(false): panOnDrag=true, selectionOnDrag=false
        // 選択モード(true): panOnDrag=false, selectionOnDrag=true
        panOnDrag={!isSelectionMode}
        selectionOnDrag={isSelectionMode}
        // 選択モード中のカーソル変更
        panOnScroll={true}
      >
        <Background variant="dots" gap={16} size={1} />
        <Controls />
        <MiniMap style={{ height: 100, width: 150 }} zoomable pannable />
        
        {menu && (
          <ContextMenu {...menu} onClose={() => setMenu(null)}
            onDelete={handleDelete} onDuplicate={handleDuplicate}
            onCopy={handleCopy} onPaste={handlePaste} onAddNode={handleAddNode}
            onStyleChange={handleStyleChange}
            onToggleHandles={handleToggleHandles}
            onAddHandle={handleAddHandle}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTagDirect}
            tags={contextMenuTags}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}