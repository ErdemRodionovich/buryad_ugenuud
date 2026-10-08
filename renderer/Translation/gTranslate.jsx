

export async function gTranslate(text, targetLang = 'bua') {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data[0].map(item => item[0]).join(' ');
    } catch (error) {
        console.error('Translation error:', error);
        return 'Translation failed';
    }
}