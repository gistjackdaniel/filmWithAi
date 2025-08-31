# Premiere-style Timeline - Task List

- [x] High-fidelity Premiere-style timeline layout (grid, gutters, track headers)
- [x] Core components scaffolding: `TimelineEditor`, `TimelineRuler`, `Playhead`, `Track`, `Clip`
- [x] Zoomable scale (pixelsPerSecond from zoom) and horizontal scroll
- [x] Playhead seek by click on ruler and drag handle
- [x] Video/Audio tracks (V1–V3, A1–A3) basic rendering
- [x] V1 track shows Cut cards; V2/V3 show Video clips
- [x] Drag from V1 to V2/V3 to create AI-generated video placeholder
- [x] Persist generated clips via backend API
- [x] Unify DualTimeline into TimelineEditor and remove legacy components
- [x] Clip resizing (trim in/out) and move with snapping to ruler ticks (basic in-editor state)
- [x] Multi-clip selection and track highlight (basic)
- [x] Waveform rendering for audio from decoded peaks (placeholder renderer)
- [x] Keyboard shortcuts (space: play/pause, +/-: zoom, ←/→ seek)
- [x] Minimap/overview bar (basic viewport + seek)
- [ ] Performance virtualization for long timelines

## Notes
- Current implementation uses HTML5 drag-and-drop; can be upgraded to `@dnd-kit/core` for richer interactions.
- Uses `src/shared/utils/timeline.ts` for time/pixel math to keep sync with existing DualTimeline.
- Added backend resource: `timeline-clip` (list/create/remove) and front service `timelineClipService` hooked into DualTimeline drop flows.

