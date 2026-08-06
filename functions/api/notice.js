export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    // Lazy Auto-Delete: যখনই কেউ API কল করবে, এক্সপায়ার হওয়া নোটিশ ডিলিট হয়ে যাবে
    const today = new Date().toISOString().split('T')[0];
    await env.DB.prepare('DELETE FROM notices WHERE auto_delete_date IS NOT NULL AND auto_delete_date < ?').bind(today).run();

    if (method === 'GET') {
        const { results } = await env.DB.prepare('SELECT * FROM notices ORDER BY created_at DESC').all();
        return Response.json(results);
    }

    // Admin Only Actions (POST, DELETE) - Cookie check
    const cookieHeader = request.headers.get('Cookie') || '';
    if (!cookieHeader.includes('admin_auth=true')) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (method === 'POST') {
        const { title, content, auto_delete_date } = await request.json();
        const dateVal = auto_delete_date ? auto_delete_date : null;
        
        await env.DB.prepare('INSERT INTO notices (title, content, auto_delete_date) VALUES (?, ?, ?)')
            .bind(title, content, dateVal).run();
        return Response.json({ success: true });
    }

    if (method === 'DELETE') {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        await env.DB.prepare('DELETE FROM notices WHERE id = ?').bind(id).run();
        return Response.json({ success: true });
    }

    return new Response('Method not allowed', { status: 405 });
}
