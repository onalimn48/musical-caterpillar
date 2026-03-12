import { memo } from "react";

export const MenuModeToggle = memo(function MenuModeToggle({
  selectedMenuMode,
  displayStageAccent,
  setSelectedMenuModeValue,
  showDevLabel = false,
}) {
  return (
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      {[
        { id: "campaign", label: "CAMPAIGN" },
        { id: "endless", label: "ENDLESS" },
      ].map(mode => {
        const isSelected = selectedMenuMode === mode.id;
        return (
          <button
            key={mode.id}
            onPointerDown={event => {
              event.preventDefault();
              setSelectedMenuModeValue(mode.id);
            }}
            style={{
              background: isSelected ? `${displayStageAccent}22` : "#07111f",
              border: `1px solid ${isSelected ? displayStageAccent : "#7ce7ff22"}`,
              color: isSelected ? "#fff7ef" : "#8fc7e8",
              padding: "9px 14px",
              fontFamily: "monospace",
              fontSize: 11,
              letterSpacing: 2.2,
              cursor: "pointer",
              borderRadius: 6,
              boxShadow: isSelected ? `0 0 14px ${displayStageAccent}33` : "none",
            }}
          >
            {mode.label}
          </button>
        );
      })}
      {showDevLabel && (
        <div style={{display:"flex",alignItems:"center",fontSize:9,color:"#ffb347",letterSpacing:2.2,paddingLeft:4}}>
          DEV MODE
        </div>
      )}
    </div>
  );
});

export const DevMenuTools = memo(function DevMenuTools({
  previewLevelClearOverlay,
  menuLevelDef,
  setNotationLabOpen,
}) {
  return (
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <button
        onPointerDown={event => {
          event.preventDefault();
          previewLevelClearOverlay(menuLevelDef);
        }}
        style={{
          background: "#22140f",
          border: "1px solid #ffd88966",
          color: "#ffd889",
          padding: "9px 14px",
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: 2.1,
          cursor: "pointer",
          borderRadius: 6,
          boxShadow: "0 0 14px #00000033",
        }}
      >
        TEST CLEAR SCREEN
      </button>
      <button
        onPointerDown={event => {
          event.preventDefault();
          setNotationLabOpen(true);
        }}
        style={{
          background: "#0f1726",
          border: "1px solid #7ce7ff55",
          color: "#7ce7ff",
          padding: "9px 14px",
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: 2.1,
          cursor: "pointer",
          borderRadius: 6,
          boxShadow: "0 0 14px #00000033",
        }}
      >
        NOTE LAB
      </button>
    </div>
  );
});

export const NotationLabOverlay = memo(function NotationLabOverlay({
  notationLabOpen,
  setNotationLabOpen,
  levelNotationPreviewEntries,
  notationPreviewEntries,
  RhythmLane,
  laneProps,
  width,
  height,
  laneY,
}) {
  if (!notationLabOpen) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(1,3,8,0.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,zIndex:45}}>
      <div style={{width:"min(100%, 1120px)",maxHeight:"min(92vh, 860px)",overflow:"auto",border:"1px solid #7ce7ff33",borderRadius:10,background:"linear-gradient(180deg, rgba(8,12,22,.98), rgba(3,6,12,.97))",boxShadow:"0 0 40px #00000088",padding:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:10,color:"#7ce7ff88",letterSpacing:3}}>DEV MODE</div>
            <div style={{fontSize:20,color:"#eefaff",letterSpacing:2}}>Notation Lab</div>
            <div style={{fontSize:10,color:"#ffffff55",letterSpacing:1.5,marginTop:4}}>Full level timelines with barlines first, then individual phrase cells and endless blueprints.</div>
          </div>
          <button
            onPointerDown={event => {
              event.preventDefault();
              setNotationLabOpen(false);
            }}
            style={{background:"#132033",border:"1px solid #7ce7ff44",color:"#7ce7ff",padding:"10px 14px",fontFamily:"monospace",fontSize:11,letterSpacing:2.1,cursor:"pointer",borderRadius:6}}
          >
            CLOSE
          </button>
        </div>

        <div style={{display:"grid",gap:14}}>
          {levelNotationPreviewEntries.map(entry => (
            <div key={entry.id} style={{border:"1px solid #ffd8891f",borderRadius:8,background:"rgba(18,11,10,.5)",padding:"12px 12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:8}}>
                <div>
                  <div style={{fontSize:9,color:"#ffd88988",letterSpacing:2.2}}>{entry.tag}</div>
                  <div style={{fontSize:14,color:"#fff7ef",letterSpacing:1.5}}>{entry.title}</div>
                </div>
                <div style={{fontSize:9,color:"#ffffff55",letterSpacing:1.6}}>{`${entry.spanBeats} BEATS`}</div>
              </div>
              <div style={{overflowX:"auto",paddingBottom:4}}>
                <svg
                  viewBox={`0 0 ${entry.previewWidth} ${height}`}
                  width={entry.previewWidth}
                  height="220"
                  style={{display:"block",background:"linear-gradient(180deg, rgba(14,8,6,.86), rgba(12,8,16,.72))",borderRadius:8}}
                >
                  <g transform="translate(0,0)">
                    <RhythmLane notes={entry.notes} beatsPerBar={entry.beatsPerBar} {...laneProps}/>
                    {entry.notes.map(note => (
                      <text
                        key={`${entry.id}-${note.id}-count`}
                        x={(note.laneBaseX ?? note.x ?? 0)}
                        y={laneY + 38}
                        textAnchor="middle"
                        fontSize={8}
                        fill="#ffd889"
                        fontFamily="monospace"
                        letterSpacing={0.4}
                      >
                        {Number.isInteger(note.absoluteBeatInRun) ? note.absoluteBeatInRun + 1 : (note.absoluteBeatInRun + 1).toFixed(2).replace(/\.00$/, "")}
                      </text>
                    ))}
                  </g>
                </svg>
              </div>
            </div>
          ))}
          {notationPreviewEntries.map(entry => (
            <div key={entry.id} style={{border:"1px solid #7ce7ff18",borderRadius:8,background:"rgba(4,10,18,.72)",padding:"12px 12px 14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:8}}>
                <div>
                  <div style={{fontSize:9,color:"#7ce7ff88",letterSpacing:2.2}}>{entry.tag}</div>
                  <div style={{fontSize:14,color:"#fff7ef",letterSpacing:1.5}}>{entry.title}</div>
                </div>
                <div style={{fontSize:9,color:"#ffffff55",letterSpacing:1.6}}>{`${entry.spanBeats} BEATS`}</div>
              </div>
              <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" style={{display:"block",background:"linear-gradient(180deg, rgba(1,5,12,.86), rgba(1,7,16,.72))",borderRadius:8}}>
                <g transform="translate(-18,-56) scale(1.9)">
                  <RhythmLane notes={entry.notes} beatsPerBar={entry.beatsPerBar} {...laneProps}/>
                  {entry.notes.map(note => (
                    <text
                      key={`${entry.id}-${note.id}-count`}
                      x={(note.laneBaseX ?? note.x ?? 0)}
                      y={laneY + 38}
                      textAnchor="middle"
                      fontSize={8}
                      fill="#ffd889"
                      fontFamily="monospace"
                      letterSpacing={0.4}
                    >
                      {Number.isInteger(note.at) ? note.at + 1 : (note.at + 1).toFixed(2).replace(/\.00$/, "")}
                    </text>
                  ))}
                </g>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
