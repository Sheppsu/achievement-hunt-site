import {BsPlayFill, BsPauseFill, BsFillVolumeUpFill} from 'react-icons/bs'



export const Player = ({audioElem, isPlaying, setIsPlaying})=> {

  const PlayPause = ()=> {
    setIsPlaying(!isPlaying);
  }

  return (
    <div className='player-container'>
      <div className='navigation'>
        <div className='navigation_wrapper'>
          <div className='seek_bar' style={{width:'50%'}}></div>
        </div>
      </div>
      <div className='controls'>
        {isPlaying ? <BsPauseFill className='btn_action' onClick={PlayPause}/> : 
        <BsPlayFill className='btn_action' onClick={PlayPause}/> }
      </div>
    </div>
  )
}