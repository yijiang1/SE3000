"use client";
import { Component, type ReactNode } from "react";
export default class MaterialErrorBoundary extends Component<{children:ReactNode;onClose:()=>void},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div role="alert" className="bg-white p-6 rounded-xl text-slate-900"><p>This material could not be displayed. Your saved data is still available; regenerate this material to replace invalid content.</p><button onClick={this.props.onClose}>Close</button></div>:this.props.children;}
}
