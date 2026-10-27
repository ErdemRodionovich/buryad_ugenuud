import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const localeStorageKey = 'buryad-ugenuud-locale'
const localeOptions = ['en', 'bua', 'ru']
const plurals = {
  en: {
    peer: { one: 'peer', other: 'peers' },
    vote: { one: 'vote', other: 'votes' },
    activeDevice: { one: 'active device', other: 'active devices' }
  },
  bua: {
    peer: { one: 'холболто', other: 'холболтонууд' },
    vote: { one: 'һанал', other: 'һанал' },
    activeDevice: { one: 'эдэбхитэй түхеэрэмжэ', other: 'эдэбхитэй түхеэрэмжэнүүд' }
  },
  ru: {
    peer: { one: 'узел', few: 'узла', many: 'узлов', other: 'узла' },
    vote: { one: 'голос', few: 'голоса', many: 'голосов', other: 'голоса' },
    activeDevice: {
      one: 'активное устройство',
      few: 'активных устройства',
      many: 'активных устройств',
      other: 'активного устройства'
    }
  }
}

const translations = {
  bua: {
    'Add a new translation': 'Шэнэ оршуулга нэмэхэ',
    'Add a new word translation': 'Шэнэ үгын оршуулга нэмэхэ',
    'Add another translation': 'Үшөө оршуулга нэмэхэ',
    'Add another word': 'Үшөө үгэ нэмэхэ',
    'Add another word for the same translation': 'Энэ оршуулгада үшөө үгэ нэмэхэ',
    'Add comment': 'Тайлбари нэмэхэ',
    'Add emoji': 'Эможи нэмэхэ',
    'Add media': 'Медиа нэмэхэ',
    'Add option': 'Шэлэлтэ нэмэхэ',
    'Add new translation': 'Шэнэ оршуулга нэмэхэ',
    'All languages': 'Бүхы хэлэнүүд',
    'Apply update': 'Шэнэлгэ оруулха',
    'Assign role': 'Эрхэ даалгаха',
    'Approval expires: {date}': 'Баталалга дүүрхэ: {date}',
    'Approval request': 'Баталалгын һуралта',
    'Approval expires': 'Баталалга дүүрхэ',
    'Approve request': 'һуралтые зүбшөөхэ',
    Avatar: 'Аватар',
    Back: 'Гэдэргээ',
    'Back to language': 'Хэлэндэ бусаха',
    'Banned from commenting': 'Тайлбари бэшэхэ эрхэгүй',
    'Banned from creating polls': 'Асуулга үүсхэхэ эрхэгүй',
    'Choose a nickname': 'Нэрэеэ бэшэгты',
    'Close menu': 'Меню хааха',
    'Close voting': 'Асуулга хааха',
    Comments: 'Тайлбаринууд',
    'Comment media': 'Тайлбарай медиа',
    'Copy account key': 'Бүридхэлэй түлхюур буулгаха',
    'Copy approval': 'Баталалга буулгаха',
    'Copy key': 'Түлхүүр буулгаха',
    'Copy request': 'Һуралта буулгаха',
    'Create a language': 'Хэлэ үүсхэхэ',
    'Create a profile for this device, or connect it to a profile you already use on another device.':
      'Энэ түхеэрэмжэдэ бүридхэл үүсхэхэ, али ондооһоо холбохо.',
    'Create pairing request': 'Холболгын һуралга үүсхэхэ',
    'Create the first one': 'Түрүүшын асуулга үүсхэхэ',
    'Create language': 'Хэлэ үүсхэхэ',
    'Description or context': 'Удха, тайлбари',
    Devices: 'Түхеэрэмжэнүүд',
    'Each media file must be 10 MB or smaller': 'Медиа файл бүхэн 10 МБ-һаа бага байха ёһотой',
    'Enter the word to translate': 'Оршуулха үгэ бэшэгты',
    'Enter word to translate': 'Оршуулха үгэ бэшэгты',
    'Language access': 'Хэлэнэй эрхэнүүд',
    'Language library': 'Хэлэнүүд',
    'Language members': 'Хэлэнэй гэшүүд',
    Languages: 'Хэлэнүүд',
    'Loading emojis…': 'Эможи аашаалагдана…',
    'Loading your profile…': 'Танай бүридхэл аашаалагдана…',
    'Make translation': 'Оршуулга хэхэ',
    'Manage roles': 'Эрхэнүүдые захирха',
    Menu: 'Меню',
    'Members and assigned roles': 'Гэшүүд ба олгогдоһон эрхэнүүд',
    'No comments yet. Start the discussion.': 'Тайлбари үгы байна. Хөөрэлдөө эхилэгты.',
    'No description': 'Тайлбари үгы',
    'No members or role assignments yet.': 'Гэшүүд ба эрхэ даалгабаринууд үгы байна.',
    'No polls yet. Start the first one.': 'Асуулганууд үгы байна. Түрүүшынхие үүсхэгты.',
    'No roles assigned.': 'Эрхэ олгогдоогүй.',
    'Not authorized': 'Зүбшөөл үгы',
    'Open conversations': 'Хөөрэлдөөнүүд',
    'Open menu': 'Меню неэхэ',
    'Option {number}': 'Шэлэлтэ {number}',
    'Pair another device': 'Ондоо түхеэрэмжэ холбохо',
    Pairing: 'Холболго',
    'Pair this device': 'Энэ түхеэрэмжэ холбохо',
    'Paired devices': 'Холбогдоһон түхеэрэмжэнүүд',
    'Paste language key': 'Хэлэнэй түлхюур бэшэгты',
    'Paste pairing approval': 'Холболгын баталалга бэшэгты',
    'Paste pairing request': 'Холболгын һуралга',
    Peer: 'Нэгэ холболто',
    Peers: 'Холболтонууд',
    Profile: 'Бүридхэл',
    'Publish poll': 'Асуулга ниитэлхэ',
    Refresh: 'Шэнэлхэ',
    'Refresh comments': 'Тайлбаринуудые шэнэлхэ',
    Remove: 'Арилгаха',
    'Remove avatar': 'Аватар арилгаха',
    'Remove comment': 'Тайлбари арилгаха',
    'Remove translation': 'Оршуулга арилгаха',
    'Remove word': 'Үгэ арилгаха',
    'Remove whole translation': 'Бүхы оршуулга арилгаха',
    'Request expires: {date}': 'Һуралга дүүрэхэ: {date}',
    Save: 'Хадагалха',
    'Save Translation': 'Оршуулга хадагалха',
    'Save profile': 'Бүридхэл хадагалха',
    'Search emojis': 'Эможи бэдэрхэ',
    'Select a poll to see the question and current results.':
      'Асуудал ба дүн харахын тулөө асуулга шэлэгты.',
    'Select source language': 'Эхэ хэлэ шэлэгты',
    'Set up profile': 'Бүридхэл хэхэ',
    'Set up your profile': 'Бүридхэлээ хэхэ',
    'Set up your profile or pair this device': 'Бүридхэлээ хэхэ, али түхеэрэмжэ холбохо',
    'Shared study spaces': 'Хамтын һуралсалай талмайнууд',
    'Short description': 'Тобшо тайлбари',
    'Suggest translation': 'Оршуулга дурадхаха',
    'The device is authorized for its current profile.':
      'Түхеэрэмжэ энэ бүридхэлдэ зүбшөөгдэнхэй.',
    'This device': 'Энэ түхеэрэмжэ',
    'This device · ': 'Энэ түхеэрэмжэ · ',
    'This device is not yet approved for the profile shown in the pairing code.':
      'Энэ түхеэрэмжэ холболгын кодто харуулагдаһан бүридхэлдэ үшөө зүбшөөгдөөгүй.',
    'This poll is closed. Comments are no longer accepted.':
      'Энэ асуулга хаагданхай. Тайлбари абтахаа болёо.',
    'Translation API details': 'Оршуулгын API мэдээсэлнүүд',
    'Translation text': 'Оршуулгын текст',
    'Translation {number}': 'Оршуулга {number}',
    'Translation poll': 'Оршуулгын асуулга',
    Translate: 'Оршуулха',
    'Translate from {language}: {words}': '{language} хэлэнһээ оршуулха: {words}',
    'Unknown user': 'Мэдэгдээгүй хүн',
    'Update failed: {message}': 'Шэнэлгэ болобогүй: {message}',
    'Update ready!': 'Шэнэлгэ бэлэн!',
    'Updating...': 'Шэнэлэгдэжэ байна…',
    'Use the 64-character account key': '64 үзэгтэй бүридхэлэй түлхюур хэрэгтэй',
    'Use the 64-character language key': '64 үзэгтэй хэлэнэй түлхюур хэрэгтэй',
    Welcome: 'Мэндээ',
    'What should we decide together?': 'Бидэ хамта юун тухай шиидхэхэбибди?',
    'Word creator': 'Үгэ нэмэхэ эрхэтэй',
    'Word to translate': 'Оршуулха үгэ',
    'Write a comment': 'Тайлбари бэшэхэ',
    'Your account key': 'Танай бүридхэлэй түлхюур',
    'Your languages': 'Танай хэлэнүүд',
    'Your profile': 'Танай бүридхэл',
    'You are not allowed to comment in this language.': 'Та энэ хэлэндэ тайлбари бэшэхэ эрхэгүйт.',
    'You have voted': 'Та һаналаа үгөөт',
    'Vote closer': 'Асуулга хааха эрхэтэй',
    administrator: 'Захирагша',
    'banned-create-vote': 'Һанал асуулга үүсхэхэ эрхэгүй',
    'banned-comment': 'Тайлбари бэшэхэ эрхэгүй',
    'word-creator': 'Үгэ нэмэхэ эрхэтэй',
    'vote-closer': 'Асуулга хааха эрхэтэй',
    'Account key (64 hexadecimal characters)': 'Бүридхэлэй түлхюур (64 арбан зургаанай үзэгтэй)',
    'Add reaction': 'Харюулга нэмэхэ',
    Administrator: 'Захирагша',
    'Approval code': 'Баталалгын код',
    'Ask the community': 'Хүүнүүдһээ асууха',
    'Avatar for {nickname}': '{nickname}-эй аватар',
    Burlang: 'Burlang',
    'Cast your vote': 'Һаналаа үгэгты',
    'Choose an image or video file': 'Зураг гү, али видео файл шэлэгты',
    Closed: 'Хаалгаатай',
    connected: 'холбогдонхой',
    'Create a request here, then paste it into an already-authorized device for approval.':
      'Эндэ һуралга үүсхээд, зүбшөөлтэй түхеэрэмжэдэ табижа баталуулагты.',
    'Create a language or join one with a shared key.':
      'Хэлэ үүсхэхэ, али хамтын түлхюүрээр орогты.',
    'Created by': 'Үүсхэгшэ',
    'Current roles': 'Мүнөө байһан эрхэнүүд',
    'Direct connection': 'Шууд холболго',
    'Edit translation': 'Оршуулга заһаха',
    'Grant or remove roles for language members, or assign a role using an account key.':
      'Хэлэнэй гэшүүдтэ эрхэ олгохо, хаһаха гү, али бүридхэлэй түлхюүрээр эрхэ даалгаха.',
    'Grant role': 'Эрхэ олгохо',
    'Google Cloud Project ID': 'Google Cloud проектын ID',
    'Google Translate API key': 'Google Translate API түлхюур',
    'Google translate': 'Google translate',
    'Interface language': 'Интерфейсэй хэлэн',
    'Join a language': 'Хэлэндэ орохо',
    'Join language': 'Хэлэндэ орохо',
    'Join user profile': 'Ондоо бүридхэл неэхэ',
    Language: 'Хэлэн',
    'Language name': 'Хэлэнэй нэрэ',
    'Language roles': 'Хэлэнэй эрхэнүүд',
    'Loading account key…': 'Бүридхэлэй түлхюур аашаалагдана…',
    'Main menu': 'Гол меню',
    'Media for this translation': 'Энэ оршуулгын медиа',
    'New poll': 'Шэнэ асуулга',
    No: 'Үгэ',
    'On an authorized device: approve': 'Зүбшөөлтэй түхеэрэмжэдэ: баталха',
    'On the device to add: create a request': 'Нэмэхэ түхеэрэмжэдэ: һуралга үүсхэхэ',
    'On the device to add: finish pairing': 'Нэмэхэ түхеэрэмжэдэ: холболго дүүргэхэ',
    Open: 'Неэлгээтэй',
    'Option {number} media': 'Шэлэлтэ {number}-эй медиа',
    'Pairing approval code': 'Холболгын баталалгын код',
    'Pairing request code': 'Холболгын һуралтын код',
    "Paste the new device's request and approve it. If both devices are online, the signed approval is sent over a direct encrypted connection; the code remains a fallback.":
      'Шэнэ түхеэрэмжын һуралга хээд баталаарайгты. Хоёр түхеэрэмжэ мүнөө хоюулаа хүдэлөө һаа, баталалга шифрлэгдэһэн шууд холболгоор дамжуулагдаха; үгэ һаа код хээрэгты ондоо түхеэрэмжэ руу.',
    'If the direct connection succeeds, this device joins automatically. Otherwise paste the 24-hour approval code here. Pairing replaces the current local profile and language list.':
      'Шууд холболго бии болоо һаа, түхеэрэмжэнүүд автоматаар нэгэдэхэ. Үгы һаа, 24 сагай баталалгын код эндэ хээрээт. Холболго мүнөөхи бүридхэл болон хэлэнүүдэй жагсаалтые һэлгэхэ.',
    'PNG, JPEG, WebP, GIF, or HEIC; up to 2 MiB is saved to your profile, with an 80 KiB copy for each language.':
      'PNG, JPEG, WebP, GIF, али HEIC; 2 МиБ хүрэтэр зураг бүридхэлдэ, 80 КиБ хүрэтэр хуби хэлэн бүхэндэ хадаглагдаха.',
    'Poll kind': 'Асуулгын түхэл',
    'Question media': 'Асуудалай медиа',
    'Remove {role}': '{role} хаһаха',
    'Remove {role} from {user}': '{user}-һээ {role} хаһаха',
    'Role to grant': 'Олгохо эрхэ',
    'Share your account key with a language administrator to be assigned roles.':
      'Эрхэ абахын тулөө бүридхэлэй түлхюүрээ хэлэнэй захирагшада үгэгты.',
    'Standard poll': 'Энгэй асуулга',
    'Source language': 'Эхэ хэлэн',
    'Suggest a translation for: {word}': 'Оршуулга дурадханаб: {word}',
    'The direct connection succeeds': 'Шууд холболго бии болоо',
    'This device is authorized for its current profile.':
      'Энэ түхеэрэмжэ мүнөөхи бүридхэлдэ зүбшөөгдэнхэй.',
    'Voting closed': 'Һанал абалга хаагдаба',
    Wait: 'Хүлеэхэ',
    'Waiting for the approved device to connect and authorize this installation.':
      'Зүбшөөһэн түхеэрэмжэ холбогдожо, энэ һуулгалтые баталхыень хүлеэнэ.',
    'Yandex Translate API key': 'Yandex Translate API түлхюур',
    'Yandex Translate folder ID': 'Yandex Translate folder ID',
    'Yandex translate': 'Yandex translate',
    'active devices': 'эдэбхитэй түхеэрэмжэнүүд',
    starting: 'эхилжэ байна',
    votes: 'һанал',
    Authorized: 'Зүбшөөлтэй',
    'Choose a PNG, JPEG, WebP, GIF, or HEIC image': 'PNG, JPEG, WebP, GIF, али HEIC зураг шэлэгты',
    'Could not compress avatar image': 'Аватарай зурагай хэмжээн багадхажа шадагдабагүй',
    'Could not compress avatar image to {size} or smaller':
      'Аватарай зурагай хэмжээн {size} гү, али бага болотор багадхажа шадагдабагүй',
    'Could not convert HEIC avatar to JPEG': 'HEIC аватарай зурагы JPEG болгожо шадагдабагүй',
    'Could not process avatar image': 'Аватарай зурагы болбосоруулжа шадагдабагүй',
    'Smileys & Emotion': 'Нюурэй баяр баясхалан',
    'People & Body': 'Хүн ба бэе',
    'Animals & Nature': 'Амитад ба байгаали',
    'Food & Drink': 'Эдеэн ба ундан',
    'Travel & Places': 'Аяншалга ба газарнууд',
    Activities: 'Ажал ябуулганууд',
    Objects: 'Юумэнүүд',
    Symbols: 'Тэмдэгүүд',
    Flags: 'Тугнууд',
    'Joined {date}': '{date} ороһон',
    Nickname: 'Нэрэ',
    'Role to grant to {user}': '{user}-дэ олгохо эрхэ',
    'Unable to compress avatar image': 'Аватарай зурагы багадхажа шадагдабагүй'
  },
  ru: {
    'Add a new translation': 'Добавить новый перевод',
    'Add a new word translation': 'Добавить перевод нового слова',
    'Add another translation': 'Добавить ещё один перевод',
    'Add another word': 'Добавить ещё одно слово',
    'Add another word for the same translation': 'Добавить ещё одно слово для этого перевода',
    'Add comment': 'Добавить комментарий',
    'Add emoji': 'Добавить эмодзи',
    'Add media': 'Добавить медиа',
    'Add option': 'Добавить вариант',
    'Add new translation': 'Добавить новый перевод',
    'All languages': 'Все языки',
    'Apply update': 'Установить обновление',
    'Assign role': 'Назначить роль',
    'Approval expires: {date}': 'Подтверждение истекает: {date}',
    'Approve request': 'Одобрить запрос',
    'Ask the community': 'Спросить сообщество',
    Avatar: 'Аватар',
    Back: 'Назад',
    'Back to language': 'Назад к языку',
    'Banned from commenting': 'Запрещено комментировать',
    'Banned from creating polls': 'Запрещено создавать опросы',
    'Cast your vote': 'Проголосовать',
    'Choose a nickname': 'Выберите имя',
    'Close menu': 'Закрыть меню',
    'Close voting': 'Закрыть голосование',
    Comments: 'Комментарии',
    'Comment media': 'Медиа комментария',
    'Copy account key': 'Скопировать ключ аккаунта',
    'Copy approval': 'Скопировать подтверждение',
    'Copy key': 'Скопировать ключ',
    'Copy request': 'Скопировать запрос',
    'Create a language': 'Создать язык',
    'Create a profile for this device, or connect it to a profile you already use on another device.':
      'Создайте профиль для этого устройства или подключите его к профилю, который уже используете на другом устройстве.',
    'Create a language or join one with a shared key.':
      'Создайте язык или присоединитесь к нему с помощью общего ключа.',
    'Create pairing request': 'Создать запрос на сопряжение',
    'Create language': 'Создать язык',
    'Current roles': 'Текущие роли',
    'Description or context': 'Описание или контекст',
    Devices: 'Устройства',
    'Each media file must be 10 MB or smaller':
      'Размер каждого медиафайла не должен превышать 10 МБ',
    'Enter the word to translate': 'Введите слово для перевода',
    'Enter word to translate': 'Введите слово для перевода',
    'Language access': 'Доступ к языку',
    'Language library': 'Библиотека языков',
    'Language members': 'Участники языка',
    Languages: 'Языки',
    'Loading emojis…': 'Загрузка эмодзи…',
    'Loading your profile…': 'Загрузка профиля…',
    'Make translation': 'Добавить перевод',
    'Manage roles': 'Управление ролями',
    Menu: 'Меню',
    'Members and assigned roles': 'Участники и назначенные роли',
    'No comments yet. Start the discussion.': 'Комментариев пока нет. Начните обсуждение.',
    'No description': 'Без описания',
    'No members or role assignments yet.': 'Пока нет участников и назначенных ролей.',
    'No polls yet. Start the first one.': 'Опросов пока нет. Создайте первый.',
    'No roles assigned.': 'Роли не назначены.',
    'Not authorized': 'Не авторизовано',
    'Open conversations': 'Открытые обсуждения',
    'Open menu': 'Открыть меню',
    'Option {number}': 'Вариант {number}',
    'Pair another device': 'Подключить другое устройство',
    Pairing: 'Сопряжение устройств',
    'Pair this device': 'Подключить это устройство',
    'Paired devices': 'Подключённые устройства',
    'Paste language key': 'Вставьте ключ языка',
    'Paste pairing approval': 'Вставьте подтверждение сопряжения',
    'Paste pairing request': 'Вставьте запрос на сопряжение',
    Peer: 'узел',
    Peers: 'узлы',
    Profile: 'Профиль',
    'Publish poll': 'Опубликовать опрос',
    Refresh: 'Обновить',
    'Refresh comments': 'Обновить комментарии',
    Remove: 'Удалить',
    'Remove avatar': 'Удалить аватар',
    'Remove comment': 'Удалить комментарий',
    'Remove translation': 'Удалить перевод',
    'Remove word': 'Удалить слово',
    'Remove whole translation': 'Удалить весь перевод',
    'Request expires: {date}': 'Запрос истекает: {date}',
    Save: 'Сохранить',
    'Save Translation': 'Сохранить перевод',
    'Save profile': 'Сохранить профиль',
    'Search emojis': 'Поиск эмодзи',
    'Select a poll to see the question and current results.':
      'Выберите опрос, чтобы увидеть вопрос и текущие результаты.',
    'Select source language': 'Выберите исходный язык',
    'Set up profile': 'Настроить профиль',
    'Set up your profile': 'Настройте профиль',
    'Set up your profile or pair this device': 'Настройте профиль или подключите это устройство',
    'Shared study spaces': 'Общие учебные пространства',
    'Short description': 'Краткое описание',
    'Suggest translation': 'Предложить перевод',
    'This device': 'Это устройство',
    'This device · ': 'Это устройство · ',
    'This device is authorized for its current profile.':
      'Это устройство авторизовано для текущего профиля.',
    'This poll is closed. Comments are no longer accepted.':
      'Опрос закрыт. Комментарии больше не принимаются.',
    'Translation API details': 'Настройки API перевода',
    'Translation text': 'Текст перевода',
    'Translation poll': 'Опрос о переводе',
    Translate: 'Перевести',
    'Translate from {language}: {words}': 'Перевести с языка {language}: {words}',
    'Unknown user': 'Неизвестный пользователь',
    'Update failed: {message}': 'Не удалось обновить: {message}',
    'Update ready!': 'Обновление готово!',
    'Updating...': 'Обновление…',
    'Use the 64-character account key': 'Используйте ключ аккаунта из 64 символов',
    'Use the 64-character language key': 'Используйте ключ языка из 64 символов',
    Welcome: 'Добро пожаловать',
    'What should we decide together?': 'Что нам решить вместе?',
    'Word creator': 'Создатель слов',
    'Word to translate': 'Слово для перевода',
    'Write a comment': 'Напишите комментарий',
    'Your account key': 'Ключ вашего аккаунта',
    'Your languages': 'Ваши языки',
    'Your profile': 'Ваш профиль',
    'You are not allowed to comment in this language.':
      'Вам запрещено комментировать на этом языке.',
    'You have voted': 'Вы проголосовали',
    'Vote closer': 'Модератор голосования',
    'Account key (64 hexadecimal characters)': 'Ключ аккаунта (64 шестнадцатеричных символа)',
    'Add reaction': 'Добавить реакцию',
    Administrator: 'Администратор',
    'Avatar for {nickname}': 'Аватар пользователя {nickname}',
    Burlang: 'Бурланг',
    'Choose an image or video file': 'Выберите изображение или видео',
    Closed: 'Закрыт',
    connected: 'подключено',
    'Create a request here, then paste it into an already-authorized device for approval.':
      'Создайте запрос здесь, затем вставьте его на уже авторизованном устройстве для подтверждения.',
    'Created by': 'Автор',
    'Direct connection': 'Прямое соединение',
    'Edit translation': 'Изменить перевод',
    'Grant or remove roles for language members, or assign a role using an account key.':
      'Назначайте и снимайте роли участников языка или назначьте роль по ключу аккаунта.',
    'Grant role': 'Назначить роль',
    'Google Cloud Project ID': 'Идентификатор проекта Google Cloud',
    'Google Translate API key': 'Ключ API Google Translate',
    'Google translate': 'Перевод Google',
    'Interface language': 'Язык интерфейса',
    'Join a language': 'Присоединиться к языку',
    'Join language': 'Присоединиться к языку',
    'Join user profile': 'Подключить профиль пользователя',
    Language: 'Язык',
    'Language name': 'Название языка',
    'Language roles': 'Роли языка',
    'Loading account key…': 'Загрузка ключа аккаунта…',
    'Main menu': 'Главное меню',
    'Media for this translation': 'Медиа для этого перевода',
    'New poll': 'Новый опрос',
    'On an authorized device: approve': 'На авторизованном устройстве: подтвердите',
    'On the device to add: create a request': 'На добавляемом устройстве: создайте запрос',
    'On the device to add: finish pairing': 'На добавляемом устройстве: завершите сопряжение',
    Open: 'Открыт',
    'Option {number} media': 'Медиа варианта {number}',
    'Pairing approval code': 'Код подтверждения сопряжения',
    'Pairing request code': 'Код запроса на сопряжение',
    "Paste the new device's request and approve it. If both devices are online, the signed approval is sent over a direct encrypted connection; the code remains a fallback.":
      'Вставьте запрос нового устройства и подтвердите его. Если оба устройства в сети, подписанное подтверждение будет отправлено по прямому зашифрованному соединению; код останется запасным вариантом.',
    'If the direct connection succeeds, this device joins automatically. Otherwise paste the 24-hour approval code here. Pairing replaces the current local profile and language list.':
      'Если прямое соединение установлено, устройство подключится автоматически. В противном случае вставьте сюда код подтверждения, действующий 24 часа. Сопряжение заменит текущий локальный профиль и список языков.',
    'PNG, JPEG, WebP, GIF, or HEIC; up to 2 MiB is saved to your profile, with an 80 KiB copy for each language.':
      'PNG, JPEG, WebP, GIF или HEIC; изображение размером до 2 МиБ сохраняется в профиле, копия до 80 КиБ — для каждого языка.',
    'Poll kind': 'Тип опроса',
    'Question media': 'Медиа вопроса',
    'Remove {role}': 'Удалить роль «{role}»',
    'Remove {role} from {user}': 'Снять роль «{role}» с {user}',
    'Role to grant': 'Роль для назначения',
    'Share your account key with a language administrator to be assigned roles.':
      'Чтобы получить роль, передайте ключ аккаунта администратору языка.',
    'Standard poll': 'Обычный опрос',
    'Source language': 'Исходный язык',
    'Suggest a translation for: {word}': 'Предложить перевод для: {word}',
    'This device is not yet approved for the profile shown in the pairing code.':
      'Это устройство ещё не одобрено для профиля, указанного в коде сопряжения.',
    'Translation {number}': 'Перевод {number}',
    'Voting closed': 'Голосование закрыто',
    'Waiting for the approved device to connect and authorize this installation.':
      'Ожидание подключения авторизованного устройства и подтверждения этой установки.',
    'Yandex Translate API key': 'Ключ API Yandex Translate',
    'Yandex Translate folder ID': 'Идентификатор папки Yandex Translate',
    'Yandex translate': 'Перевод Yandex',
    'active devices': 'активных устройств',
    administrator: 'Администратор',
    starting: 'подключение',
    votes: 'голосов',
    Authorized: 'Авторизовано',
    'Could not compress avatar image': 'Не удалось сжать изображение аватара',
    'Could not compress avatar image to {size} or smaller':
      'Не удалось сжать изображение аватара до {size} или меньше',
    'Could not convert HEIC avatar to JPEG': 'Не удалось преобразовать аватар HEIC в JPEG',
    'Could not process avatar image': 'Не удалось обработать изображение аватара',
    'Smileys & Emotion': 'Смайлы и эмоции',
    'People & Body': 'Люди и тело',
    'Animals & Nature': 'Животные и природа',
    'Food & Drink': 'Еда и напитки',
    'Travel & Places': 'Путешествия и места',
    Activities: 'Занятия',
    Objects: 'Предметы',
    Symbols: 'Символы',
    Flags: 'Флаги',
    'Choose a PNG, JPEG, WebP, GIF, or HEIC image':
      'Выберите изображение PNG, JPEG, WebP, GIF или HEIC',
    'Joined {date}': 'Дата присоединения: {date}',
    Nickname: 'Имя',
    'Role to grant to {user}': 'Роль для назначения пользователю {user}',
    'Unable to compress avatar image': 'Не удалось сжать изображение аватара'
  }
}

function getInitialLocale() {
  const savedLocale = window.localStorage.getItem(localeStorageKey)
  if (localeOptions.includes(savedLocale)) return savedLocale
  const browserLocale = window.navigator.language.toLowerCase()
  if (browserLocale.startsWith('ru')) return 'ru'
  if (browserLocale.startsWith('bua')) return 'bua'
  return 'en'
}

export const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale)

  useEffect(() => {
    window.localStorage.setItem(localeStorageKey, locale)
    window.document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale(nextLocale) {
        if (localeOptions.includes(nextLocale)) setLocaleState(nextLocale)
      },
      t(text, values = {}) {
        let translated = translations[locale]?.[text] || text
        for (const [key, value] of Object.entries(values)) {
          translated = translated.replaceAll(`{${key}}`, String(value))
        }
        return translated
      },
      plural(key, count) {
        const category = new Intl.PluralRules(locale).select(count)
        const forms = plurals[locale][key]
        return forms[category] || forms.other
      },
      languageName(code, fallback) {
        const displayLocale = locale === 'bua' ? 'bua-RU' : locale
        const name = new Intl.DisplayNames([displayLocale], { type: 'language' }).of(code)
        return name && name.toLowerCase() !== code.toLowerCase() ? name : fallback
      }
    }),
    [locale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n must be used within I18nProvider')
  return value
}
