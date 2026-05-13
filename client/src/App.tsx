import React, { useState, useEffect } from 'react';

// --- 型定義 ---
type Role = 'Werewolf' | 'Seer' | 'Villager';
type Phase = 'Setup' | 'RoleConfirm' | 'Night' | 'Morning' | 'Discussion' | 'Result';

interface Player {
  id: string;
  name: string;
  role: Role;
  isAlive: boolean;
  memo: string;
}

interface SharedLog {
  id: string;
  sender: string;
  content: string;
  variant: 'attack' | 'divine' | 'system';
}

export default function WerewolfGame() {
  // --- ステート管理 ---
  const [phase, setPhase] = useState<Phase>('Setup');
  const [dayCount, setDayCount] = useState(1);
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', name: 'あなた(占い師)', role: 'Seer', isAlive: true, memo: '' },
    { id: '2', name: 'じろう', role: 'Werewolf', isAlive: true, memo: '' },
    { id: '3', name: 'さぶろう', role: 'Villager', isAlive: true, memo: '' },
    { id: '4', name: 'しろう', role: 'Villager', isAlive: true, memo: '' },
    { id: '5', name: 'ごろう', role: 'Werewolf', isAlive: true, memo: '' },
  ]);
  const [logs, setLogs] = useState<SharedLog[]>([]);
  const [winner, setWinner] = useState<'Villagers' | 'Werewolves' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempMemo, setTempMemo] = useState("");

  // --- ゲームロジック ---

  // システムログ追加
  const addLog = (content: string, variant: 'attack' | 'divine' | 'system', sender: string = "SYSTEM") => {
    const newLog: SharedLog = { id: Math.random().toString(), sender, content, variant };
    setLogs(prev => [newLog, ...prev]);
  };

  // 勝敗判定 (useEffectで監視)
  useEffect(() => {
    const alive = players.filter(p => p.isAlive);
    const wolves = alive.filter(p => p.role === 'Werewolf').length;
    const villagers = alive.length - wolves;

    if (wolves === 0) {
      setWinner('Villagers');
      setPhase('Result');
    } else if (wolves >= villagers || dayCount > 7) {
      setWinner('Werewolves');
      setPhase('Result');
    }
  }, [players, dayCount]);

  // 夜のアクション：占い
  const executeDivination = (target: Player) => {
    const result = target.role === 'Werewolf' ? '人狼 🐺' : '人間 👤';
    addLog(`${target.name} を占いました。結果は【${result}】です。`, 'divine', '占い師(あなた)');
    
    // デモ用：同時に人狼が「さぶろう(3)」を襲撃したと仮定
    setTimeout(() => handleNightEnd("3"), 500);
  };

  // 夜の終了（襲撃結果の反映）
  const handleNightEnd = (victimId: string) => {
    const victim = players.find(p => p.id === victimId);
    if (victim) {
      setPlayers(prev => prev.map(p => p.id === victimId ? { ...p, isAlive: false } : p));
      addLog(`昨晩、${victim.name} さんが無惨な姿で発見されました。`, 'attack');
    }
    setPhase('Morning');
  };

  // 推理の共有
  const shareMemo = () => {
    if (editingId && tempMemo) {
      const target = players.find(p => p.id === editingId);
      addLog(`${target?.name}への推理：${tempMemo}`, 'system', 'あなた');
      setPlayers(prev => prev.map(p => p.id === editingId ? { ...p, memo: tempMemo } : p));
      setEditingId(null);
      setTempMemo("");
    }
  };

  // --- UIコンポーネント ---

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-200 p-4 font-sans transition-colors duration-1000 ${
      winner === 'Villagers' ? 'bg-blue-900/20' : winner === 'Werewolves' ? 'bg-red-900/20' : ''
    }`}>
      
      {/* 勝利演出オーバーレイ */}
      {phase === 'Result' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in zoom-in duration-500">
          <div className="text-center">
            <div className={`w-32 h-32 mx-auto mb-6 rounded-full animate-ping ${winner === 'Villagers' ? 'bg-blue-500' : 'bg-red-600'}`} />
            <h1 className={`text-6xl font-black mb-4 ${winner === 'Villagers' ? 'text-blue-400' : 'text-red-500'}`}>
              {winner === 'Villagers' ? 'VILLAGERS WIN' : 'WEREWOLVES WIN'}
            </h1>
            <p className="text-slate-400 mb-8 italic">すべての真実が明らかになりました...</p>
            <button onClick={() => window.location.reload()} className="px-10 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition">もう一度プレイ</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* メイン操作パネル */}
        <div className="flex-1">
          <header className="mb-8 border-b border-slate-800 pb-4">
            <h1 className="text-2xl font-black text-indigo-500 tracking-widest">WEREWOLF ULTIMATE</h1>
            <p className="text-xs text-slate-500 font-mono">DAY {dayCount} / PHASE: {phase}</p>
          </header>

          {/* プレイヤー一覧 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {players.map(p => (
              <div key={p.id} className={`p-4 rounded-2xl border-2 transition-all ${p.isAlive ? 'border-slate-800 bg-slate-900' : 'border-red-900 bg-black opacity-40'}`}>
                <div className="font-bold flex justify-between items-center">
                  {p.name}
                  {p.id === '1' && <span className="text-[8px] bg-indigo-600 px-1 rounded">YOU</span>}
                </div>
                {p.isAlive ? (
                  <button 
                    onClick={() => { setEditingId(p.id); setTempMemo(p.memo); }}
                    className="mt-3 w-full py-1 text-[10px] bg-slate-800 hover:bg-indigo-600 rounded-lg transition"
                  >
                    🔍 推理メモ/共有
                  </button>
                ) : (
                  <div className="mt-3 text-center text-red-600 text-[10px] font-bold">DEAD</div>
                )}
                {p.memo && <div className="mt-2 text-[10px] text-indigo-400 italic truncate">"{p.memo}"</div>}
              </div>
            ))}
          </div>

          {/* フェーズごとのアクションエリア */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
            {phase === 'Setup' && (
              <button onClick={() => setPhase('Night')} className="bg-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-indigo-500 transition">ゲーム開始</button>
            )}

            {phase === 'Night' && (
              <div>
                <h2 className="text-xl font-bold text-indigo-400 mb-4">🌙 夜の行動：占い</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {players.filter(p => p.id !== '1' && p.isAlive).map(p => (
                    <button key={p.id} onClick={() => executeDivination(p)} className="px-4 py-2 bg-indigo-900/50 border border-indigo-500/50 rounded-xl hover:bg-indigo-500 transition">
                      {p.name} を占う
                    </button>
                  ))}
                </div>
              </div>
            )}

            {phase === 'Morning' && (
              <div>
                <h2 className="text-2xl font-bold text-orange-400 mb-6">☀️ 朝が来ました</h2>
                <button onClick={() => setPhase('Discussion')} className="bg-orange-600 px-8 py-3 rounded-full font-bold hover:bg-orange-500 transition">議論を開始する</button>
              </div>
            )}

            {phase === 'Discussion' && (
              <div>
                <h2 className="text-xl font-bold mb-4">🗣️ 議論中</h2>
                <p className="text-sm text-slate-400 mb-6">推理を共有し、怪しい人を絞り込みましょう。</p>
                <button onClick={() => { setDayCount(d => d + 1); setPhase('Night'); }} className="text-xs text-slate-500 underline">議論を終えて次の夜へ</button>
              </div>
            )}
          </div>
        </div>

        {/* 議論ログ（右サイドバー） */}
        <div className="w-full md:w-80 h-[600px] bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-inner">
          <h2 className="text-xs font-black text-slate-500 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            INTELLIGENCE LOG
          </h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {logs.map(log => (
              <div key={log.id} className={`p-3 rounded-xl border-l-4 animate-in slide-in-from-right duration-300 ${
                log.variant === 'attack' ? 'bg-red-950/30 border-red-600 text-red-200' : 
                log.variant === 'divine' ? 'bg-indigo-950/30 border-indigo-400 text-indigo-100' : 
                'bg-slate-800/50 border-slate-600 text-slate-300'
              }`}>
                <div className="text-[8px] font-bold uppercase opacity-50 mb-1">{log.sender}</div>
                <p className="text-xs leading-relaxed font-medium">{log.content}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 推理共有モーダル */}
      {editingId && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl w-full max-w-sm">
            <h3 className="font-bold mb-4">推理を共有</h3>
            <textarea 
              className="w-full h-24 bg-slate-800 rounded-xl p-3 text-sm focus:ring-1 ring-indigo-500 outline-none mb-4"
              value={tempMemo}
              onChange={(e) => setTempMemo(e.target.value)}
              placeholder="例：発言が不自然。狼の可能性あり。"
            />
            <div className="flex gap-2">
              <button onClick={shareMemo} className="flex-1 bg-indigo-600 py-2 rounded-lg font-bold">共有する</button>
              <button onClick={() => setEditingId(null)} className="flex-1 bg-slate-700 py-2 rounded-lg">閉じる</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}