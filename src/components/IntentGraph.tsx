// ═══════════════════════════════════════════════════════════════════════
// INTENT GRAPH — Visual NiyahEngine Intent Tracking
// خارطة النية — تصور تتبع النية
// ═══════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Network } from 'lucide-react';
import { niyahEngine, type IntentGraphData, type IntentGraphNode } from '../engine/NiyahEngine';
import { useAI } from '../store';

// ── Domain Colors ─────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  code:           '#d4af37',
  content:        '#4488ff',
  security:       '#ff4444',
  infrastructure: '#ff8800',
  creative:       '#cc44ff',
  business:       '#00ccff',
  education:      '#00ff41',
  datascience:    '#ffcc00',
  general:        '#606060',
};

// ── Canvas Graph Renderer ─────────────────────────────────────────────

function drawGraph(
  canvas: HTMLCanvasElement,
  data: IntentGraphData,
  hoveredNode: IntentGraphNode | null
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = 'rgba(212,175,55,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  if (data.nodes.length === 0) {
    ctx.fillStyle = 'rgba(212,175,55,0.3)';
    ctx.font = '13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ابدأ محادثة لرؤية خارطة النية', width / 2, height / 2);
    return;
  }

  // Compute positions (force-directed layout approximation)
  const positions = computePositions(data.nodes, width, height);

  // Draw edges
  for (const edge of data.edges) {
    const fromPos = positions.get(edge.source);
    const toPos = positions.get(edge.target);
    if (!fromPos || !toPos) continue;

    const alpha = edge.strength * 0.6;
    ctx.strokeStyle = `rgba(212,175,55,${alpha})`;
    ctx.lineWidth = edge.strength * 2;
    ctx.setLineDash(edge.type === 'temporal' ? [3, 5] : []);

    ctx.beginPath();
    ctx.moveTo(fromPos.x, fromPos.y);
    ctx.lineTo(toPos.x, toPos.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw nodes
  for (const node of data.nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;

    const color = DOMAIN_COLORS[node.domain] ?? '#606060';
    const radius = Math.max(6, node.confidence * 12 + 4);
    const isHovered = hoveredNode?.id === node.id;

    // Glow effect
    if (isHovered || node.alignment >= 80) {
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 2.5);
      gradient.addColorStop(0, `${color}44`);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? color : `${color}cc`;
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#ffffff' : color;
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.stroke();

    // Label on hover or recent
    if (isHovered || data.nodes.indexOf(node) >= data.nodes.length - 3) {
      const label = node.label.slice(0, 24);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';

      // Label background
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(5,5,5,0.85)';
      ctx.fillRect(pos.x - textWidth / 2 - 3, pos.y + radius + 2, textWidth + 6, 14);

      ctx.fillStyle = isHovered ? '#ffffff' : color;
      ctx.fillText(label, pos.x, pos.y + radius + 12);
    }
  }
}

function computePositions(
  nodes: IntentGraphNode[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const padding = 40;
  const usableW = width - padding * 2;
  const usableH = height - padding * 2;

  if (nodes.length === 0) return positions;
  if (nodes.length === 1) {
    positions.set(nodes[0].id, { x: width / 2, y: height / 2 });
    return positions;
  }

  // Arrange in a circle or grid
  const n = nodes.length;
  const cols = Math.ceil(Math.sqrt(n * (usableW / usableH)));
  const rows = Math.ceil(n / cols);

  nodes.forEach((node, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + (col + 0.5) * (usableW / cols);
    const y = padding + (row + 0.5) * (usableH / rows);
    // Add small jitter based on domain
    const jitterX = (node.domain.charCodeAt(0) % 20) - 10;
    const jitterY = (node.tone.charCodeAt(0) % 20) - 10;
    positions.set(node.id, { x: x + jitterX, y: y + jitterY });
  });

  return positions;
}

// ── Main Component ────────────────────────────────────────────────────

export default function IntentGraph() {
  const ai = useAI();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graphData, setGraphData] = useState<IntentGraphData>({ nodes: [], edges: [], clusters: [] });
  const [hoveredNode, setHoveredNode] = useState<IntentGraphNode | null>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  const refresh = useCallback(() => {
    const data = niyahEngine.getIntentGraphData();
    setGraphData(data);
  }, []);

  // Refresh when new NiyahSession arrives
  useEffect(() => {
    if (ai.lastNiyahSession) {
      refresh();
    }
  }, [ai.lastNiyahSession, refresh]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGraph(canvas, graphData, hoveredNode);
    // Update positions ref for hover detection
    if (graphData.nodes.length > 0) {
      positionsRef.current = computePositions(
        graphData.nodes,
        canvas.width,
        canvas.height
      );
    }
  }, [graphData, hoveredNode]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawGraph(canvas, graphData, hoveredNode);
    });

    observer.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawGraph(canvas, graphData, hoveredNode);

    return () => observer.disconnect();
  }, [graphData, hoveredNode]);

  // Mouse hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: IntentGraphNode | null = null;
    for (const node of graphData.nodes) {
      const pos = positionsRef.current.get(node.id);
      if (!pos) continue;
      const dist = Math.hypot(pos.x - mx, pos.y - my);
      if (dist < 20) {
        found = node;
        break;
      }
    }

    setHoveredNode(found);
  }, [graphData.nodes]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--haven-surface)',
      borderLeft: '1px solid var(--haven-border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid var(--haven-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--haven-void)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Network size={12} style={{ color: 'var(--haven-gold)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--haven-text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            خارطة النية
          </span>
          <span style={{
            fontSize: 10,
            padding: '1px 6px',
            borderRadius: 100,
            background: 'rgba(212,175,55,0.1)',
            color: 'var(--haven-gold)',
            fontFamily: 'var(--font-mono)',
          }}>
            {graphData.nodes.length}
          </span>
        </div>

        <button className="btn-icon" style={{ width: 22, height: 22 }} onClick={refresh} title="تحديث">
          <RefreshCw size={11} />
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ width: '100%', height: '100%', cursor: hoveredNode ? 'pointer' : 'default' }}
        />

        {/* Hovered node info */}
        {hoveredNode && (
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
            background: 'rgba(17,17,17,0.95)',
            border: `1px solid ${DOMAIN_COLORS[hoveredNode.domain] ?? '#333'}44`,
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}>
            <div style={{ color: DOMAIN_COLORS[hoveredNode.domain] ?? 'var(--haven-text-2)', fontWeight: 600, marginBottom: 4 }}>
              {hoveredNode.label}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: 'var(--haven-text-3)' }}>
              <span>{hoveredNode.domain}</span>
              <span>·</span>
              <span>{hoveredNode.dialect}</span>
              <span>·</span>
              <span>{Math.round(hoveredNode.confidence * 100)}%</span>
              {hoveredNode.roots.length > 0 && (
                <>
                  <span>·</span>
                  <span style={{ direction: 'rtl' }}>{hoveredNode.roots.slice(0, 3).join('، ')}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cluster Legend */}
      {graphData.clusters.length > 0 && (
        <div style={{
          padding: '6px 10px',
          borderTop: '1px solid var(--haven-border)',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          background: 'var(--haven-void)',
        }}>
          {graphData.clusters.slice(0, 5).map(c => (
            <div key={c.domain} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: DOMAIN_COLORS[c.domain] ?? '#606060',
              }} />
              <span style={{ fontSize: 10, color: 'var(--haven-text-4)', fontFamily: 'var(--font-mono)' }}>
                {c.domain} ({c.count})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
