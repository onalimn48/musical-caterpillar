import { useNavigate } from 'react-router-dom';

export default function HomeButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/')}
      title="Back to Musical Caterpillar"
      style={{
        position:'fixed',top:10,left:10,zIndex:9999,
        width:40,height:40,borderRadius:12,border:'1px solid rgba(255,255,255,.15)',
        background:'rgba(0,0,0,.4)',backdropFilter:'blur(8px)',
        color:'white',fontSize:18,cursor:'pointer',
        display:'flex',alignItems:'center',justifyContent:'center',
        transition:'all .2s',fontFamily:'sans-serif',
      }}
      onMouseEnter={e => { e.target.style.background='rgba(0,0,0,.6)'; e.target.style.transform='scale(1.1)'; }}
      onMouseLeave={e => { e.target.style.background='rgba(0,0,0,.4)'; e.target.style.transform='scale(1)'; }}
    >
      🏠
    </button>
  );
}
