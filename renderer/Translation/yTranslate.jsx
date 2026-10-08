export async function yTranslate(text, apiKey = 'YOUR_YANDEX_API_KEY', folderId = 'YOUR_FOLDER_ID', targetLang = 'bua') {
    const url = `https://translate.api.cloud.yandex.net/translate/v2/translate`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Api-Key ${apiKey}`
            },
            body: JSON.stringify({
                texts: [text],
                targetLanguageCode: targetLang,
                sourceLanguageCode: 'auto',
                folderId: folderId,
                introspection: true
            })
        });

        const data = await response.json();

        if (response.ok) {
            return data.translations[0].text;
        } else {
            console.error('Yandex Translate error:', data.message);
            return 'Translation failed';
        }
    } catch (error) {
        console.error('Yandex Translate error:', error);
        return 'Translation failed';
    }
}