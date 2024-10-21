interface VolumeInputProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export default function VolumeInput(props: VolumeInputProps) {
  const { volume, onVolumeChange } = props;

  return (
    <input
      className="audio-bar"
      aria-label="volume"
      name="volume"
      type="range"
      min={0}
      step={0.05}
      max={1}
      value={volume}
      onChange={(e) => {
        onVolumeChange(e.currentTarget.valueAsNumber);
      }}
    />
  );
}
