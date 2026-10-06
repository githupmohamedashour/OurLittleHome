export type Field = { name: string; label: string; type: "text"|"textarea"|"date"|"datetime"|"select"|"tags"|"image"|"images"|"media"|"bool"|"number"|"person"; required?: boolean; options?: string[] };
export type Mod = { key: string; table: string; label: string; icon: string; title: string; date?: string; empty: string; fields: Field[] };
const t = (name: string, label: string, required = false): Field => ({ name, label, type: "text", required });
const d = (name: string, label: string, required = false): Field => ({ name, label, type: "textarea", required });
const img=(name:string,multi=false):Field=>({name,label:multi?"Photos":"Photo",type:multi?"images":"image"});
const med=(name:string,label:string):Field=>({name,label,type:"media"});
export const MODULES: Mod[] = [
 { key:"memories", table:"memories", label:"Memories", icon:"📸", title:"title", date:"memory_date",
   empty:"We haven't filled this page yet... Let's give it a memory.",
   fields:[t("title","Title",true),{name:"memory_date",label:"Date",type:"date"},t("location","Location"),d("description","Description"),img("photo_paths",true),med("video_path","Video"),{name:"tags",label:"Tags (comma separated)",type:"tags"}]},
 { key:"events", table:"events", label:"Events", icon:"🗓️", title:"title", date:"event_date",
   empty:"Nothing planned yet. Maybe that's where the next adventure begins.",
   fields:[t("title","Title",true),{name:"event_date",label:"Date",type:"date",required:true},t("location","Location"),{name:"category",label:"Category",type:"select",options:["First date","Engagement","Anniversary","Birthday","Trip","Dinner","Future plan","Important day"]},{name:"reminder_date",label:"Reminder date",type:"date"},{name:"is_countdown",label:"Show countdown on Home",type:"bool"},img("photo_path"),d("description","Description")]},
 { key:"open-when", table:"open_when", label:"Open When", icon:"💌", title:"title", date:"unlock_at",
   empty:"Nothing waiting yet. Write the first letter.",
   fields:[t("title","Open when...",true),d("message","Message"),img("photo_path"),med("voice_path","Voice recording"),med("video_path","Video"),{name:"unlock_at",label:"Unlock date (leave empty = available now)",type:"datetime"}]},
 { key:"scheduled", table:"scheduled_messages", label:"Secret Messages", icon:"🔐", title:"title", date:"unlock_at",
   empty:"Not yet... some things are worth waiting for.",
   fields:[t("title","Title",true),{name:"to_user",label:"For",type:"person"},d("message","Message"),img("photo_path"),med("voice_path","Voice note"),med("video_path","Video"),{name:"unlock_at",label:"Unlock date",type:"datetime",required:true}]},
 { key:"timeline", table:"timeline_items", label:"Timeline", icon:"🕰️", title:"title", date:"item_date",
   empty:"Our story starts with the first entry.",
   fields:[{name:"item_date",label:"Date",type:"date",required:true},t("title","Title",true),t("location","Location"),t("category","Category"),img("image_path"),d("description","Description")]},
 { key:"future", table:"future_plans", label:"Future Us", icon:"🌙", title:"title",
   empty:"Dream something up together.",
   fields:[t("title","Title",true),t("category","Category"),{name:"status",label:"Status",type:"select",options:["idea","planned","done"],required:true},img("image_path"),d("description","Description")]},
 { key:"little-things", table:"little_things", label:"Little Things", icon:"✨", title:"title",
   empty:"The small things matter most. Add the first one.",
   fields:[t("title","Title",true),t("category","Category"),d("description","Description")]},
 { key:"places", table:"places", label:"Our Places", icon:"📍", title:"name", date:"visited_on",
   empty:"No places yet. Where did it all happen?",
   fields:[t("name","Name",true),t("location","Location"),{name:"latitude",label:"Latitude (optional, for the map)",type:"number"},{name:"longitude",label:"Longitude (optional)",type:"number"},{name:"visited_on",label:"Date",type:"date"},t("category","Category"),img("photo_path"),d("description","Description")]},
];
