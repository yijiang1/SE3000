import { localDate } from "./dates";
export function weekBounds(date = new Date()): [string,string] {
  const start=new Date(date);start.setDate(start.getDate()-((start.getDay()+6)%7));
  const end=new Date(start);end.setDate(end.getDate()+6);
  return [localDate(start),localDate(end)];
}
export function weeklyMinutes(entries: {date:string;minutes:number}[] = [],date = new Date()): number {
  const [start,end]=weekBounds(date);return entries.filter((e)=>e.date>=start && e.date<=end).reduce((total,e)=>total+e.minutes,0);
}
