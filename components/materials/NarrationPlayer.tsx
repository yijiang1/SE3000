"use client";
import { useEffect, useRef, useState } from "react";
import type { NarrationContent } from "@/types/iep";
export default function NarrationPlayer({content,onClose}: {content:NarrationContent;onClose?:()=>void}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [playing,setPlaying] = useState(false);
  const [active,setActive] = useState<number | null>(null);
  const [rate,setRate] = useState(1);
  const [error,setError] = useState("");
  const segments = content.segments?.length ? content.segments : [{segmentIndex:1,text:content.fullTranscript}];
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
    audio?.pause();
    if (utteranceRef.current) {
      utteranceRef.current.onend = null; utteranceRef.current.onerror = null; utteranceRef.current.onboundary = null;
      window.speechSynthesis?.cancel(); utteranceRef.current = null;
    }
    };
  }, []);
  function reset() {
    if (audioRef.current) {audioRef.current.pause();audioRef.current.currentTime=0;}
    if (utteranceRef.current) {utteranceRef.current.onend=null;utteranceRef.current.onerror=null;utteranceRef.current.onboundary=null;window.speechSynthesis.cancel();utteranceRef.current=null;}
    setPlaying(false);setActive(null);
  }
  async function toggle() {
    setError("");
    if (content.audioUrl && audioRef.current) {
      if (playing) audioRef.current.pause();
      else { try {await audioRef.current.play();} catch {setError("Audio could not play. Try again or regenerate narration.");} }
      return;
    }
    if (!("speechSynthesis" in window)) {setError("Speech playback is unavailable in this browser.");return;}
    if (playing) {window.speechSynthesis.pause();setPlaying(false);return;}
    if (utteranceRef.current && window.speechSynthesis.paused) {window.speechSynthesis.resume();setPlaying(true);return;}
    const utterance = new SpeechSynthesisUtterance(content.fullTranscript);
    utteranceRef.current=utterance;utterance.rate=(content.speed || 0.9)*rate;
    utterance.onboundary=(event) => {
      let offset=0;
      for (let i=0;i<segments.length;i++) {const start=content.fullTranscript.indexOf(segments[i].text,offset);if(start<0)continue;const end=start+segments[i].text.length; if(event.charIndex<end){setActive(i);break;}offset=end;}
    };
    utterance.onend=()=>{setPlaying(false);setActive(null);utteranceRef.current=null;};
    utterance.onerror=()=>{setPlaying(false);setError("Speech playback failed.");utteranceRef.current=null;};
    window.speechSynthesis.speak(utterance);setPlaying(true);
  }
  return <div className="bg-white rounded-2xl p-6 space-y-5 text-slate-900">
    <div className="flex justify-between gap-4"><h2 className="text-xl font-bold">{content.title}</h2><button aria-label="Close narration" onClick={()=>{reset();onClose?.();}}>✕</button></div>
    <p className="text-sm text-slate-600">{content.audioUrl ? "Recorded narration" : "Browser voice fallback"}. Voice setting: {content.voice}.</p>
    {content.audioUrl && <audio ref={audioRef} src={content.audioUrl} preload="metadata" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);setActive(null);}} onError={()=>{setPlaying(false);setError("Saved audio could not be loaded. Regenerate narration.");}} />}
    <div className="flex flex-wrap items-center gap-4"><button onClick={toggle} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{playing?"Pause":"Play"}</button><button onClick={reset}>Reset</button>
    <label>Playback speed <select value={rate} onChange={(e)=>{const next=Number(e.target.value);if(!content.audioUrl)reset();setRate(next);if(audioRef.current)audioRef.current.playbackRate=next;}}>{[0.75,1,1.2,1.5].map((value)=><option key={value} value={value}>{value}×</option>)}</select></label></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {content.audioUrl && <p className="text-xs text-slate-500">Transcript below; precise sentence timing is unavailable for this recording.</p>}
    <div className="space-y-3">{segments.map((s,i)=><p key={s.segmentIndex} className={active===i?"bg-indigo-100 rounded p-2":"p-2"}>{s.text}</p>)}</div>
  </div>;
}
