export async function yTranslate(text, yKey, yFolderID, targetLang = 'bua') {
    try {
        return await window.bridge.yTranslate(text, yKey, yFolderID, targetLang);
    } catch (error) {
        console.error('Yandex Translate error:', error);
        return 'Translation failed';
    }
}