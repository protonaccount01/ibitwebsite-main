export async function onRequestGet(context) {
    try {
        // D1 ডাটাবেজ থেকে সব নোটিশ তারিখ অনুযায়ী ফেচ করবে
        const { results } = await context.env.DB.prepare(
            "SELECT * FROM notices ORDER BY id DESC"
        ).all();

        return new Response(JSON.stringify(results), {
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
