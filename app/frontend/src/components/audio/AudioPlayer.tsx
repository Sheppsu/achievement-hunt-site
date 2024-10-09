import * as React from "react";
import { BsPlayFill, BsPauseFill, BsVolumeOffFill , BsVolumeUpFill } from "react-icons/bs";
import { CgSpinner } from 'react-icons/cg';
import IconButton from "./IconButton";
import VolumeInput from "./VolumeInput";
import AudioProgressBar from "./AudioProgressBar";
import './../../assets/css/audioPlayer.css'

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
    <div className="audio-player-container">
          <div className="audio-player">
          
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
        <div className="">
          <IconButton
            disabled={!isReady}
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="audio-icon"
            size="lg"
          >
            {!isReady && currentSong ? (
              <CgSpinner className="audio-icon" />
            ) : isPlaying ? ( 
              <BsPauseFill className="audio-icon"/>
            ) : (
              <BsPlayFill className="audio-icon"/>
            )}
          </IconButton>
        </div>
        <AudioProgressBar
            duration={duration}
            currentProgress={currrentProgress}
            buffered={buffered}
            className="audio-progress"
            onChange={(e) => {
              if (!audioRef.current) return;
          
              audioRef.current.currentTime = e.currentTarget.valueAsNumber;
          
              setCurrrentProgress(e.currentTarget.valueAsNumber);
            }}
        />
        <span className="text-xs">
          {elapsedDisplay} / {durationDisplay}
        </span>
        <div className="audio-player">
            <IconButton
              intent="secondary"
              size="sm"
              onClick={handleMuteUnmute}
              aria-label={volume === 0 ? "unmute" : "mute"}
              className="audio-icon"
            >
              {volume === 0 ? <BsVolumeOffFill className="audio-icon"/> : <BsVolumeUpFill className="audio-icon"/>}
          </IconButton>
            <VolumeInput volume={volume} onVolumeChange={handleVolumeChange} />
        </div>
      </div>
    </div>
  );
}
