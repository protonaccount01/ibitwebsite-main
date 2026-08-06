export async function onRequestPost(context) {
    const { request, env } = context;

    // Auth Check
    const cookie = request.headers.get('Cookie') || '';
    if (!cookie.includes('admin_auth=true')) return new Response('Unauthorized', { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return new Response('No file uploaded', { status: 400 });

    // ফাইলের নাম ইউনিক করা
    const fileName = Date.now() + '_' + file.name.replace(/\s+/g, '_');
    
    // R2 বাকেটে আপলোড করা
    await env.BUCKET.put(fileName, file.stream(), { httpMetadata: { contentType: file.type } });
    
    return new Response(JSON.stringify({ file_url: '/files/' + fileName }), { 
        headers: { 'Content-Type': 'application/json' } 
    });
}
