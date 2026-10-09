export async function gTranslate(text, gKey, gProjectID, targetLang = 'bua') {
    try {
        return await window.bridge.gTranslate(text, gKey, gProjectID, targetLang)
    } catch (error) {
        console.error('Translation error:', error);
        return 'Translation failed';
    }
}