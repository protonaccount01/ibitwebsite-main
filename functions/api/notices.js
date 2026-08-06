export async function onRequest(context) {
    const { request, env } = context;
    const method = request.method;
    const url = new URL(request.url);

    try {
        // Auto-Delete Expired
        const now = new Date().toISOString();
        await env.DB.prepare('DELETE FROM notices WHERE auto_delete_date IS NOT NULL AND auto_delete_date < ?').bind(now).run();

        // GET: Fetch List
        if (method === 'GET') {
            const { results } = await env.DB.prepare('SELECT * FROM notices ORDER BY created_at DESC').all();
            return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
        }

        // Auth Check
        const cookie = request.headers.get('Cookie') || '';
        if (!cookie.includes('admin_auth=true')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        // POST: Create Notice
        if (method === 'POST') {
            const body = await request.json();
            const pdfUrl = body.pdf_url ? body.pdf_url : null;
            const dateVal = body.auto_delete_date ? body.auto_delete_date : null;
            
            await env.DB.prepare('INSERT INTO notices (title, content, auto_delete_date, pdf_url) VALUES (?, ?, ?, ?)')
                .bind(body.title, body.content, dateVal, pdfUrl).run();
            return new Response(JSON.stringify({ success: true }));
        }

        // PUT: Edit Notice
        if (method === 'PUT') {
            const body = await request.json();
            const dateVal = body.auto_delete_date ? body.auto_delete_date : null;
            
            await env.DB.prepare('UPDATE notices SET title = ?, content = ?, auto_delete_date = ? WHERE id = ?')
                .bind(body.title, body.content, dateVal, body.id).run();
            return new Response(JSON.stringify({ success: true }));
        }

        // DELETE: Remove Notice
        if (method === 'DELETE') {
            const id = url.searchParams.get('id');
            const notice = await env.DB.prepare('SELECT pdf_url FROM notices WHERE id = ?').bind(id).first();
            if (notice && notice.pdf_url) {
                const key = notice.pdf_url.replace('/files/', '');
                await env.BUCKET.delete(key); 
            }
            await env.DB.prepare('DELETE FROM notices WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }));
        }
        return new Response('Method not allowed', { status: 405 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
