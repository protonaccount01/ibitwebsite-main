export async function onRequestGet(context) {
    const { env, params } = context;
    
    // URL থেকে ফাইলের নাম বের করা
    const key = params.path.join('/'); 
    
    // R2 থেকে ফাইল রিড করা
    const object = await env.BUCKET.get(key);
    if (!object) return new Response('File not found', { status: 404 });
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    
    // PDF ফাইল ব্রাউজারে সার্ভ করা
    return new Response(object.body, { headers });
}
