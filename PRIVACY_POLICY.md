# Buryad Ugenuud Privacy Policy

**Effective date:** November 10, 2026  

## 1. How the app works

Buryad Ugenuud is a peer-to-peer language collaboration app. It does not use a
publisher-operated account server or central database for user profiles or
language content. The app stores data on your device and replicates relevant
data directly between participating devices over the peer-to-peer network.
Network connections between peers use encrypted transport, but content
replicated to a language or account is available to other authorized
participants in that network. Do not treat shared language content as private.

## 2. Information the app handles

Depending on the features you use, the app may handle:

- **Profile information:** a nickname and, if you choose, a profile image.
  Nicknames are limited to 40 characters. Profile images can be up to 2 MiB;
  a smaller image of up to 80 KiB is used in language member profiles.
- **Account and device information:** cryptographic account and device keys,
  language membership and language keys, device name and platform, and pairing
  and authorization records. Pairing codes contain device and account
  identifiers and expire after 24 hours. Account data, including the account
  signing key used for actions, is replicated to devices paired to that
  account.
- **Language and contribution information:** language names and descriptions,
  translations and descriptions, poll questions and options, votes, comments,
  emoji reactions, and the associated author/account identifiers and
  timestamps. Language administrators can view member information for their
  language.
- **Images and videos you submit:** you may select images or videos for
  profile avatars, polls, comments, and translations. The app stores 
  submitted media in the relevant replicated content. Media may contain embedded metadata, such as location or camera details, so review files before sharing them.
- **Translation-service configuration:** a language administrator can enter
  Google Cloud Translation and Yandex Cloud Translate credentials and project
  or folder identifiers. In the current implementation these values are
  written to that language's replicated data and are not stored as private
  secrets. Other people with access to the language data may be able to read
  them. Do not enter credentials unless you accept that exposure; use
  revocable, least-privilege credentials and rotate any credentials that may
  have been exposed.
- **Technical and network information:** the peer-to-peer network necessarily
  processes network connection information, including IP addresses, to
  establish connections. The desktop app also writes worker output to a local
  log file. The app's current code does not include an advertising or analytics
  service that reports app activity to the publisher.

## 3. Translation searches and other services

When you search for a word using the app's Translate feature, the searched
text is sent to Google Cloud Translation, Yandex Cloud Translate, and the
Burlang translation API (`burlang.ru`) to request results. Google and Yandex
requests use the credentials configured for the selected language; a request
may fail if valid credentials have not been configured. There is no separate
per-provider toggle in the app. These providers receive the submitted text
and may process connection and request information under their own privacy
terms.

The peer-to-peer networking libraries connect participating devices without
the app's publisher acting as a content server. Other peers and the networking
infrastructure may process connection metadata, including IP addresses.
Downloading the app through an app store is also subject to that store's own
privacy terms.

## 4. Camera and selected files

The Android app requests camera access to scan a pairing QR code. On desktop,
camera access is requested for video-only camera use by the QR scanner. The
app does not use the camera to record or upload photos or video. You choose
images and videos through the device's file-selection interface when adding
an avatar or contribution; those files are shared as described above.

## 5. How information is used and shared

The app uses information to operate profiles, pair devices, replicate language
data, display contributions, and request translation results. Information is
shared as follows:

- Profile and account data are replicated to authorized paired devices.
- Language data and contributions are replicated to peers participating in
  that language. Anyone who obtains a language key and joins may be able to
  access its replicated data.
- Translation search text is sent to the translation providers described
  above.
- Connection metadata is processed by the peer-to-peer network to establish
  connections.

The publisher does not receive a copy of app content through a publisher-run
central service in the current implementation. The publisher cannot control
how other participants use information they can access.

## 6. Storage, security, and retention

App data is stored locally on your device and in peer replicas. Peer
connections use encrypted transport, but this does not make content
confidential from the peers that receive it. Protect your device and only pair
devices you trust.

Data on this device remains in its local app storage until it is removed by
the app, the operating system, or you clear the app's data. Uninstalling the
app may not remove all app data, depending on the platform. Android system
backups may include app data depending on your device and account settings.
Revoking a paired device causes that device to clear its local app data when
it receives the revocation. It does not erase copies already replicated to
other devices or backups.

Some data is maintained in append-only replicated records. Editing a profile
or removing a contribution from the app's current view may not remove earlier
records or copies held by other peers. The publisher cannot guarantee deletion
from devices or backups controlled by other participants.

## 7. Your choices

You may choose a nickname and whether to add an avatar, avoid submitting
personal or sensitive information in public language contributions, and avoid
using translation search when you do not want the search text sent to the
translation providers. You can ask a language administrator to remove
contributions where the app provides that capability, but removal may not
delete replicated history or copies on other devices.

## 8. Children and international use

The app is a general language-collaboration tool and does not ask users to
provide a date of birth. Peer-to-peer connections and third-party translation
services may route or process information in countries other than the one
where you live. Consider this before sharing personal information.

## 9. Changes to this policy

The publisher may update this policy when the app or its data practices
change. The effective date at the top will be updated when a revised policy
is published.
