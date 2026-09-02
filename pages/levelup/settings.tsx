import { LevelUpSettingsPanel } from "../../components/levelup/LevelUpSettingsPanel";
import { LevelUpShell } from "../../components/levelup/LevelUpShell";

export default function LevelUpSettingsPage(): JSX.Element {
  return (
    <LevelUpShell title="Global Settings" subtitle="Adjust the live AI model without redeploying the app.">
      <LevelUpSettingsPanel />
    </LevelUpShell>
  );
}
