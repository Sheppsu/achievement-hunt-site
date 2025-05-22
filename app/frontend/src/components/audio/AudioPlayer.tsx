import * as React from "react";
import {
  BsPauseFill,
  BsPlayFill,
  BsVolumeOffFill,
  BsVolumeUpFill,
} from "react-icons/bs";
import { CgSpinner } from "react-icons/cg";
import VolumeInput from "./VolumeInput";
import AudioProgressBar from "./AudioProgressBar";
import "assets/css/audioPlayer.css";
import {
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";

interface AudioPlayerProps {
  currentSong: string;
}

function formatDurationDisplay(duration: number) {
  const min = Math.floor(duration / 60);
  const sec = Math.floor(duration - min * 60);

  // format - mm:ss
  return [min, sec].map((n) => (n < 10 ? "0" + n : n)).join(":");
}

export default function AudioPlayer({ currentSong }: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const state = useStateContext();
  const dispatchState = useDispatchStateContext();

  // states
  const [duration, setDuration] = React.useState(0);
  const [isReady, setIsReady] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currrentProgress, setCurrrentProgress] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);

  const durationDisplay = formatDurationDisplay(duration);
  const elapsedDisplay = formatDurationDisplay(currrentProgress);

  function setAudio(
    value: number | null = null,
    isMuted: boolean | null = null,
  ) {
    value ??= state.volume.value;
    isMuted ??= state.volume.isMuted;

    dispatchState({ id: 9, value: value, isMuted: isMuted });
    audioRef.current!.volume = isMuted ? 0 : value;
  }

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

    if (volumeValue === 0) {
      setAudio(volumeValue, true);
    } else if (state.volume.isMuted) {
      setAudio(volumeValue, false);
    } else {
      setAudio(volumeValue);
    }
  };
  const handleMuteUnmute = () => {
    if (!audioRef.current) return;

    // default to 0.5 when unmuting from 0 volume
    if (state.volume.value === 0 && state.volume.isMuted) {
      setAudio(0.5, !state.volume.isMuted);
    } else {
      setAudio(null, !state.volume.isMuted);
    }
  };

  // handler
  const handleBufferProgress: React.ReactEventHandler<HTMLAudioElement> = (
    e,
  ) => {
    const audio = e.currentTarget;
    const dur = audio.duration;
    if (dur > 0) {
      for (let i = 0; i < audio.buffered.length; i++) {
        if (
          audio.buffered.start(audio.buffered.length - 1 - i) <
          audio.currentTime
        ) {
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
    <div className="audio-player">
      <div className="audio-player__container">
        <audio
          ref={audioRef}
          preload="metadata"
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onCanPlay={() => {
            setAudio(); // update audio ref volume
            setIsReady(true);
          }}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => {
            setCurrrentProgress(e.currentTarget.currentTime);
            handleBufferProgress(e);
          }}
          onProgress={handleBufferProgress}
        >
          <source type="audio/mpeg" src={`/static/audio/${currentSong}`} />
        </audio>
        <div onClick={togglePlayPause} className="audio-icon-wrapper">
          {!isReady ? (
            <CgSpinner className="audio-icon" />
          ) : isPlaying ? (
            <BsPauseFill className="audio-icon" />
          ) : (
            <BsPlayFill className="audio-icon" />
          )}
        </div>
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
        <p>
          {elapsedDisplay} / {durationDisplay}
        </p>
        <div className="audio-controls">
          <div onClick={handleMuteUnmute} className="audio-icon-wrapper">
            {state.volume.isMuted ? (
              <BsVolumeOffFill className="audio-icon" />
            ) : (
              <BsVolumeUpFill className="audio-icon" />
            )}
          </div>
          <VolumeInput
            volume={audioRef.current?.volume ?? 0}
            onVolumeChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}
