export function defaultJournalTemplate(entryDate: string): string {
  return `# Journal — ${entryDate}

Rate 0–10:

- Sleep quality: __
- Stress: __
- Fatigue: __
- Left hand difficulty: __
- Left leg heaviness/coordination: __
- Speech difficulty: __
- Saliva/swallow difficulty: __
- Stairs difficulty: __
- Typing difficulty: __
- Rehab done: yes / partial / no

## Notes

Sleep, work stress, caffeine, illness, hard training, emotional load, vibration/shaking episode.
`;
}
