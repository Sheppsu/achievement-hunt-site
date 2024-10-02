import * as React from "react";
import { MdPlayArrow, MdPause, MdVolumeOff, MdVolumeUp } from "react-icons/md";
import { CgSpinner } from 'react-icons/cg';
import IconButton from "./IconButton";
import VolumeInput from "./VolumeInput";
import AudioProgressBar from "./AudioProgressBar";

interface AudioPlayerProps {
  currentSong: string;
}

function formatDurationDisplay(duration: number) {
  const min = Math.floor(duration / 60);
  const sec = Math.floor(duration - min * 60);

  const formatted = [min, sec].map((n) => (n < 10 ? "0" + n : n)).join(":"); // format - mm:ss

  return formatted;
}



export default function AudioPlayer({
  currentSong
}: AudioPlayerProps) {

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // states
  const [duration, setDuration] = React.useState(0);
  const [isReady, setIsReady] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [volume, setVolume] = React.useState(0.2); // set to 0.2, max is 1.
  const [currrentProgress, setCurrrentProgress] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);

  const durationDisplay = formatDurationDisplay(duration);
  const elapsedDisplay = formatDurationDisplay(currrentProgress);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (volumeValue: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = volumeValue;
    setVolume(volumeValue);
  };
  const handleMuteUnmute = () => {
    if (!audioRef.current) return;

    if (audioRef.current.volume !== 0) {
        audioRef.current.volume = 0;
    } else {
        audioRef.current.volume = 1;
    }
  };


  // handler
  const handleBufferProgress: React.ReactEventHandler<HTMLAudioElement> = (e) => {
    const audio = e.currentTarget;
    const dur = audio.duration;
    if (dur > 0) {
      for (let i = 0; i < audio.buffered.length; i++) {
        if (audio.buffered.start(audio.buffered.length - 1 - i) < audio.currentTime) {
          const bufferedLength = audio.buffered.end(
            audio.buffered.length - 1 - i,
          );
          setBuffered(bufferedLength);
          break;
        }
      }
    }
  };

  return (
    <div className="bg-slate-900 text-slate-400 p-3 relative">
        
        {currentSong && (
        <audio
          ref={audioRef} preload="metadata"
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onCanPlay={(e) => {
              e.currentTarget.volume = volume;
              setIsReady(true);
          }}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
              setCurrrentProgress(e.currentTarget.currentTime);
              handleBufferProgress(e);
          }}
          onProgress={handleBufferProgress}
          onVolumeChange={(e) => setVolume(e.currentTarget.volume)}
        >
            
          <source type="audio/mpeg" src={currentSong} />
        </audio>
      )}
      <AudioProgressBar
          duration={duration}
          currentProgress={currrentProgress}
          buffered={buffered}
          onChange={(e) => {
            if (!audioRef.current) return;
        
            audioRef.current.currentTime = e.currentTarget.valueAsNumber;
        
            setCurrrentProgress(e.currentTarget.valueAsNumber);
          }}
      />
      <span className="text-xs">
        {elapsedDisplay} / {durationDisplay}
      </span>
      <div className="flex items-center gap-3 justify-self-center">
        <IconButton
          disabled={!isReady}
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          size="lg"
        >
          {!isReady && currentSong ? (
            <CgSpinner size={24} className="animate-spin" />
          ) : isPlaying ? (
            <MdPause size={30} />
          ) : (
            <MdPlayArrow size={30} />
          )}
        </IconButton>
      </div>
      <div className="flex gap-3 items-center md:justify-self-end">
          <IconButton
            intent="secondary"
            size="sm"
            onClick={handleMuteUnmute}
            aria-label={volume === 0 ? "unmute" : "mute"}
          >
            {volume === 0 ? <MdVolumeOff size={20} /> : <MdVolumeUp size={20} />}
        </IconButton>
          <VolumeInput volume={volume} onVolumeChange={handleVolumeChange} />
      </div>
    </div>
  );
}
