export const EDITOR = 'eduardosoto30@hotmail.com';
export const MAX_IMAGE = 512000;
export function cleanContent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(k => !['fr','es','image'].includes(k))) throw Error('Contenu non valide.');
  const result = {};
  for (const lang of ['fr','es']) {
    const v = input[lang];
    if (!v || typeof v !== 'object' || Object.keys(v).some(k => !['title','message','image_alt'].includes(k))) throw Error('Langue non valide.');
    result[lang] = {};
    for (const [key,max,required] of [['title',160,true],['message',3000,true],['image_alt',200,false]]) {
      const val = v[key] ?? '';
      if (typeof val !== 'string' || val.length > max || (required && !val.trim())) throw Error('Vérifiez les titres et les messages.');
      result[lang][key] = val.trim();
    }
  }
  const image = input.image ?? '';
  if (typeof image !== 'string') throw Error('Une seule image est permise.');
  if (image && !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image) && !/^\/assets\/uploads\/babillard\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(image)) throw Error('Image non valide.');
  if (image.length > Math.ceil(MAX_IMAGE/3)*4+30) throw Error('Image trop volumineuse.');
  result.image = image;
  return result;
}
export function createHandler({user,origin,store,imageProcessor,fallback}) {
  return async req => {
    const json = (v,status=200) => Response.json(v,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    try {
      if (req.method === 'GET') return json(await store().get('published',{type:'json'}) || fallback);
      if (req.method !== 'POST') return json({error:'Méthode non permise.'},405);
      try { origin(req); } catch { return json({error:'Origine non autorisée.'},403); }
      const editor = await user();
      if (!editor) return json({error:'Connectez-vous à nouveau.'},401);
      if (editor.email?.toLowerCase() !== EDITOR) return json({error:'Accès non autorisé.'},403);
      if (!req.headers.get('content-type')?.startsWith('application/json')) return json({error:'Format non valide.'},415);
      const raw = await req.text();
      if (raw.length > 750000) return json({error:'Image trop volumineuse.'},413);
      let next;
      try {
        next = cleanContent(JSON.parse(raw));
        if (next.image.startsWith('data:')) {
          const bytes = Buffer.from(next.image.split(',')[1],'base64');
          if (bytes.length > MAX_IMAGE) throw Error('Image trop volumineuse.');
          const resized = await imageProcessor(bytes);
          if (resized.length > MAX_IMAGE) throw Error('Image trop volumineuse.');
          next.image = 'data:image/jpeg;base64,' + resized.toString('base64');
        }
      } catch (e) { return json({error:e.message || 'Contenu non valide.'},400); }
      const db = store();
      const previous = await db.get('published',{type:'json'});
      if (previous) await db.setJSON('previous',previous);
      await db.setJSON('published',next);
      return json({ok:true});
    } catch { return json({error:'Publication indisponible. Réessayez dans un instant.'},503); }
  };
}
