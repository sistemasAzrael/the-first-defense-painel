# The First Defense — Central Online Base

Este pacote é a base para hospedar o sistema com login/senha, painel por jogador e acesso total do mestre.

## Arquivos principais

- `index.html` — tela de login.
- `central.html` — central com lista de personagens.
- `painel.html` — painel vivo final integrado.
- `firebase-config.js` — coloque aqui as credenciais do Firebase.
- `central.js` — carrega/salva personagens no Firestore.
- `login.js` — autenticação.
- `firestore.rules` — regras de segurança.

## Como usar

1. Crie um projeto no Firebase.
2. Ative Authentication > Email/Password.
3. Crie as contas dos jogadores.
4. Ative Firestore Database.
5. Cole suas credenciais em `firebase-config.js`.
6. Troque `MASTER_EMAIL` pelo seu e-mail.
7. Troque o e-mail do mestre também dentro de `firestore.rules`.
8. Publique no Firebase Hosting, Netlify ou Vercel.

## Estrutura de personagem no Firestore

Cole documentos em `characters` assim:

```json
{
  "name": "Nome do Personagem",
  "ownerEmail": "email-do-jogador@email.com",
  "panelData": {}
}
```

O mestre vê todos. O jogador vê apenas os documentos onde `ownerEmail` é o e-mail dele.
