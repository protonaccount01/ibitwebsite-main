export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;

    try {
        // Auto-Delete Logic
        const today = new Date().toISOString().split('T')[0];
        await env.DB.prepare('DELETE FROM notices WHERE auto_delete_date IS NOT NULL AND auto_delete_date < ?').bind(today).run();

        // Get Notice List
        if (method === 'GET') {
            const { results } = await env.DB.prepare('SELECT * FROM notices ORDER BY created_at DESC').all();
            return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
        }

        // Check Auth for POST and DELETE
        const cookieHeader = request.headers.get('Cookie') || '';
        if (!cookieHeader.includes('admin_auth=true')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        // Publish Notice
        if (method === 'POST') {
            const { title, content, auto_delete_date } = await request.json();
            const dateVal = auto_delete_date ? auto_delete_date : null;
            
            await env.DB.prepare('INSERT INTO notices (title, content, auto_delete_date) VALUES (?, ?, ?)')
                .bind(title, content, dateVal).run();
            return new Response(JSON.stringify({ success: true }));
        }

        // Delete Notice
        if (method === 'DELETE') {
            const url = new URL(request.url);
            const id = url.searchParams.get('id');
            await env.DB.prepare('DELETE FROM notices WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }));
        }

        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
