import React from 'react'


type Props = {
title: string;
level?: string;
chars: string[];
}


export const LessonCard: React.FC<Props> = ({title, level='Beginner', chars}) => {
return (
<article className="card" aria-labelledby={`lesson-${title}`}>
<div className="title" id={`lesson-${title}`}>{title}</div>
<div className="meta">{level} · {chars.length} characters</div>
<div style={{marginTop:12, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
{chars.slice(0,5).map((c,i)=> (
<div key={i} style={{fontFamily:'var(--font-cn)', padding:'6px 8px', borderRadius:8, background:'rgba(15,23,42,0.03)', fontSize:18}}>{c}</div>
))}
</div>
</article>
)
}


export default LessonCard;
