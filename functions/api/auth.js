export async function onRequestPost(context) {
    const { request, env } = context;
    const body = await request.json();
    const { username, password } = body;

    const stmt = env.DB.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
    const user = await stmt.bind(username, password).first();

    if (user) {
        // HttpOnly রিমুভ করা হয়েছে যাতে ফ্রন্টএন্ড কুকি রিড করতে পারে
        return new Response(JSON.stringify({ success: true }), {
            headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': 'admin_auth=true; Path=/; Max-Age=86400' 
            }
        });
    }

    return new Response(JSON.stringify({ success: false, message: 'Invalid Credentials' }), { status: 401 });
}
