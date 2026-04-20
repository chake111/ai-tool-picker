type PreferencesPrivacyNoteProps = {
  text: string
}

export function PreferencesPrivacyNote({ text }: PreferencesPrivacyNoteProps) {
  return <p className="text-xs text-muted-foreground">{text}</p>
}
