
(function(){
  function fitStage(){var s=Math.min(window.innerWidth/1600,window.innerHeight/900);document.documentElement.style.setProperty('--s',s);}
  window.addEventListener('resize',fitStage); fitStage();
  var slides=[].slice.call(document.querySelectorAll('.slide'));
  var cur=-1, bar=document.getElementById('bar'), ctr=document.getElementById('ctr'), sec=document.getElementById('sec');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmtInt=function(n){return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');};
  var fmt=function(el,n){var d=+el.dataset.dec||0; if(el.dataset.fmt==='eur') return fmtInt(n)+' €'; if(d) return n.toFixed(d).replace('.',','); return fmtInt(n);};

  function count(el){
    var target=parseFloat(el.dataset.count); if(el.dataset.done==='1'){el.textContent=fmt(el,target);return;}
    el.dataset.done='1';
    if(reduce){el.textContent=fmt(el,target);return;}
    var t0=performance.now(), dur=1100+Math.min(700,String(target).length*80);
    (function step(){var p=Math.max(0,Math.min(1,(performance.now()-t0)/dur)); var e=1-Math.pow(1-p,3); el.textContent=fmt(el,target*e); if(p<1) requestAnimationFrame(step); else el.textContent=fmt(el,target);})(t0);
  }

  /* bar charts */
  var tip=document.getElementById('tip');
  function chart(host){
    if(host.dataset.built) return; host.dataset.built='1';
    var cfg=JSON.parse(host.dataset.chart), W=520, H=260, padL=8, padR=8, padT=26, padB=28;
    var max=0; cfg.series.forEach(function(s){s.values.forEach(function(v){if(v!=null&&v>max)max=v;});});
    var nice=Math.ceil(max/ (max>1000?250:max>100?25:10))*(max>1000?250:max>100?25:10);
    var n=cfg.labels.length, k=cfg.series.length, gw=(W-padL-padR)/n, bw=Math.min(56,(gw-18)/k), gap=2;
    var y=function(v){return padT+(H-padT-padB)*(1-v/nice);};
    var svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+(cfg.series.map(function(s){return s.name;}).join(' et '))+'">';
    [0.25,0.5,0.75,1].forEach(function(f){var yy=y(nice*f); svg+='<line class="grid" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+yy+'" y2="'+yy+'"/>';});
    cfg.labels.forEach(function(lab,i){
      var x0=padL+gw*i+(gw-(bw*k+gap*(k-1)))/2;
      cfg.series.forEach(function(s,j){
        var v=s.values[i]; if(v==null) return; var x=x0+j*(bw+gap), yy=y(v), h=(H-padB)-yy;
        svg+='<g data-tip="'+s.name+' · '+lab+' : <b>'+fmt({dataset:{}},v)+(cfg.unit||'')+'</b>">';
        svg+='<rect class="hit" x="'+(x-4)+'" y="'+padT+'" width="'+(bw+8)+'" height="'+(H-padB-padT)+'"/>';
        svg+='<rect class="bar" x="'+x+'" y="'+yy+'" width="'+bw+'" height="'+h+'" rx="4" ry="4" fill="'+s.color+'" style="transition-delay:'+(0.15+i*0.08+j*0.05)+'s"/>';
        svg+='<text class="lab" x="'+(x+bw/2)+'" y="'+(yy-7)+'" text-anchor="middle">'+fmt({dataset:{}},v)+'</text></g>';
      });
      svg+='<text class="ax" x="'+(padL+gw*i+gw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+lab+'</text>';
    });
    svg+='<line class="base" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+(H-padB)+'" y2="'+(H-padB)+'"/></svg>';
    host.innerHTML=svg;
    host.querySelectorAll('g[data-tip]').forEach(function(g){
      g.addEventListener('mousemove',function(e){tip.innerHTML=g.dataset.tip;tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px';tip.classList.add('on');});
      g.addEventListener('mouseleave',function(){tip.classList.remove('on');});
    });
  }



  /* sparklines : 12 mois, valeurs null = mois sans donnée */
  var SPM=["Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep"];
  function sfmt(v,f){
    if(v==null) return 'non relevé';
    if(f==='eur') return fmtInt(v)+' €';
    if(f==='keur') return fmtInt(v/1000)+' k€';
    if(f==='pct') return fmtInt(v)+' %';
    if(f==='h') return v<1? Math.round(v*60)+' min' : (v<48? (Math.round(v*10)/10).toString().replace('.',',')+' h' : Math.round(v/24)+' j');
    if(f==='min') return Math.round(v)+' min';
    if(f==='dur'){var m=Math.floor(v/60), sec=Math.round(v-m*60); return m+' min '+(sec<10?'0':'')+sec+' s';}
    return fmtInt(v);
  }
  function slab(v,f){
    if(v==null) return '';
    if(f==='eur'||f==='keur'){ return v>=100000? (Math.round(v/1000))+' k€' : v>=10000? (Math.round(v/100)/10).toString().replace('.',',')+' k€' : fmtInt(v)+' €'; }
    if(f==='pct') return fmtInt(v)+' %';
    if(f==='h'||f==='min'||f==='dur') return sfmt(v,f);
    return fmtInt(v);
  }
  function spark(host){
    if(host.dataset.built) return; host.dataset.built='1';
    var vals=JSON.parse(host.dataset.spark), labels=host.dataset.labels?JSON.parse(host.dataset.labels):SPM, f=host.dataset.fmt||'int', name=host.dataset.name||'';
    var cs=getComputedStyle(host), W=(host.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0))||300, H=(host.clientHeight-parseFloat(cs.paddingTop||0)-parseFloat(cs.paddingBottom||0))||34, px=5, inl=host.classList.contains('inl'), pt=inl?4:15, pb=3, n=vals.length;
    var max=0; vals.forEach(function(v){if(v!=null&&v>max)max=v;}); if(!max) max=1;
    var i0=0, i1=n-1; while(i0<n&&vals[i0]==null) i0++; while(i1>0&&vals[i1]==null) i1--; if(i1<=i0){i0=0;i1=n-1;}
    var xs=function(i){return px+(W-2*px)*(i-i0)/(i1-i0);}, ys=function(v){return pt+(H-pt-pb)*(1-v/max);};
    if(host.dataset.kind==='bars'){
      var gw=(W-2*px)/n, bw=Math.max(4,gw*.55), bsvg='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+name+'">';
      vals.forEach(function(v,i){ var x=px+gw*i+(gw-bw)/2; if(v!=null){ var yy=ys(v); bsvg+='<rect class="br" x="'+x.toFixed(1)+'" y="'+yy.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+((H-pb)-yy).toFixed(1)+'" rx="2" ry="2" style="transition-delay:'+(0.2+i*0.06)+'s"/>'; } else { bsvg+='<rect class="nb" x="'+x.toFixed(1)+'" y="'+(H-pb-2)+'" width="'+bw.toFixed(1)+'" height="2" rx="1"/>'; }
        bsvg+='<rect class="hz" x="'+(px+gw*i).toFixed(1)+'" y="0" width="'+gw.toFixed(1)+'" height="'+H+'" data-tip="'+(name?name+' · ':'')+labels[i]+' : <b>'+sfmt(v,f)+'</b>"/>'; });
      var fb=null,lb=null; vals.forEach(function(v,i){ if(v!=null){ if(fb==null) fb=i; lb=i; } });
      if(!inl&&fb!=null){ var bl=function(i,anchor){ var x=px+gw*i+gw/2; return '<text class="sl" x="'+x.toFixed(1)+'" y="'+(ys(vals[i])-5).toFixed(1)+'" text-anchor="'+anchor+'">'+slab(vals[i],f)+'</text>'; }; if(fb!==lb) bsvg+=bl(fb,'start'); bsvg+=bl(lb,'end'); }
      host.innerHTML=bsvg+'</svg>';
      if(reduce) host.classList.add('on'); else requestAnimationFrame(function(){requestAnimationFrame(function(){host.classList.add('on');});});
      host.querySelectorAll('[data-tip]').forEach(function(g){ g.addEventListener('mousemove',function(e){tip.innerHTML=g.dataset.tip;tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px';tip.classList.add('on');}); g.addEventListener('mouseleave',function(){tip.classList.remove('on');}); });
      return;
    }
    var pts=[]; vals.forEach(function(v,i){ if(v!=null) pts.push([xs(i),ys(v),i]); });
    var svg='<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+name+'">';
    if(pts.length>1){
      var dAll='M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' L');
      svg+='<path class="ar" d="'+dAll+' L'+pts[pts.length-1][0].toFixed(1)+' '+(H-pb)+' L'+pts[0][0].toFixed(1)+' '+(H-pb)+' Z"/>';
      var solid='', gaps='';
      for(var k=1;k<pts.length;k++){ var a=pts[k-1], b=pts[k], seg='M'+a[0].toFixed(1)+' '+a[1].toFixed(1)+' L'+b[0].toFixed(1)+' '+b[1].toFixed(1); if(b[2]-a[2]===1) solid+=seg+' '; else gaps+=seg+' '; }
      if(gaps) svg+='<path class="ln gap" d="'+gaps+'"/>';
      svg+='<path class="ln" d="'+solid+'"/>';
    } else if(pts.length===1) svg+='<circle class="dt" cx="'+pts[0][0].toFixed(1)+'" cy="'+pts[0][1].toFixed(1)+'" r="3"/>';
    var last=null; for(var i=n-1;i>=0;i--){ if(vals[i]!=null){last=i;break;} }
    if(!inl){ var lab=function(i,anchor){ var v=vals[i], top=ys(v); for(var k=Math.max(0,i-3);k<=Math.min(n-1,i+3);k++){ if(vals[k]!=null&&ys(vals[k])<top) top=ys(vals[k]); } return '<text class="sl" x="'+(anchor==='end'?xs(i)-6:xs(i)).toFixed(1)+'" y="'+(top-6).toFixed(1)+'" text-anchor="'+anchor+'">'+slab(v,f)+'</text>'; };
      if(i0!==last) svg+=lab(i0,'start'); if(last!=null) svg+=lab(last,'end'); }
    if(last!=null) svg+='<circle class="dt" cx="'+xs(last).toFixed(1)+'" cy="'+ys(vals[last]).toFixed(1)+'" r="'+(inl?2.5:3.5)+'"/>';
    vals.forEach(function(v,i){ if(i<i0||i>i1) return; var x0=i>i0?(xs(i-1)+xs(i))/2:0, x1=i<i1?(xs(i)+xs(i+1))/2:W; svg+='<rect class="hz" x="'+x0.toFixed(1)+'" y="0" width="'+(x1-x0).toFixed(1)+'" height="'+H+'" data-tip="'+(name?name+' · ':'')+labels[i]+' : <b>'+sfmt(v,f)+'</b>"/>'; });
    svg+='</svg>';
    host.innerHTML=svg;
    var ln=host.querySelectorAll('.ln');
    if(!reduce){ ln.forEach(function(p){ if(p.classList.contains('gap')) return; var L=p.getTotalLength(); p.style.strokeDasharray=L; p.style.strokeDashoffset=L;}); requestAnimationFrame(function(){requestAnimationFrame(function(){host.classList.add('on');});}); } else host.classList.add('on');
    host.querySelectorAll('[data-tip]').forEach(function(g){
      g.addEventListener('mousemove',function(e){tip.innerHTML=g.dataset.tip;tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px';tip.classList.add('on');});
      g.addEventListener('mouseleave',function(){tip.classList.remove('on');});
    });
  }

  /* combo : montant (ligne + aire) au-dessus, nombre (barres) en dessous, même axe x */
  function combo(host){
    if(host.dataset.built) return; host.dataset.built='1';
    var cfg=JSON.parse(host.dataset.combo), W=560, H=300, padL=8, padR=8, top=22, mid=16, bot=24;
    var hA=150, yA0=top, yA1=top+hA, yB0=yA1+mid+18, yB1=H-bot;
    var n=cfg.labels.length, gw=(W-padL-padR)/n;
    var maxA=Math.max.apply(null,cfg.amount), niceA=Math.ceil(maxA/250)*250;
    var maxB=Math.max.apply(null,cfg.count), niceB=Math.ceil(maxB/500)*500;
    var xs=function(i){return padL+gw*i+gw/2;};
    var ya=function(v){return yA1-(hA)*(v/niceA);}, yb=function(v){return yB1-(yB1-yB0)*(v/niceB);};
    var svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Encaissements mensuels, montant et nombre">';
    [0.5,1].forEach(function(f){svg+='<line class="grid" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+ya(niceA*f)+'" y2="'+ya(niceA*f)+'"/>';});
    svg+='<text class="ax" x="'+padL+'" y="'+(yA0-8)+'">'+(cfg.labelA||'Montant, k€')+'</text>';
    svg+='<text class="ax" x="'+padL+'" y="'+(yB0-6)+'">'+(cfg.labelB||'Transactions entrantes')+'</text>';
    var pts=cfg.amount.map(function(v,i){return [xs(i),ya(v)];});
    var d='M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' L ');
    svg+='<path class="area" d="'+d+' L '+pts[pts.length-1][0].toFixed(1)+' '+yA1+' L '+pts[0][0].toFixed(1)+' '+yA1+' Z"/>';
    svg+='<path class="line" d="'+d+'"/>';
    cfg.labels.forEach(function(lab,i){
      var bw=Math.min(26,gw-10), x=xs(i)-bw/2, yy=yb(cfg.count[i]);
      svg+='<g class="col" data-tip="'+lab+' : <b>'+fmtInt(cfg.amount[i])+' '+(cfg.unitA||'k€')+'</b> · '+fmtInt(cfg.count[i])+' '+(cfg.unitB||'transactions')+'">';
      svg+='<rect class="hitc" x="'+(padL+gw*i)+'" y="'+yA0+'" width="'+gw+'" height="'+(yB1-yA0)+'" fill="transparent"/>';
      svg+='<rect class="bar" x="'+x+'" y="'+yy+'" width="'+bw+'" height="'+(yB1-yy)+'" rx="3" ry="3" fill="#3FCC8C" style="transition-delay:'+(0.1+i*0.05)+'s"/>';
      if(i===n-2||i===0){svg+='<text class="lab" x="'+xs(i)+'" y="'+(ya(cfg.amount[i])-9)+'" text-anchor="middle">'+fmtInt(cfg.amount[i])+'</text>';} if(i===n-1){svg+='<text class="lab" x="'+(xs(i)+8)+'" y="'+(ya(cfg.amount[i])+4)+'">'+fmtInt(cfg.amount[i])+'</text>';}
      if(i===n-2||i===0){svg+='<text class="lab" x="'+xs(i)+'" y="'+(yy-6)+'" text-anchor="middle">'+fmtInt(cfg.count[i])+'</text>';}
      svg+='<circle class="pt" cx="'+xs(i)+'" cy="'+ya(cfg.amount[i])+'" r="'+(i===n-2?5:3.5)+'"/>';
      svg+='<text class="ax" x="'+xs(i)+'" y="'+(H-6)+'" text-anchor="middle">'+lab+'</text></g>';
    });
    svg+='<line class="base" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+yA1+'" y2="'+yA1+'"/><line class="base" x1="'+padL+'" x2="'+(W-padR)+'" y1="'+yB1+'" y2="'+yB1+'"/></svg>';
    host.innerHTML=svg;
    host.querySelectorAll('g[data-tip]').forEach(function(g){
      g.addEventListener('mousemove',function(e){tip.innerHTML=g.dataset.tip;tip.style.left=e.clientX+'px';tip.style.top=e.clientY+'px';tip.classList.add('on');});
      g.addEventListener('mouseleave',function(){tip.classList.remove('on');});
    });
  }
  /* timer */
  var timerEl=document.getElementById('timer'), tval=document.getElementById('tval'), tLeft=0, tTotal=0, tRun=false, tHandle=null;
  function tShow(){var s=Math.abs(tLeft), m=Math.floor(s/60), r=s%60; tval.textContent=(tLeft<0?'−':'')+m+':'+(r<10?'0':'')+r; timerEl.classList.toggle('warn',tLeft<=60&&tLeft>0); timerEl.classList.toggle('over',tLeft<=0); timerEl.classList.toggle('paused',!tRun);}
  function tTick(){if(!tRun)return; tLeft--; tShow();}
  function tStart(total){clearInterval(tHandle); tTotal=total; tLeft=total; tRun=true; timerEl.classList.add('on'); tShow(); tHandle=setInterval(tTick,1000);}
  function tStop(){clearInterval(tHandle); tRun=false; timerEl.classList.remove('on','warn','over');}
  function tToggle(){if(!tTotal)return; tRun=!tRun; tShow();}
  function tReset(){if(!tTotal)return; tLeft=tTotal; tRun=true; tShow();}

  function go(i,push){
    i=Math.max(0,Math.min(slides.length-1,i)); if(i===cur) return;
    if(cur>=0){var old=slides[cur]; old.classList.remove('active'); old.classList.add('leaving'); setTimeout(function(){old.classList.remove('leaving');},500);}
    cur=i; var s=slides[i]; s.classList.add('active');
    bar.style.width=((i+1)/slides.length*100)+'%'; ctr.textContent=(i+1<10?'0':'')+(i+1)+' / '+slides.length; sec.textContent=s.dataset.section||'';
    s.querySelectorAll('[data-count]').forEach(function(el){setTimeout(function(){count(el);},250);});
    s.querySelectorAll('.chart[data-chart]').forEach(chart);
    s.querySelectorAll('.chart[data-combo]').forEach(combo);
    s.querySelectorAll('.spark[data-spark]').forEach(spark);
    var t=parseInt(s.dataset.timer||'0',10); if(t) tStart(t); else tStop();
    try{ if(window.parent&&window.parent!==window) window.parent.postMessage({type:'deck:slide',index:i+1,total:slides.length},'*'); }catch(e){}
    if(push!==false) history.replaceState(null,'','#'+(i+1));
  }
  var sectionStarts=slides.map(function(s,i){return (s.classList.contains('divider')||s.classList.contains('qa'))?i:-1;}).filter(function(i){return i>=0;}).slice(0,9);
  document.addEventListener('keydown',function(e){
    if(e.metaKey||e.ctrlKey||e.altKey) return;
    var k=e.key;
    if(k==='ArrowRight'||k===' '||k==='PageDown'||k==='Enter'){e.preventDefault();go(cur+1);}
    else if(k==='ArrowLeft'||k==='PageUp'||k==='Backspace'){e.preventDefault();go(cur-1);}
    else if(k==='Home'){go(0);} else if(k==='End'){go(slides.length-1);}
    else if(k==='t'||k==='T'){tToggle();} else if(k==='r'||k==='R'){tReset();}
    else if(k==='f'||k==='F'){if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen();}
    else if(k==='?'){document.getElementById('help').classList.toggle('on');}
    else if(k>='1'&&k<='9'){if(sectionStarts[+k-1]!=null) go(sectionStarts[+k-1]);}
    else if(k==='Escape'){document.getElementById('help').classList.remove('on');}
  });
  document.getElementById('navR').addEventListener('click',function(){go(cur+1);});
  document.getElementById('navL').addEventListener('click',function(){go(cur-1);});
  document.getElementById('help').addEventListener('click',function(){this.classList.remove('on');});
  var tx=null; document.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;},{passive:true});
  document.addEventListener('touchend',function(e){if(tx===null)return; var dx=e.changedTouches[0].clientX-tx; if(Math.abs(dx)>50) go(cur+(dx<0?1:-1)); tx=null;});
  window.addEventListener('hashchange',function(){var h=parseInt(location.hash.slice(1),10); if(h) go(h-1,false);});

  /* ---- scène login V2 : scénarios, compteur, rotation, ajustement ---- */
  (function(){
    var wallet='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.66 2.52 9.73 9.32H6.88c-.68 0-1.33.14-1.92.39l1.75-4.18c1.31-3.03 2.79-3.72 5.95-2.58Z"/><path d="M18.05 9.52a5 5 0 0 0-1.41-.2H9.73l2.93-6.8c.15.05.29.12.44.18l2.21.93c1.23.51 2.09 1.04 2.61 1.68.36.44.57 1.02.51 1.8-.03.7-.2 1.46-.38 2.41Z"/><path d="M21.52 14.2v1.95c0 3.7-1.95 5.85-5.86 5.85H7.86c-4.03 0-5.85-2.15-5.85-5.85V14.2c0-2.01 1.22-3.74 2.96-4.49a5 5 0 0 1 1.92-.39h9.76c.49 0 .97.07 1.41.2 2 .61 3.46 2.47 3.46 4.68Z"/></svg>';
    var airbnb='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0B0B0C" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
    var scenes=[
      {src:'lease',hl1:'One rent collected.',hl2:'Everyone gets their share.',label:'Rent collected',sub:'Lease L-2048',ini:'MG',r1:'Manager',notes:['Owner share','8 % commission','Cleaning service','Platform fee','Partner fee'],targets:[1050,100,100,12,38],icon:'<span style="width:26px;height:26px;border-radius:8px 3px 3px 3px;background:#173CC1;display:flex;align-items:center;justify-content:center">'+wallet+'</span>'},
      {src:'booking',hl1:'One booking paid.',hl2:'An instant split.',label:'Booking paid',sub:'Short stay · guest',ini:'HS',r1:'Host',notes:['Net share','20 % commission','Cleaning','Platform fee','Partner fee'],targets:[510,150,90,15,35],icon:'<span style="width:26px;height:26px;border-radius:8px 3px 3px 3px;background:#fff;display:flex;align-items:center;justify-content:center">'+airbnb+'</span>'}
    ];
    var $=function(id){return document.getElementById(id);};
    var scene=$('scene'); if(!scene) return;
    var eur=function(n){return n.toLocaleString('fr-FR')+',00 €';};
    var idx=0, raf=null, rot=null;
    function render(vals){$('scTotal').textContent=eur(vals.reduce(function(a,b){return a+b;},0)); vals.forEach(function(v,i){$('scA'+i).textContent=eur(v);});}
    function show(i){
      idx=i; var s=scenes[i];
      $('scIcon').innerHTML=s.icon; $('scLabel').textContent=s.label; $('scSub').textContent=s.sub; $('scIni').textContent=s.ini; $('scR1').textContent=s.r1;
      s.notes.forEach(function(n,i){$('scN'+i).textContent=n;});
      $('scHl').innerHTML=s.hl1+'<br><b>'+s.hl2+'</b>';
      [].forEach.call($('scDots').children,function(b,j){b.classList.toggle('on',j===i);});
      ['scIcon','scHl'].forEach(function(id){var el=$(id); el.classList.remove('fade'); void el.offsetWidth; el.classList.add('fade');});
      if(raf) cancelAnimationFrame(raf);
      if(reduce){render(s.targets);return;}
      var t0=performance.now();
      (function step(){var now=performance.now(), k=Math.max(0,Math.min(1,(now-t0)/1700)), e=1-Math.pow(1-k,3); render(s.targets.map(function(v){return Math.round(v*e);})); if(k<1) raf=requestAnimationFrame(step);})(t0);
    }
    function arm(){clearInterval(rot); if(reduce) return; rot=setInterval(function(){show((idx+1)%scenes.length);},7600);}
    [].forEach.call($('scDots').children,function(b,j){b.addEventListener('click',function(){show(j);arm();});});
    function fit(){var w=scene.parentElement; var v=Math.max(.5,Math.min(w.clientWidth/660,w.clientHeight/590,1.12)); scene.style.transform='translate(-50%,-50%) scale('+v+')';}
    window.addEventListener('resize',fit); fit(); show(0); arm();
  })();
  var h0=parseInt(location.hash.slice(1),10); go(h0?h0-1:0,false);
})();
