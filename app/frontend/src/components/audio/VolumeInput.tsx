interface VolumeInputProps {
    volume: number;
    onVolumeChange: (volume: number) => void;
  }
  
  export default function VolumeInput(props: VolumeInputProps) {
    const { volume, onVolumeChange } = props;

    interface ProgressCSSProps extends React.CSSProperties {
        "--progress-width": number;
        "--buffered-width": number;
      }
  
    return (
      <input
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