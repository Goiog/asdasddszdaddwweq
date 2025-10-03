import React from 'react';


export const Hero: React.FC = () => {
return (
<section className="hero container" role="region" aria-labelledby="hero-title">
<div className="left">
<span className="kicker">New</span>
<h1 id="hero-title">Learn Chinese naturally — one character at a time</h1>
<p>Clear lessons, gentle spacing and a friendly UI designed to keep you coming back. Practice writing, pronunciation, and tones with visual hints and spaced repetition.</p>
<div style={{display:'flex', gap:12}}>
<a className="cta" href="#lessons">Start learning</a>
<a style={{padding:'12px 18px', borderRadius:12, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8, fontWeight:700}} href="#features">Why HanziFlow</a>
</div>
</div>
<div style={{width:360}}>
{/* Example stat / preview card */}
<div style={{borderRadius:14, padding:18, background:'linear-gradient(180deg, rgba(91,141,239,0.06), rgba(124,212,184,0.03))', boxShadow:'var(--shadow-soft)'}}>
<div style={{fontWeight:800, fontSize:18}}>Daily streak</div>
<div style={{marginTop:8, fontSize:28, fontWeight:800}}>12 days</div>
<div style={{marginTop:12, color:'var(--muted)'}}>Complete 4 lessons to keep the streak going</div>
</div>
</div>
</section>
)
}


export default Hero;
