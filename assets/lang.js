(function(){
  var KEY='dl-lang';
  var isPt=(document.documentElement.lang||'').toLowerCase().indexOf('pt')===0;
  var stored=null;
  try{stored=localStorage.getItem(KEY);}catch(e){}

  function go(path){location.replace(path+location.search+location.hash);}

  document.addEventListener('DOMContentLoaded',function(){
    var links=document.querySelectorAll('[data-lang]');
    for(var i=0;i<links.length;i++){
      links[i].addEventListener('click',function(){
        try{localStorage.setItem(KEY,this.getAttribute('data-lang'));}catch(e){}
      });
    }
  });

  if(stored==='pt'&&!isPt){go('/pt/');return;}
  if(stored==='en'&&isPt){go('/');return;}
  if(stored)return;

  if(!isPt){
    var first=(navigator.languages&&navigator.languages[0])||navigator.language||'';
    if(/^pt\b/i.test(first))go('/pt/');
  }
})();
