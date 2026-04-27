import type { MessageItemType } from '../lib/supabase'

interface MemoryIconProps {
  type: MessageItemType
  size?: number
  active?: boolean  // when true, strokes in var(--rose); otherwise inherits currentColor
}

export default function MemoryIcon({ type, size = 16, active = false }: MemoryIconProps) {
  const p = {
    width: size, height: size, viewBox: '0 0 20 20',
    fill: 'none', stroke: active ? 'var(--rose)' : 'currentColor',
    strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  if (type === 'photo')       return <svg {...p}><rect x="2" y="4" width="16" height="12" rx="2"/><circle cx="10" cy="10" r="3"/><path d="M7 4l1.5-2h3L13 4"/></svg>
  if (type === 'video')       return <svg {...p}><rect x="2" y="5" width="11" height="10" rx="2"/><path d="M13 8l5-3v10l-5-3V8z"/></svg>
  if (type === 'audio')       return <svg {...p}><path d="M9 4l-5 4H2a1 1 0 00-1 1v2a1 1 0 001 1h2l5 4V4z"/><path d="M15 8a4 4 0 010 4M18 6a7 7 0 010 8"/></svg>
  if (type === 'voice_note')  return <svg {...p}><rect x="7" y="2" width="6" height="10" rx="3"/><path d="M4 10a6 6 0 0012 0M10 16v2M7 18h6"/></svg>
  if (type === 'note')        return <svg {...p}><path d="M14 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2z"/><path d="M8 8h4M8 12h2"/></svg>
  if (type === 'spotify')     return <svg {...p}><circle cx="10" cy="10" r="8"/><path d="M6 12.5c2.5-1 5-1 7.5 0M5.5 9.5C9 8 12 8 15 9.5M7 6.5c2-1 4.5-1 6.5 0"/></svg>
  if (type === 'google_maps') return <svg {...p}><path d="M10 2a6 6 0 016 6c0 4-6 10-6 10S4 12 4 8a6 6 0 016-6z"/><circle cx="10" cy="8" r="2"/></svg>
  return null
}
