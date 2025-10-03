import React from 'react'
import './design/theme.css'
import Header from './components/Header'
import Hero from './components/Hero'
import LessonCard from './components/LessonCard'


const sampleLessons = [
{ title: 'Basics: Greetings', chars:['你','好','是','不','我'] },
{ title: 'Numbers 1–10', chars:['一','二','三','四','五','六','七','八','九','十'] },
{ title: 'Family', chars:['家','爸','妈','弟','姐'] },
]


export const AppNew: React.FC = () => {
return (
<div>
<div style={{paddingTop:18}}>
<div className="container">
<Header />
</div>
<Hero />
<main className="container" style={{marginTop:28}}>
<h2 style={{margin:'8px 0 16px 0'}}>Lessons</h2>
<div className="grid">
{sampleLessons.map((l, idx) => (
<LessonCard key={idx} title={l.title} chars={l.chars} />
))}
</div>
</main>
</div>
</div>
)
}


export default AppNew;
