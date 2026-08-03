export async function onRequestPost(context) {
    try {
        const formData = await context.request.formData();
        const title = formData.get('title');
        const description = formData.get('description') || '';
        const pdfFile = formData.get('pdf');

        let pdfUrl = null;

        // যদি পিডিএফ ফাইল আপলোড করা হয়ে থাকে তবে R2-তে ফাইল রাখবে
        if (pdfFile && pdfFile.name) {
            const fileName = `${Date.now()}-${pdfFile.name}`;
            await context.env.MY_R2_BUCKET.put(fileName, pdfFile.stream(), {
                httpMetadata: { contentType: 'application/pdf' }
            });
            // আপনার R2 Public Domain এর লিঙ্ক
            pdfUrl = `https://pub-r2.yourdomain.com/${fileName}`; 
        }

        // D1 Database-এ তথ্য Insert করা
        await context.env.DB.prepare(
            "INSERT INTO notices (title, description, pdf_url) VALUES (?, ?, ?)"
        ).bind(title, description, pdfUrl).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
