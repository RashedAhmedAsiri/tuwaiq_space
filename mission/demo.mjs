const slides=[...document.querySelectorAll('main section')];
const previous=document.querySelector('#previous');
const next=document.querySelector('#next');
const count=document.querySelector('#count');
let current=0;
function show(index) {
  current=Math.min(slides.length-1,Math.max(0,index));
  for (const [i,slide] of slides.entries()) slide.hidden=i!==current;
  previous.disabled=current===0;
  next.disabled=current===slides.length-1;
  count.textContent=(current+1)+' / '+slides.length;
}
document.querySelector('#controls').hidden=false;
previous.onclick=()=>show(current-1);
next.onclick=()=>show(current+1);
document.addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft')show(current-1);
  if(event.key==='ArrowRight')show(current+1);
});
show(0);
