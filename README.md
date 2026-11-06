# buryad-ugenuug <a name="buryad-ugenuug"></a>

It is difficult to speak modern meanings in Buryat language, because there are no modern words in language. For example, if I want to say "Replace the light bulb in the kitchen fixture" or "Settings of app are located below" or "Wibecoding with AI", I can't figure out how to say this in Buryat, though I'm fluent speaker. So, we need a way to create new words in Buryat language, and this is main goal of "Buryad ugenuud". 
<br>How to create a new word? Suggest and ask people! User of "Buryad ugenuud" can create polls and vote for options. Poll is suggestion of translation of word from non Buryat language. Then user closes poll, and word creators save new translation, and new translation is available for all. Done!)
<br><br>There are many things TODO:
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
* Буряад корпус API?
* hint list of similar words during type of word for search
* Documentation:
  * README
  * User guide

This app is based on P2P platform [Pear](https://docs.pears.com/)
