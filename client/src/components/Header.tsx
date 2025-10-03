import React from 'react';


export const Header: React.FC = () => {
return (
<header className="header">
<div className="logo">
<div className="mark">汉</div>
<div style={{display:'flex', flexDirection:'column', lineHeight:1}}>
<div style={{fontWeight:800}}>HanziFlow</div>
<div style={{fontSize:12,color:'var(--muted)'}}>learn chinese — step by step</div>
</div>
</div>
<nav className="nav" aria-label="Main navigation">
<a href="#lessons" className="active">Lessons</a>
<a href="#review">Review</a>
<a href="#profile">Profile</a>
<a href="#">Upgrade</a>
</nav>
</header>
)
}


export default Header;
