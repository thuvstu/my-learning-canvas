import React, { useCallback, useMemo, useState } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TextNode from './TextNode';
import MenuBar from './MenuBar';
import ContextMenu from './ContextMenu';

// 初期データは空でもいいですが、わかりやすく1つ残しておきます
const initialNodes = [
  { 
    id: '1', 
    type: 'textNode', 
    position: { x: 100, y: 100 }, 
    data: { label: '保存機能を実装したよ！\n上の「保存」ボタンで\nデータをダウンロードできるよ' },
    style: { width: 220, height: 120 },
  },
];
const initialEdges = [];

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // toObject: 現在の全データを取得する関数
  // setViewport: 画面のズームや位置をセットする関数
  const { screenToFlowPosition, deleteElements, toObject, setViewport } = useReactFlow();

  const [menu, setMenu] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const nodeTypes = useMemo(() => ({ textNode: TextNode }), []);

  const handleAddNode = () => {
    const id = `${Date.now()}`;
    const newNode = {
      id,
      type: 'textNode',
      position: { 
        x: Math.random() * 200 + 100, 
        y: Math.random() * 200 + 100 
      },
      data: { label: '新しいテキスト', color: '#ffffff' },
      style: { width: 200, height: 100 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // ■ 保存機能の実装
  const handleSave = useCallback(() => {
    // 1. 現在の状態をオブジェクトとして取得
    const flowData = toObject();
    
    // 2. JSON文字列に変換
    const jsonString = JSON.stringify(flowData, null, 2); // 見やすく整形
    
    // 3. ダウンロード用リンクを作成してクリックさせる
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-canvas.json'; // 保存するファイル名
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    

  }, [toObject]);

  // ■ 読込機能の実装
  const handleLoad = useCallback((file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        // 1. ファイルの中身を読み取ってJSONに戻す
        const flowData = JSON.parse(event.target.result);

        // 2. データが正しいか軽くチェック
        if (flowData) {
          const { nodes: newNodes = [], edges: newEdges = [], viewport = { x: 0, y: 0, zoom: 1 } } = flowData;
          
          // 3. データをセット
          setNodes(newNodes);
          setEdges(newEdges);
          setViewport(viewport); // 画面の位置も復元

          alert('読み込み完了！');
        }
      } catch (error) {
        console.error(error);
        alert('ファイルの読み込みに失敗しました。\n正しいJSONファイルか確認してください。');
      }
    };

    // テキストとして読み込む
    reader.readAsText(file);
  }, [setNodes, setEdges, setViewport]);

  // コンテキストメニュー周りはそのまま
  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
      });
    },
    []
  );

  const onPaneClick = useCallback(() => setMenu(null), []);

  const handleDelete = useCallback((id) => {
    const nodeToDelete = nodes.find((n) => n.id === id);
    if (nodeToDelete) {
      deleteElements({ nodes: [nodeToDelete] });
    }
  }, [nodes, deleteElements]);

  const handleDuplicate = useCallback((id) => {
    const nodeToCopy = nodes.find((n) => n.id === id);
    if (!nodeToCopy) return;

    const newNode = {
      ...nodeToCopy,
      id: `${Date.now()}`,
      position: {
        x: nodeToCopy.position.x + 20,
        y: nodeToCopy.position.y + 20,
      },
      data: { ...nodeToCopy.data },
      selected: false,
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes]);

  const handleColorChange = useCallback((id, color) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, color: color } };
        }
        return node;
      })
    );
  }, [setNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* 保存と読込関数を渡す */}
      <MenuBar 
        onAddNode={handleAddNode} 
        onSave={handleSave} 
        onLoad={handleLoad} 
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onNodeDragStart={onPaneClick}
      >
        <Background variant="dots" gap={16} size={1} />
        <Controls />
        <MiniMap style={{ height: 100, width: 150 }} zoomable pannable />
        
        {menu && (
          <ContextMenu
            onClick={onPaneClick}
            {...menu}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onColorChange={handleColorChange}
            onClose={() => setMenu(null)}
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