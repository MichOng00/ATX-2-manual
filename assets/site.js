(function(){
  var ROOT=document.body.dataset.root||'', PAGE=document.body.dataset.page||'';
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  function el(tag,attrs,html){var e=document.createElement(tag);for(var k in (attrs||{}))e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e}
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}

  /* theme */
  $('#theme').addEventListener('click',function(){
    var t=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=t;try{localStorage.setItem('theme',t)}catch(e){}
  });

  /* sidebar */
  var side=$('#sidebar'), NAV=window.NAV||[];
  var byId={}, parent={};
  (function idx(list,p){list.forEach(function(n){byId[n.i]=n;parent[n.i]=p;idx(n.c,n.i)})})(NAV,null);
  var open={}; var c=PAGE; while(c){open[c]=true;c=parent[c]}
  function ch(n){var x=n.i;while(parent[x])x=parent[x];return byId[x]}
  function item(n,top){
    var li=el('li'); var row=el('div',{'class':'row'});
    var chap=ch(n); if(top && (chap.n==='4'||chap.n==='5')) li.className='chkey';
    if(n.c.length){
      var b=el('button',{'class':'tg','aria-label':'Toggle '+n.t,'aria-expanded':open[n.i]?'true':'false'},'&#9656;');
      row.appendChild(b);
    } else row.appendChild(el('span',{'class':'sp'}));
    var a=el('a',{href:ROOT+'pages/'+n.i+'.html'});
    var label=top?('Chapter '+n.n+' · '+n.t):n.t;
    a.innerHTML=(top||!n.n?'':'<span class="nm">'+esc(n.n)+'</span>')+esc(label);
    if(n.i===PAGE)a.setAttribute('aria-current','page');
    row.appendChild(a); li.appendChild(row);
    if(n.c.length){
      var ul=el('ul'); if(!open[n.i])ul.hidden=true;
      n.c.forEach(function(k){ul.appendChild(item(k,false))}); li.appendChild(ul);
      row.firstChild.addEventListener('click',function(ev){
        var b=ev.currentTarget, ex=b.getAttribute('aria-expanded')==='true';
        b.setAttribute('aria-expanded',ex?'false':'true'); ul.hidden=ex;
      });
    }
    return li;
  }
  var keys=el('div',{'class':'keys'});
  keys.innerHTML='<h2>Key chapters</h2><ul>'+
    '<li><a href="'+ROOT+'pages/chapter-4.html"><span class="pad">4</span><span>ATX2 library<small>Functions for motors, sensors, sound, serial</small></span></a></li>'+
    '<li><a href="'+ROOT+'pages/chapter-5.html"><span class="pad">5</span><span>GLCD activity<small>Text and graphics on the colour display</small></span></a></li>'+
    '<li><a href="'+ROOT+'functions.html"><span class="pad">f</span><span>Function index<small>Every signature on one page</small></span></a></li></ul>'+
    '<h2>All contents</h2>';
  side.appendChild(keys);
  var tree=el('ul',{'class':'tree'}); NAV.forEach(function(n){tree.appendChild(item(n,true))}); side.appendChild(tree);
  var cur=$('[aria-current=page]',side); if(cur){ var r=cur.getBoundingClientRect(), sr=side.getBoundingClientRect(); if(r.bottom>sr.bottom-40||r.top<sr.top) side.scrollTop+=r.top-sr.top-120; }
  if(PAGE==='functions'||PAGE==='contents'||!PAGE){}
  /* mobile menu */
  var menu=$('#menu'), scrim=$('#scrim');
  function setMenu(o){side.classList.toggle('open',o);scrim.hidden=!o;menu.setAttribute('aria-expanded',o)}
  menu.addEventListener('click',function(){setMenu(!side.classList.contains('open'))});
  scrim.addEventListener('click',function(){setMenu(false)});
  side.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});

  /* copy buttons */
  $$('pre.code').forEach(function(pre){
    var b=el('button',{'class':'cpy',type:'button','aria-label':'Copy code'},'Copy');
    b.addEventListener('click',function(){
      var t=pre.querySelector('code').innerText;
      function done(){b.textContent='Copied';setTimeout(function(){b.textContent='Copy'},1400)}
      if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done);
      else{var ta=el('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done()}catch(e){}ta.remove()}
    });
    pre.appendChild(b);
  });

  /* function index filter */
  var ff=$('#fnfilter');
  if(ff)ff.addEventListener('input',function(){
    var q=ff.value.toLowerCase().trim().split(/\s+/).filter(Boolean), any=false;
    $$('#fnlist li').forEach(function(li){var s=li.dataset.s,ok=q.every(function(t){return s.indexOf(t)>-1});li.hidden=!ok;any=any||ok});
    $$('#fnlist .fgroup').forEach(function(g){g.hidden=!$$('li',g).some(function(l){return !l.hidden})});
    $('#fnnone').hidden=any;
  });

  /* search */
  var modal=$('#smodal'), input=$('#sinput'), list=$('#sresults'), sel=-1, hits=[];
  function openS(){modal.hidden=false;input.value='';list.innerHTML='';sel=-1;input.focus();render()}
  function closeS(){modal.hidden=true}
  function render(){
    var q=input.value.toLowerCase().trim();
    list.innerHTML='';sel=-1;hits=[];
    if(!q){
      var key=(window.SEARCH||[]).filter(function(e){return /^(4|5)\.\d+$/.test(e.n)||e.u.indexOf('chapter-4')>-1||e.u.indexOf('chapter-5')>-1}).slice(0,8);
      hits=key.map(function(e){return {e:e,s:''}});
    } else {
      var toks=q.split(/\s+/);
      (window.SEARCH||[]).forEach(function(e){
        var t=e.t.toLowerCase(),x=e.x.toLowerCase(),sc=0;
        for(var i=0;i<toks.length;i++){
          var w=toks[i];
          if(t.indexOf(w)<0&&x.indexOf(w)<0)return;
          if(t===w)sc+=60;else if(t.indexOf(w)>-1)sc+=25;
          if(e.n===w)sc+=40;
          var cnt=0,p=-1;while(cnt<6&&(p=x.indexOf(w,p+1))>-1)cnt++;sc+=cnt;
        }
        if(e.k)sc+=3;
        hits.push({e:e,s:sc,x:x});
      });
      hits.sort(function(a,b){return b.s-a.s});
    }
    hits=hits.slice(0,25);
    hits.forEach(function(h,i){
      var e=h.e, sn='';
      if(q){
        var x=e.x,lx=x.toLowerCase(),w=q.split(/\s+/)[0],p=lx.indexOf(w);
        if(p>-1){var a=Math.max(0,p-50),b=Math.min(x.length,p+90);sn=(a?'…':'')+esc(x.slice(a,p))+'<mark>'+esc(x.slice(p,p+w.length))+'</mark>'+esc(x.slice(p+w.length,b))+(b<x.length?'…':'')}
      }
      var li=el('li'),a=el('a',{href:ROOT+e.u,role:'option'});
      a.innerHTML='<span class="rt">'+esc(e.t)+'</span><span class="rc">'+esc(e.c)+'</span>'+(sn?'<span class="rs">'+sn+'</span>':'');
      li.appendChild(a);list.appendChild(li);
    });
    if(q&&!hits.length)list.innerHTML='<li><a href="#" tabindex="-1" onclick="return false">No matches</a></li>';
    move(hits.length?0:-1);
  }
  function move(i){
    var as=$$('a',list); if(!as.length)return;
    if(sel>-1&&as[sel])as[sel].removeAttribute('aria-selected');
    sel=(i+as.length)%as.length; as[sel].setAttribute('aria-selected','true'); as[sel].scrollIntoView({block:'nearest'});
  }
  $('#searchbtn').addEventListener('click',openS);
  input.addEventListener('input',render);
  input.addEventListener('keydown',function(e){
    if(e.key==='ArrowDown'){e.preventDefault();move(sel+1)}
    else if(e.key==='ArrowUp'){e.preventDefault();move(sel-1)}
    else if(e.key==='Enter'){var as=$$('a',list);if(as[sel]&&as[sel].getAttribute('href')!=='#')location.href=as[sel].href}
  });
  modal.addEventListener('mousedown',function(e){if(e.target===modal)closeS()});
  document.addEventListener('keydown',function(e){
    var tag=(document.activeElement||{}).tagName;
    if(e.key==='Escape'&&!modal.hidden){closeS();return}
    if((e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&tag!=='INPUT'&&tag!=='TEXTAREA'){e.preventDefault();openS()}
  });
})();
