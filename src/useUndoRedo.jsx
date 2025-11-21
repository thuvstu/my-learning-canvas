import { useState, useCallback } from 'react';

export const useUndoRedo = (initialNodes, initialEdges) => {
  // 過去の履歴、現在の状態、未来の履歴（やり直し用）
  // 履歴の一つ一つは { nodes: [], edges: [] } というオブジェクト
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // 履歴に「今の状態」を記録する関数
  // 操作が終わったタイミング（ドラッグ終了、テキスト編集終了など）で呼びます
  const takeSnapshot = useCallback((nodes, edges) => {
    setPast((oldPast) => {
      // 履歴が多すぎるとメモリを食うので、最新50件くらいに制限してもいいですが
      // 今回はシンプルにすべて保存します
      return [...oldPast, { nodes, edges }];
    });
    // 新しい操作をしたので、「やり直し（未来）」はクリアする
    setFuture([]);
  }, []);

  // 元に戻す (Undo)
  const undo = useCallback((currentNodes, currentEdges, setNodes, setEdges) => {
    setPast((oldPast) => {
      if (oldPast.length === 0) return oldPast; // 履歴がない

      const previousState = oldPast[oldPast.length - 1];
      const newPast = oldPast.slice(0, oldPast.length - 1);

      // 現在の状態を「未来」に入れておく（Redoできるように）
      setFuture((oldFuture) => [...oldFuture, { nodes: currentNodes, edges: currentEdges }]);

      // 状態を復元
      setNodes(previousState.nodes);
      setEdges(previousState.edges);

      return newPast;
    });
  }, []);

  // やり直し (Redo)
  const redo = useCallback((currentNodes, currentEdges, setNodes, setEdges) => {
    setFuture((oldFuture) => {
      if (oldFuture.length === 0) return oldFuture; // 未来がない

      const nextState = oldFuture[oldFuture.length - 1];
      const newFuture = oldFuture.slice(0, oldFuture.length - 1);

      // 現在の状態を「過去」に入れておく（再度Undoできるように）
      setPast((oldPast) => [...oldPast, { nodes: currentNodes, edges: currentEdges }]);

      // 状態を復元
      setNodes(nextState.nodes);
      setEdges(nextState.edges);

      return newFuture;
    });
  }, []);

  return {
    takeSnapshot,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
};