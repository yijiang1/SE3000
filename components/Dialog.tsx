"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
const stack: HTMLElement[] = [];
const selector='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';
export default function Dialog({children,onClose,className}: {children:ReactNode;onClose:()=>void;className?:string}) {
  const ref=useRef<HTMLDivElement>(null);
  const close=useRef(onClose);
  useEffect(()=>{close.current=onClose;},[onClose]);
  const id=useId();const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  useEffect(()=>{
    if(!mounted || !ref.current)return;
    const root=ref.current;const previous=document.activeElement as HTMLElement | null;
    stack.push(root);
    const siblings = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el !== root).map((el) => ({el, inert:el.inert}));
    siblings.forEach(({el}) => {el.inert=true;});
    const oldOverflow=document.body.style.overflow;document.body.style.overflow="hidden";
    const wire=()=>{
      const heading=root.querySelector("h1,h2,h3");if(heading){heading.id ||= `${id}-title`;root.setAttribute("aria-labelledby",heading.id);}
      root.querySelectorAll("label").forEach((label,index)=>{if(label.htmlFor || label.querySelector("input,select,textarea"))return;const field=label.parentElement?.querySelector("input:not([type=hidden]),select,textarea");if(field){field.id ||= `${id}-field-${index}`;label.htmlFor=field.id;}});
      root.querySelectorAll("button").forEach((button)=>{if(!button.getAttribute("aria-label") && !button.textContent?.trim())button.setAttribute("aria-label",button.title || "Close dialog");if(button.textContent?.trim()==="✕")button.setAttribute("aria-label","Close dialog");});
    };
    wire();const observer=new MutationObserver(wire);observer.observe(root,{childList:true,subtree:true});
    const focusable=()=>[...root.querySelectorAll<HTMLElement>(selector)].filter((el)=>el.getClientRects().length>0);
    (focusable()[0] ?? root).focus();
    const key=(event:KeyboardEvent)=>{
      if(stack.at(-1)!==root)return;
      if(event.key==="Escape"){event.preventDefault();event.stopPropagation();close.current();}
      if(event.key==="Tab") {const nodes=focusable();const first=nodes[0]??root,last=nodes.at(-1)??root;if(event.shiftKey && (document.activeElement===first || !root.contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey && (document.activeElement===last || !root.contains(document.activeElement))){event.preventDefault();first.focus();}}
    };
    const focus=(event:FocusEvent)=>{if(stack.at(-1)===root && !root.contains(event.target as Node))(focusable()[0]??root).focus();};
    document.addEventListener("keydown",key,true);document.addEventListener("focusin",focus);
    return()=>{siblings.forEach(({el,inert})=>{el.inert=inert;});observer.disconnect();stack.splice(stack.indexOf(root),1);document.removeEventListener("keydown",key,true);document.removeEventListener("focusin",focus);document.body.style.overflow=oldOverflow;if(previous?.isConnected)previous.focus();};
  },[mounted,id]);
  return mounted?createPortal(<div ref={ref} role="dialog" aria-modal="true" aria-label="Dialog" tabIndex={-1} className={className}>{children}</div>,document.body):null;
}
