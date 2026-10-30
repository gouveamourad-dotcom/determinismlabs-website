(function(){
  var dialog=document.getElementById('contact');
  if(!dialog||typeof dialog.showModal!=='function')return;
  var form=dialog.querySelector('form');
  var status=dialog.querySelector('.contact-status');
  var submit=form.querySelector('button[type=submit]');
  var endpoint=form.getAttribute('action');

  function open(e){
    if(e)e.preventDefault();
    dialog.classList.remove('is-done');
    status.textContent='';status.classList.remove('error');
    dialog.showModal();
    var first=form.querySelector('input[name=name]');
    if(first)setTimeout(function(){first.focus();},30);
  }
  function close(){dialog.close();}

  document.querySelectorAll('[data-contact-open]').forEach(function(el){el.addEventListener('click',open);});
  dialog.querySelectorAll('[data-contact-close]').forEach(function(el){el.addEventListener('click',close);});
  dialog.addEventListener('click',function(e){if(e.target===dialog)close();});

  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!form.reportValidity())return;
    if(form.querySelector('input[name=_hp]').value)return;
    var data={};
    new FormData(form).forEach(function(v,k){if(k!=='_hp')data[k]=v;});
    submit.disabled=true;
    status.classList.remove('error');
    status.textContent=form.getAttribute('data-sending')||'Sending…';
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
      .then(function(r){return r.json().catch(function(){return {};}).then(function(j){return {ok:r.ok,json:j};});})
      .then(function(res){
        if(res.ok&&res.json.success!==false){
          dialog.classList.add('is-done');
          form.reset();
          status.textContent='';
        }else{throw new Error((res.json&&res.json.message)||'Request failed');}
      })
      .catch(function(){
        status.classList.add('error');
        status.textContent=form.getAttribute('data-error')||'Something went wrong. Please email us directly at contact@determinismlabs.ai.';
      })
      .then(function(){submit.disabled=false;});
  });
})();
