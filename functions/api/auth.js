export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();

    const { username, password } = body;

    // Database check
    const stmt = env.DB.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
    const user = await stmt.bind(username, password).first();

    if (user) {
        // Successful login - Set a simple auth cookie
        return new Response(JSON.stringify({ success: true }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': 'admin_auth=true; Path=/; HttpOnly; Max-Age=86400' // 1 day expire
            }
        });
    }

    return new Response(JSON.stringify({ success: false, message: 'Invalid Credentials' }), { status: 401 });
}
