import {login,logout,getUser,handleAuthCallback,acceptInvite,updateUser,requestPasswordRecovery,refreshSession} from '@netlify/identity';
const $ = id=>document.getElementById(id);
let inviteToken=null, image='', ready=false, dirty=false, imageBusy=false;
const endpoint='/.netlify/functions/babillard';
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function panels(active){for(const id of ['loginPanel','passwordPanel','editor'])$(id).hidden=id!==active;}
async function loadEditor(){
 const user=await getUser();
 if(!user){panels('loginPanel');$('logout').hidden=true;status('Connectez-vous pour modifier le babillard.');return;}
 $('logout').hidden=false;
 if(user.email?.toLowerCase()!=='eduardosoto30@hotmail.com'){panels(null);status('Ce compte n’est pas autorisé à modifier le babillard.',true);return;}
 const response=await fetch(endpoint,{cache:'no-store',credentials:'same-origin'});
 if(!response.ok)throw Error('La console n’est pas disponible. Réessayez dans un instant.');
 const data=await response.json();
 for(const l of ['fr','es'])for(const k of ['title','message','image_alt'])$(`${l}-${k}`).value=data[l]?.[k]||'';
 image=data.image||'';showImage();panels('editor');ready=true;dirty=false;status('Vous pouvez modifier les textes et l’image.');
}
function showImage(){ $('preview').hidden=!image; if(image)$('preview').src=image;else $('preview').removeAttribute('src'); }
function content(){const result={image};for(const l of ['fr','es']){result[l]={};for(const k of ['title','message','image_alt'])result[l][k]=$(`${l}-${k}`).value;}return result;}
function failure(e){status(e.message||'Une erreur est survenue. Réessayez.',true);}
$('loginForm').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{await login($('email').value.trim(),$('password').value);$('password').value='';await loadEditor();}catch{status('Connexion impossible. Vérifiez le courriel et le mot de passe.',true);}finally{button.disabled=false;}};
$('logout').onclick=async()=>{if(dirty&&!confirm('Quitter sans publier vos changements ?'))return;try{await logout();ready=false;dirty=false;await loadEditor();}catch(e){failure(e);}};
$('recover').onclick=async()=>{if(!$('email').checkValidity()){ $('email').reportValidity();return;}try{await requestPasswordRecovery($('email').value.trim());status('Si ce compte existe, un lien de récupération a été envoyé. Vérifiez aussi les courriels indésirables.');}catch(e){failure(e);}};
$('passwordForm').onsubmit=async e=>{e.preventDefault();if($('newPassword').value!==$('repeatPassword').value){status('Les deux mots de passe doivent être identiques.',true);return;}e.submitter.disabled=true;try{if(inviteToken){await acceptInvite(inviteToken,$('newPassword').value);inviteToken=null;}else{await updateUser({password:$('newPassword').value});}$('passwordForm').reset();await loadEditor();}catch(e){failure(e);}finally{e.submitter.disabled=false;}};
$('editor').addEventListener('input',()=>{dirty=true;});
$('removeImage').onclick=()=>{image='';$('image').value='';dirty=true;showImage();};
$('image').onchange=async()=>{
 const file=$('image').files[0];if(!file)return;
 imageBusy=true;$('publish').disabled=true;$('removeImage').disabled=true;
 try{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw Error('Choisissez une image JPG, PNG ou WebP de 5 Mo maximum.');
  const bmp=await createImageBitmap(file);const scale=Math.min(1,1200/bmp.width,800/bmp.height);
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bmp.width*scale));canvas.height=Math.max(1,Math.round(bmp.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bmp,0,0,canvas.width,canvas.height);bmp.close();
  let data;for(const q of [.85,.75,.65,.5]){data=canvas.toDataURL('image/jpeg',q);if(data.length<680000)break;}
  if(data.length>=680000)throw Error('Cette image reste trop volumineuse. Choisissez une autre image.');
  image=data;dirty=true;showImage();status('Image prête. Cliquez sur « Publier le babillard » pour l’enregistrer.');
 }catch(e){$('image').value='';failure(e);}finally{imageBusy=false;$('publish').disabled=false;$('removeImage').disabled=false;}
};
$('editor').onsubmit=async e=>{e.preventDefault();if(!ready||imageBusy)return;$('publish').disabled=true;status('Publication en cours…');try{await refreshSession();const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(content())});const d=await r.json();if(!r.ok)throw Error(d.error||'Publication impossible.');dirty=false;status('Babillard publié. Rechargez le site pour voir les changements.');}catch(e){failure(e);}finally{$('publish').disabled=false;}};
$('download').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(content(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='babillard-laesi.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
(async()=>{try{const callback=await handleAuthCallback();if(callback?.type==='invite'){inviteToken=callback.token;panels('passwordPanel');status('Bienvenue. Créez votre mot de passe pour activer votre accès.');}else if(callback?.type==='recovery'){panels('passwordPanel');$('passwordTitle').textContent='Choisir un nouveau mot de passe';status('Choisissez votre nouveau mot de passe.');}else await loadEditor();}catch(e){panels('loginPanel');failure(e);}})();
