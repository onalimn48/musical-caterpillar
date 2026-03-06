export const ff = "'Fredoka','Nunito',sans-serif";

export const css = `
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
*{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
button{touch-action:manipulation;-webkit-touch-callout:none;user-select:none}
@keyframes popIn{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes shakeNote{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes snowfall{0%{transform:translateY(-10px) rotate(0deg)}100%{transform:translateY(100vh) rotate(360deg)}}
@keyframes snowBounce{0%{transform:translateY(0)}100%{transform:translateY(-18px)}}
@keyframes confettiFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes slideIn{0%{transform:translateY(20px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes fadeIn{0%{opacity:0}100%{opacity:1}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(99,102,241,.3)}50%{box-shadow:0 0 40px rgba(99,102,241,.6)}}
@keyframes segBob{0%{transform:translateY(0)}100%{transform:translateY(-2px)}}
@keyframes catShiver{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes steamFloat{0%{opacity:.5;transform:translateY(0)}50%{opacity:.3;transform:translateY(-3px)}100%{opacity:.1;transform:translateY(-6px)}}
@keyframes sparkleFloat{0%{opacity:.6;transform:translateY(0)}50%{opacity:.2;transform:translateY(-4px)}100%{opacity:.6;transform:translateY(0)}}
@keyframes catWalk{0%,100%{transform:translateY(0) scaleX(1)}25%{transform:translateY(-4px) scaleX(1.05)}50%{transform:translateY(0) scaleX(0.95)}75%{transform:translateY(-3px) scaleX(1.02)}}
@keyframes obsBob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-6px) rotate(2deg)}}
@keyframes snowmanWave{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
@keyframes musicFloat{0%{opacity:0;transform:translateY(0) scale(.5)}30%{opacity:1;transform:translateY(-12px) scale(1)}100%{opacity:0;transform:translateY(-40px) scale(.6)}}
@keyframes correctBurst{0%{transform:scale(1)}30%{transform:scale(1.15)}60%{transform:scale(.95)}100%{transform:scale(1)}}
@keyframes hpShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}
@keyframes starTwinkle{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
@keyframes treeSway{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(1deg)}}
*{box-sizing:border-box}body{margin:0;overflow-x:hidden}
`;
