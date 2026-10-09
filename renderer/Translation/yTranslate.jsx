export async function yTranslate(text, apiKey = 'YOUR_YANDEX_API_KEY', folderId = 'YOUR_FOLDER_ID', targetLang = 'bua') {
    const url = `https://translate.api.cloud.yandex.net/translate/v2/translate`;

    try {
        return await window.bridge.yTranslate(text, apiKey, folderId, targetLang);
    } catch (error) {
        console.error('Yandex Translate error:', error);
        return 'Translation failed';
    }
}