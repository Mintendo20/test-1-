import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Award, Coins, Gem, Home, Move, User, ZoomIn, ZoomOut } from 'lucide-react';
import { useLifeOS } from '../state/LifeOSContext';
import { calculateLevelFromXp } from '../domain/kaizenEngine';
import type { IslandObject } from '../domain/types';

interface LifeWorldScreenProps {
  onBack: () => void;
}

const GRID_SIZE = 8;

export function LifeWorldScreen({ onBack }: LifeWorldScreenProps) {
  const {
    state,
    unlockAndPlaceIslandObject,
    moveIslandObject,
    unlockTerritory,
    updateCharacterAppearance,
  } = useLifeOS();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1.05);
  const [pan, setPan] = useState({ x: 0, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const didDragRef = useRef(false);
  const [selectedObjId, setSelectedObjId] = useState<string | null>('obj_cottage');
  const [movingObjId, setMovingObjId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<'build' | 'character' | 'achievements'>('build');
  const [notice, setNotice] = useState<string | null>(null);

  const levelInfo = calculateLevelFromXp(state.character.xp);
  const selectedObj = state.islandObjects.find((o) => o.id === selectedObjId) ?? null;

  // Isometric helpers
  const tileW = 72 * zoom;
  const tileH = 36 * zoom;

  const gridToScreen = (gx: number, gy: number, cw: number, ch: number) => {
    const originX = cw / 2 + pan.x;
    const originY = ch * 0.25 + pan.y;
    const sx = originX + (gx - gy) * (tileW / 2);
    const sy = originY + (gx + gy) * (tileH / 2);
    return { sx, sy };
  };

  const screenToGrid = (px: number, py: number, cw: number, ch: number) => {
    const originX = cw / 2 + pan.x;
    const originY = ch * 0.25 + pan.y;
    const dx = px - originX;
    const dy = py - originY;
    const gx = Math.floor((dx / (tileW / 2) + dy / (tileH / 2)) / 2);
    const gy = Math.floor((dy / (tileH / 2) - dx / (tileW / 2)) / 2);
    return { gx, gy };
  };

  // Render cozy 2.5D isometric nature island
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId = 0;
    let startTime = performance.now();

    const draw = (now: number) => {
      const t = (now - startTime) / 1000;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      const cw = rect.width;
      const ch = rect.height;

      // Sky gradient (serene nature atmosphere)
      const sky = ctx.createLinearGradient(0, 0, 0, ch);
      sky.addColorStop(0, '#DDF3EC');
      sky.addColorStop(0.55, '#BFE5DC');
      sky.addColorStop(1, '#8CC7C0');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cw, ch);

      // Soft drifting clouds
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      for (let i = 0; i < 3; i++) {
        const cx = ((t * (10 + i * 4) + i * 260) % (cw + 200)) - 100;
        const cy = 50 + i * 38;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.arc(cx + 22, cy - 6, 20, 0, Math.PI * 2);
        ctx.arc(cx + 42, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      const riverUnlocked = state.islandTerritories.find((tr) => tr.id === 'ter_river')?.unlocked;
      const hillUnlocked = state.islandTerritories.find((tr) => tr.id === 'ter_hill')?.unlocked;

      // Draw 8x8 isometric tiles + cliff depth
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        for (let gy = 0; gy < GRID_SIZE; gy++) {
          const { sx, sy } = gridToScreen(gx, gy, cw, ch);
          const isRiver = gx === 6 || (gy === 6 && gx >= 3);
          const isHill = gx <= 1 && gy <= 2;

          let topColor = (gx + gy) % 2 === 0 ? '#7EC882' : '#74BE78';
          if (isRiver) topColor = riverUnlocked ? '#55B4D4' : '#94A3B8';
          else if (isHill && !hillUnlocked) topColor = '#CBD5E1';
          else if (isHill) topColor = '#8AD27D';

          const elev = isHill && hillUnlocked ? -8 * zoom : isRiver && riverUnlocked ? 3 * zoom : 0;

          // Cliff sides for outer edge
          if (gx === GRID_SIZE - 1 || gy === GRID_SIZE - 1) {
            const cliffH = 18 * zoom;
            ctx.fillStyle = '#9C7A54';
            ctx.beginPath();
            ctx.moveTo(sx, sy + tileH + elev);
            ctx.lineTo(sx + tileW / 2, sy + tileH / 2 + elev);
            ctx.lineTo(sx + tileW / 2, sy + tileH / 2 + elev + cliffH);
            ctx.lineTo(sx, sy + tileH + elev + cliffH);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#B48D64';
            ctx.beginPath();
            ctx.moveTo(sx, sy + tileH + elev);
            ctx.lineTo(sx - tileW / 2, sy + tileH / 2 + elev);
            ctx.lineTo(sx - tileW / 2, sy + tileH / 2 + elev + cliffH);
            ctx.lineTo(sx, sy + tileH + elev + cliffH);
            ctx.closePath();
            ctx.fill();
          }

          // Top diamond
          ctx.fillStyle = topColor;
          ctx.beginPath();
          ctx.moveTo(sx, sy + elev);
          ctx.lineTo(sx + tileW / 2, sy + tileH / 2 + elev);
          ctx.lineTo(sx, sy + tileH + elev);
          ctx.lineTo(sx - tileW / 2, sy + tileH / 2 + elev);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Gentle water ripple
          if (isRiver && riverUnlocked) {
            ctx.strokeStyle = 'rgba(255,255,255,0.45)';
            ctx.beginPath();
            const rippleOffset = Math.sin(t * 2 + gx + gy) * 3;
            ctx.moveTo(sx - 8 * zoom, sy + tileH / 2 + rippleOffset);
            ctx.lineTo(sx + 8 * zoom, sy + tileH / 2 + rippleOffset);
            ctx.stroke();
          }
        }
      }

      // Sort unlocked objects by isometric depth (gx + gy)
      const visibleObjects = state.islandObjects
        .filter((o) => o.unlocked)
        .sort((a, b) => a.gridX + a.gridY - (b.gridX + b.gridY));

      for (const obj of visibleObjects) {
        const { sx, sy } = gridToScreen(obj.gridX, obj.gridY, cw, ch);
        const cx = sx;
        const cy = sy + tileH / 2;
        const isSelected = obj.id === selectedObjId;

        if (isSelected) {
          ctx.strokeStyle = '#0F766E';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 4 * zoom, 22 * zoom, 11 * zoom, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        drawIslandObject(ctx, obj, cx, cy, zoom, t);
      }

      // Draw customizable animated character walking gently on open plaza in front of house (3.8, 5.1)
      const walkX = 3.8 + Math.sin(t * 0.65) * 0.35;
      const walkY = 5.1 + Math.cos(t * 0.5) * 0.25;
      const charPos = gridToScreen(walkX, walkY, cw, ch);
      const bob = Math.abs(Math.sin(t * 3.5)) * 2.5 * zoom;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(charPos.sx, charPos.sy + tileH / 2, 10 * zoom, 5 * zoom, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (outfit)
      ctx.fillStyle = state.character.outfitColor;
      ctx.beginPath();
      ctx.roundRect(charPos.sx - 7 * zoom, charPos.sy + tileH / 2 - 22 * zoom - bob, 14 * zoom, 16 * zoom, 4 * zoom);
      ctx.fill();

      // Head
      ctx.fillStyle = state.character.skinTone;
      ctx.beginPath();
      ctx.arc(charPos.sx, charPos.sy + tileH / 2 - 28 * zoom - bob, 7.5 * zoom, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = state.character.hairColor;
      ctx.beginPath();
      ctx.arc(charPos.sx, charPos.sy + tileH / 2 - 30 * zoom - bob, 7.8 * zoom, Math.PI, Math.PI * 2);
      ctx.fill();

      // Name label above character with crisp frosted backdrop for legibility
      const labelText = `${state.character.name} · Рів. ${levelInfo.level}`;
      ctx.font = `600 ${Math.round(11 * zoom)}px "Plus Jakarta Sans", sans-serif`;
      const textWidth = ctx.measureText(labelText).width;
      const badgeW = textWidth + 14 * zoom;
      const badgeH = 20 * zoom;
      const badgeX = charPos.sx - badgeW / 2;
      const badgeY = charPos.sy + tileH / 2 - 58 * zoom - bob;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6 * zoom);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, charPos.sx, badgeY + badgeH / 2);

      ctx.restore();
      rafId = window.requestAnimationFrame(draw);
    };

    rafId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(rafId);
  }, [zoom, pan, state.islandObjects, state.islandTerritories, state.character, selectedObjId, levelInfo.level]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const { gx, gy } = screenToGrid(px, py, rect.width, rect.height);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return;

    if (movingObjId) {
      moveIslandObject(movingObjId, gx, gy);
      setNotice(`Об’єкт переміщено на клітинку (${gx + 1}, ${gy + 1})`);
      setMovingObjId(null);
      return;
    }

    const hit = state.islandObjects.find((o) => o.unlocked && o.gridX === gx && o.gridY === gy);
    if (hit) {
      setSelectedObjId(hit.id);
      setNotice(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top HUD */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>
          <div>
            <h1 className="text-base font-bold">Життєвий світ — Life World</h1>
            <p className="text-xs text-slate-400 font-mono tabular-nums">
              Рівень {levelInfo.level} · {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} XP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
            <Coins className="w-4 h-4" />
            {state.gameCurrency.coins}
          </span>
          <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold">
            <Gem className="w-4 h-4" />
            {state.gameCurrency.crystals}
          </span>
        </div>
      </header>

      {/* Main Split: 2.5D Island Canvas + Cozy Builder/Character Drawer */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 relative min-h-[420px] lg:min-h-[calc(100vh-56px)] overflow-hidden">
          <canvas
            ref={canvasRef}
            data-testid="life-world-canvas"
            onMouseDown={(e) => {
              setDragging(true);
              didDragRef.current = false;
              dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
            }}
            onMouseMove={(e) => {
              if (!dragging) return;
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              if (Math.hypot(dx, dy) > 5) didDragRef.current = true;
              setPan({
                x: dragStartRef.current.panX + dx,
                y: dragStartRef.current.panY + dy,
              });
            }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onClick={handleCanvasClick}
            className="w-full h-full block cursor-grab active:cursor-grabbing"
          />

          {/* Camera Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-700 rounded-xl p-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
              aria-label="Зменшити масштаб"
              className="p-2 rounded-lg hover:bg-slate-800"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-1">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.8, Number((z + 0.15).toFixed(2))))}
              aria-label="Збільшити масштаб"
              className="p-2 rounded-lg hover:bg-slate-800"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Object Floating Info */}
          {selectedObj && (
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-3.5 max-w-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">{selectedObj.name}</h2>
                <button
                  type="button"
                  onClick={() =>
                    setMovingObjId(movingObjId === selectedObj.id ? null : selectedObj.id)
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                >
                  <Move className="w-3.5 h-3.5" />
                  {movingObjId === selectedObj.id ? 'Клікніть клітинку' : 'Перемістити'}
                </button>
              </div>
              <p className="text-xs text-slate-300">{selectedObj.description}</p>
            </div>
          )}

          {notice && (
            <div className="absolute top-4 right-4 bg-teal-600 text-white text-xs font-medium px-3.5 py-2 rounded-xl shadow-lg">
              {notice}
            </div>
          )}
        </div>

        {/* Right Side Control Panel */}
        <aside className="lg:col-span-4 bg-slate-900 border-l border-slate-800 p-5 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setDrawerTab('build')}
              className={`inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg ${
                drawerTab === 'build' ? 'bg-slate-950 text-white' : 'text-slate-400'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Острів
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('character')}
              className={`inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg ${
                drawerTab === 'character' ? 'bg-slate-950 text-white' : 'text-slate-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Персонаж
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('achievements')}
              className={`inline-flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg ${
                drawerTab === 'achievements' ? 'bg-slate-950 text-white' : 'text-slate-400'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Нагороди
            </button>
          </div>

          {drawerTab === 'build' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Об’єкти острова</h3>
                <ul className="space-y-2.5">
                  {state.islandObjects.map((obj) => (
                    <li
                      key={obj.id}
                      className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{obj.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {obj.unlocked
                            ? `Розміщено (${obj.gridX + 1}, ${obj.gridY + 1})`
                            : `${obj.costCoins} монет · ${obj.costCrystals} крист.`}
                        </p>
                      </div>
                      {obj.unlocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedObjId(obj.id);
                            setMovingObjId(obj.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-600 text-xs font-medium hover:bg-slate-700"
                        >
                          Перемістити
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const ok = unlockAndPlaceIslandObject(obj.id, obj.gridX, obj.gridY);
                            if (ok) setNotice(`Відкрито та збудовано: ${obj.name}`);
                            else setNotice('Недостатньо монет або кристалів — виконуйте цілі Kaizen!');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-500"
                        >
                          Збудувати
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-2">Території острова</h3>
                <ul className="space-y-2">
                  {state.islandTerritories.map((ter) => (
                    <li
                      key={ter.id}
                      className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{ter.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {ter.unlocked ? 'Відкрито' : `Рівень ${ter.requiredLevel} · ${ter.costCoins} монет`}
                        </p>
                      </div>
                      {!ter.unlocked && (
                        <button
                          type="button"
                          onClick={() => {
                            const ok = unlockTerritory(ter.id);
                            setNotice(ok ? `Відкрито територію: ${ter.name}` : 'Потрібно більше монет або кристалів.');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold"
                        >
                          Відкрити
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {drawerTab === 'character' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Шість характеристик (з реальних досягнень)
                </h3>
                <div className="space-y-2.5">
                  {(
                    [
                      ['career', 'Кар’єра'],
                      ['physical', 'Фізична форма'],
                      ['intellect', 'Інтелект'],
                      ['discipline', 'Дисципліна'],
                      ['social', 'Соціальність'],
                      ['balance', 'Баланс і відпочинок'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{label}</span>
                        <span className="font-mono text-teal-400">{state.character.stats[key]}/100</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{ width: `${state.character.stats[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h3 className="text-sm font-semibold text-white">Зовнішність і одяг</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Костюм</label>
                    <select
                      value={state.character.outfit}
                      onChange={(e) =>
                        updateCharacterAppearance({
                          outfit: e.target.value as typeof state.character.outfit,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700"
                    >
                      <option value="explorer">Мандрівник</option>
                      <option value="minimal">Мінімал</option>
                      <option value="scholar">Дослідник</option>
                      <option value="athlete">Атлет</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Колір одягу</label>
                    <input
                      type="color"
                      value={state.character.outfitColor}
                      onChange={(e) => updateCharacterAppearance({ outfitColor: e.target.value })}
                      className="w-full h-8 rounded-lg bg-slate-800 border border-slate-700"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  У Life World немає штучних потреб (голоду чи спраги) — персонаж відображає лише реальний розвиток.
                </p>
              </div>
            </div>
          )}

          {drawerTab === 'achievements' && (
            <ul className="space-y-3">
              {state.achievements.map((ach) => (
                <li
                  key={ach.id}
                  className={`p-3 rounded-xl border ${
                    ach.unlocked
                      ? 'bg-emerald-950/30 border-emerald-700/50'
                      : 'bg-slate-800/50 border-slate-700/60 opacity-75'
                  }`}
                >
                  <p className="text-xs font-semibold text-white">{ach.title}</p>
                  <p className="text-[11px] text-slate-300 mt-1">{ach.description}</p>
                  <p className="text-[11px] font-mono text-amber-300 mt-1.5">
                    Нагорода: {ach.rewardCoins} монет · {ach.rewardCrystals} крист.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function drawIslandObject(
  ctx: CanvasRenderingContext2D,
  obj: IslandObject,
  cx: number,
  cy: number,
  zoom: number,
  t: number,
) {
  const s = zoom;
  if (obj.kind === 'cottage' || obj.kind === 'library' || obj.kind === 'gym_pavilion' || obj.kind === 'tea_house') {
    const wallColor =
      obj.kind === 'library'
        ? '#E6D7B9'
        : obj.kind === 'gym_pavilion'
          ? '#D1E7DD'
          : obj.kind === 'tea_house'
            ? '#F3E5D0'
            : '#F5EFE6';
    const roofColor =
      obj.kind === 'library'
        ? '#2B5B84'
        : obj.kind === 'gym_pavilion'
          ? '#0F766E'
          : obj.kind === 'tea_house'
            ? '#B45309'
            : '#C2593F';

    // House walls
    ctx.fillStyle = wallColor;
    ctx.beginPath();
    ctx.rect(cx - 18 * s, cy - 24 * s, 36 * s, 24 * s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.stroke();

    // Pitched cozy roof
    ctx.fillStyle = roofColor;
    ctx.beginPath();
    ctx.moveTo(cx - 22 * s, cy - 24 * s);
    ctx.lineTo(cx, cy - 42 * s);
    ctx.lineTo(cx + 22 * s, cy - 24 * s);
    ctx.closePath();
    ctx.fill();

    // Door
    ctx.fillStyle = '#6B4423';
    ctx.fillRect(cx - 4 * s, cy - 12 * s, 8 * s, 12 * s);
  } else if (obj.kind === 'garden_tree') {
    const sway = Math.sin(t * 1.5 + obj.gridX) * 1.5 * s;
    ctx.fillStyle = '#6B4423';
    ctx.fillRect(cx - 3 * s, cy - 16 * s, 6 * s, 16 * s);
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.arc(cx + sway, cy - 24 * s, 14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(cx - 4 * s + sway, cy - 28 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Flower bed / decoration
    const colors = ['#F472B6', '#FBBF24', '#60A5FA'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(cx + (i - 1) * 7 * s, cy - 4 * s, 3.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
