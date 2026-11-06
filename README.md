# buryad-ugenuug <a name="buryad-ugenuug"></a>

<br>
Буряадаар мүнөө сагай юумэ хэлэхэдэ хүндэ байна, мүнөөни удхатай шэнэ үгэнүүд дутана. Жэшээнь, "Replace the light bulb in the kitchen fixture" али "Settings of app are located below" али "Wibecoding with AI" хайшагаад буряадаар хэлэхэб гэжэ ойлгоногүйб, буряадаар зугаалжа шадагшашьеһаа. Шэнэ үгэнүүды хэхэ арга манда хэрэгтэй, энэ "Буряад үгэнүүд"-эй гол зорилго.<br>
Хайшагаад шэнэ үгэ хэхэб? Дурадхаха теэд зонһоо һураха! "Буряад үгэнүүд"-эй хэрэглэгшэд асуулга хэжэ ба һаналаа үхэ аргатай. Асуулга хадаа шэнэ оршуулга шэлэхэ дурадхал болно. Асуулга хаагдаһанай һүлдэ, үгэ бэшэгшэд оршуулга бэшэжэ хадаглажа абна, тиигээд тэрэ шэнэ оршуулга хүнүүдтэ неэгдэнэ.<br><br>

---

Сложно говорить о современных вещах по бурятски, потому что нет современных слов в языке. Например, если я хочу сказать "Замени лампочку в светильнике на кухне" или "Настройки приложения расположены ниже" или "Вайбкодинг с ИИ", я не могу понять как это сказать на бурятском, хотя я носитель языка. Нам нужен способ создания новых слов в Бурятском языке, и это главная цель "Буряад үгэнүүд".<br>
Как создать новое слово? Предложить и спросить людей! Пользователи "Буряад үгэнүүд" могут создать опрос и голосовать. Опрос - это предложение перевода слова с другого языка. Когда опрос закрыт, создатели слов могут сохранить новый перевод, и этот перевод станет доступен для всех. Готово!) <br><br>

---

It is difficult to speak modern meanings in Buryat language, because there are no modern words in language. For example, if I want to say "Replace the light bulb in the kitchen fixture" or "Settings of app are located below" or "Wibecoding with AI", I can't figure out how to say this in Buryat, though I'm fluent speaker. So, we need a way to create new words in Buryat language, and this is main goal of "Buryad ugenuud". <br>
How to create a new word? Suggest and ask people! User of "Buryad ugenuud" can create polls and vote for options. Poll is suggestion of translation of word from other language. When poll is closed, and word creators save new translation, and new translation is available for all. Done!) <br><br>

There are many things TODO:
* V - Translation of words - save in db
* V - Search word for translation in saved words
* Built in translation into buryat by open source app or AI model
* V - Name, avatar of user
  * V - HEIC support
  * V - shrink photo till 2 Mb if it is bigger
* V - Pair other devices for the same user (signed 24-hour request/approval, direct encrypted transfer with copy-paste fallback)
* V - Roles, administator of language can assign roles to others
  * V - Administrator of language - can do anything in language
  * V - Vote closer - can close votes
  * V - Word creator - can add new words to translation database
  * V - Banned to create vote
  * V - Banned to comment
  * V - Admin's panel
  * V - User page opens from clickable nickname/avatar; admins can grant or remove roles
* V - Comments in poll
* V - Open last opened language
* Study plans (Courses):
  * Creation of exercises, steps
  * Studying by student(user), progress, correct/wrong
  * Moneytisation - creator can earn money - via restricted access?
  * Gamification
  * Daily events, goals
  * Leaderboard
* Translation API details does not show up for newly created language, due to isOwner is false. why? debug.
* V - Kinds of polls: translation poll
  * V - "Suggest translation" button in search translation panel, this button creates new translation poll for searched word
* V - Control panel for paired devices: revoke device - close access
* rearrange UI, pages, initial setup, menu, styling
* V - Burlang API
* V - i18n
* language's code from translation api details
* polls pagination, filters
  * open/closed polls are separate in db
  * additional indexes for fast search and sort
* V - QR code in pairing
* E2E tests
* Android device testing and Play submission (see mobile/README.md)
* iOS
* publish
* Windows store
* Ubuntu app store
* Ask for review
* antibot protection
* "report user" button, autoban system
* notifications
* make pairing flow easy
* Буряад корпус API? [http://corpora.imbtarchive.ru/](http://corpora.imbtarchive.ru/)
* hint list of similar words during type of word for search
* Documentation:
  * README
  * User guide

<br>
This app is based on P2P platform [Pear](https://docs.pears.com/)
